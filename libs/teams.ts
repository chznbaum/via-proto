import { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { sendEmail } from "@/libs/resend";
import { generateAccountSlug } from "@/libs/accounts";
import config from "@/config";

/**
 * Generate a secure invitation token
 * Uses 32 bytes of random data encoded as base64url (no padding)
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Default invitation expiry: 7 days from now
 */
export function getInvitationExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
}

interface CreateTeamAccountOptions {
  userId: string;
  name: string;
  seatCount: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  needsSetup?: boolean;
}

interface TeamAccount {
  id: string;
  name: string;
  slug: string;
  account_type: string;
  seat_count: number;
  subscription_tier: string;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  needs_setup: boolean;
}

/**
 * Create a team account for a user who already has a personal account.
 * Sets the user as owner of the new team account.
 *
 * @param options - Team creation options
 * @param supabase - Supabase client (should be service role for bypassing RLS)
 * @returns The created team account
 */
export async function createTeamAccount(
  options: CreateTeamAccountOptions,
  supabase: SupabaseClient
): Promise<TeamAccount> {
  const {
    userId,
    name,
    seatCount,
    stripeCustomerId,
    stripeSubscriptionId,
    needsSetup = true,
  } = options;

  const slug = await generateAccountSlug(name, supabase);

  // Create the team account
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .insert({
      name,
      slug,
      account_type: "team",
      seat_count: seatCount,
      subscription_tier: "team",
      subscription_status: "active",
      stripe_customer_id: stripeCustomerId || null,
      stripe_subscription_id: stripeSubscriptionId || null,
      needs_setup: needsSetup,
      paths_generated_this_cycle: 0,
      cycle_start_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (accountError || !account) {
    throw new Error(`Failed to create team account: ${accountError?.message}`);
  }

  // Add user as owner
  const { error: linkError } = await supabase.from("account_users").insert({
    account_id: account.id,
    user_id: userId,
    role: "owner",
  });

  if (linkError) {
    // Attempt cleanup
    await supabase.from("accounts").delete().eq("id", account.id);
    throw new Error(`Failed to link user to team account: ${linkError.message}`);
  }

  return account as TeamAccount;
}

interface CreateInvitationOptions {
  accountId: string;
  invitedByUserId: string;
  email: string;
  role: "admin" | "member";
}

interface Invitation {
  id: string;
  account_id: string;
  invited_by_user_id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

/**
 * Create an invitation record in the database.
 * Does NOT send the email - use sendInvitationEmail separately.
 *
 * @param options - Invitation options
 * @param supabase - Supabase client
 * @returns The created invitation
 */
export async function createInvitation(
  options: CreateInvitationOptions,
  supabase: SupabaseClient
): Promise<Invitation> {
  const { accountId, invitedByUserId, email, role } = options;

  // Check if there's already a pending invitation for this email
  const { data: existing } = await supabase
    .from("account_invitations")
    .select("id")
    .eq("account_id", accountId)
    .eq("email", email.toLowerCase())
    .is("accepted_at", null)
    .single();

  if (existing) {
    throw new Error("An invitation is already pending for this email address");
  }

  // Check if user is already a member
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (profile) {
    const { data: membership } = await supabase
      .from("account_users")
      .select("id")
      .eq("account_id", accountId)
      .eq("user_id", profile.id)
      .single();

    if (membership) {
      throw new Error("This user is already a member of this team");
    }
  }

  const token = generateInvitationToken();
  const expiresAt = getInvitationExpiry();

  const { data: invitation, error } = await supabase
    .from("account_invitations")
    .insert({
      account_id: accountId,
      invited_by_user_id: invitedByUserId,
      email: email.toLowerCase(),
      role,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error || !invitation) {
    throw new Error(`Failed to create invitation: ${error?.message}`);
  }

  return invitation as Invitation;
}

interface SendInvitationEmailOptions {
  email: string;
  accountName: string;
  inviterName: string;
  token: string;
  role: string;
}

/**
 * Send an invitation email to the invitee.
 *
 * @param options - Email options
 */
export async function sendInvitationEmail(
  options: SendInvitationEmailOptions
): Promise<void> {
  const { email, accountName, inviterName, token, role } = options;

  const inviteUrl = `https://${config.domainName}/invite/${token}`;
  const roleDisplay = role === "admin" ? "an admin" : "a member";

  const subject = `You've been invited to join ${accountName} on ${config.appName}`;

  const text = `
${inviterName} has invited you to join ${accountName} as ${roleDisplay} on ${config.appName}.

Click the link below to accept the invitation:
${inviteUrl}

This invitation expires in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${config.appName}</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
    <h2 style="margin-top: 0; color: #1f2937;">You're Invited!</h2>

    <p style="font-size: 16px; color: #4b5563;">
      <strong>${inviterName}</strong> has invited you to join <strong>${accountName}</strong> as ${roleDisplay} on ${config.appName}.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280;">
      This invitation expires in 7 days.
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

    <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
  `.trim();

  await sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}

/**
 * Add a user to a team account with the specified role.
 * Used when accepting an invitation.
 *
 * @param userId - The user ID to add
 * @param accountId - The account ID to add them to
 * @param role - The role to assign
 * @param supabase - Supabase client
 */
export async function addUserToAccount(
  userId: string,
  accountId: string,
  role: "owner" | "admin" | "member",
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase.from("account_users").insert({
    account_id: accountId,
    user_id: userId,
    role,
  });

  if (error) {
    throw new Error(`Failed to add user to account: ${error.message}`);
  }
}

/**
 * Transfer ownership of an account to another member.
 * The current owner becomes an admin.
 *
 * @param accountId - The account ID
 * @param currentOwnerId - Current owner's user ID
 * @param newOwnerId - New owner's user ID
 * @param supabase - Supabase client
 */
export async function transferOwnership(
  accountId: string,
  currentOwnerId: string,
  newOwnerId: string,
  supabase: SupabaseClient
): Promise<void> {
  // Verify new owner is a member
  const { data: membership } = await supabase
    .from("account_users")
    .select("id, role")
    .eq("account_id", accountId)
    .eq("user_id", newOwnerId)
    .single();

  if (!membership) {
    throw new Error("Target user is not a member of this account");
  }

  // Update new owner's role
  const { error: newOwnerError } = await supabase
    .from("account_users")
    .update({ role: "owner" })
    .eq("account_id", accountId)
    .eq("user_id", newOwnerId);

  if (newOwnerError) {
    throw new Error(`Failed to update new owner: ${newOwnerError.message}`);
  }

  // Demote current owner to admin
  const { error: oldOwnerError } = await supabase
    .from("account_users")
    .update({ role: "admin" })
    .eq("account_id", accountId)
    .eq("user_id", currentOwnerId);

  if (oldOwnerError) {
    // Attempt to rollback
    await supabase
      .from("account_users")
      .update({ role: membership.role })
      .eq("account_id", accountId)
      .eq("user_id", newOwnerId);
    throw new Error(`Failed to demote current owner: ${oldOwnerError.message}`);
  }
}

/**
 * Check if an account has reached its seat limit.
 *
 * @param accountId - The account ID
 * @param supabase - Supabase client
 * @returns Object with current count and limit
 */
export async function checkSeatLimit(
  accountId: string,
  supabase: SupabaseClient
): Promise<{ currentCount: number; seatLimit: number; hasRoom: boolean }> {
  const { data: account } = await supabase
    .from("accounts")
    .select("seat_count")
    .eq("id", accountId)
    .single();

  if (!account) {
    throw new Error("Account not found");
  }

  const { count } = await supabase
    .from("account_users")
    .select("*", { count: "exact", head: true })
    .eq("account_id", accountId);

  const currentCount = count || 0;
  const seatLimit = account.seat_count;

  return {
    currentCount,
    seatLimit,
    hasRoom: currentCount < seatLimit,
  };
}
