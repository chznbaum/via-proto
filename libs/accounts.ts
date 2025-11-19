import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generate a URL-friendly slug from an account name.
 * Handles collisions by appending a random suffix.
 *
 * @param accountName - The name of the account
 * @param supabase - Supabase client instance
 * @returns A unique slug for the account
 */
export async function generateAccountSlug(
  accountName: string,
  supabase: SupabaseClient
): Promise<string> {
  // Convert to lowercase, replace spaces/special chars with hyphens
  let baseSlug = accountName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  // Ensure slug is not empty
  if (!baseSlug) {
    baseSlug = "account";
  }

  // Check for collisions
  let slug = baseSlug;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const { data, error } = await supabase
      .from("accounts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    // If no existing account with this slug, we're good
    if (!data && !error) {
      return slug;
    }

    // Collision detected, append random suffix
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    slug = `${baseSlug}-${randomSuffix}`;
    attempts++;
  }

  // Fallback: append timestamp if still colliding after max attempts
  return `${baseSlug}-${Date.now()}`;
}

/**
 * Create a personal account for a new user.
 * This is called during the initial sign-up flow.
 *
 * @param userId - The auth.users.id of the new user
 * @param userEmail - The user's email address
 * @param userName - The user's name (optional, falls back to email)
 * @param supabase - Supabase client with service role access
 * @param avatarUrl - The selected avatar URL (optional)
 * @returns Object containing account_id and profile_id
 */
export async function createPersonalAccount(
  userId: string,
  userEmail: string,
  userName: string | null,
  supabase: SupabaseClient,
  avatarUrl?: string | null
): Promise<{ accountId: string; profileId: string }> {
  // Generate account name
  // If user provided a name, use it. Otherwise, use a neutral default.
  const accountName = userName ? `${userName}'s Account` : "Personal Account";
  const slug = await generateAccountSlug(accountName, supabase);

  // 1. Create the personal account
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .insert({
      name: accountName,
      slug,
      account_type: "personal",
      seat_count: 1,
      subscription_tier: "free",
      subscription_status: "active",
      paths_generated_this_cycle: 0,
    })
    .select()
    .single();

  if (accountError || !account) {
    console.error("Error creating account:", accountError);
    throw new Error(`Failed to create personal account: ${accountError?.message}`);
  }

  // 2. Create the profile record
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email: userEmail,
      name: userName,
      avatar_url: avatarUrl,
      default_account_id: account.id,
    })
    .select()
    .single();

  if (profileError || !profile) {
    console.error("Error creating profile:", profileError);
    throw new Error(`Failed to create profile: ${profileError?.message}`);
  }

  // 3. Link user to account via account_users (with owner role)
  const { error: linkError } = await supabase
    .from("account_users")
    .insert({
      account_id: account.id,
      user_id: userId,
      role: "owner",
    });

  if (linkError) {
    console.error("Error linking user to account:", linkError);
    throw new Error(`Failed to link user to account: ${linkError?.message}`);
  }

  return {
    accountId: account.id,
    profileId: profile.id,
  };
}

/**
 * Check if a user already has a profile.
 *
 * @param userId - The auth.users.id to check
 * @param supabase - Supabase client instance
 * @returns true if profile exists, false otherwise
 */
export async function userHasProfile(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  return !error && data !== null;
}
