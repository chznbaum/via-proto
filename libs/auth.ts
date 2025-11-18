import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import config from "@/config";
import { User } from "@supabase/supabase-js";

/**
 * Account with user's role information
 */
export interface AccountWithRole {
  account: {
    id: string;
    name: string;
    slug: string;
    account_type: "personal" | "team";
    seat_count: number;
    subscription_tier: "free" | "pro" | "team";
    subscription_status: "active" | "canceled" | "past_due" | "inactive";
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    paths_generated_this_cycle: number;
    cycle_start_date: string | null;
    created_at: string;
    updated_at: string;
  };
  role: "owner" | "admin" | "member";
}

/**
 * Account membership information
 */
export interface AccountMembership {
  id: string;
  user_id: string;
  account_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  created_at: string;
  accounts: AccountWithRole["account"];
}

/**
 * Require authentication. Redirects to login page if user is not authenticated.
 *
 * @returns Authenticated user object
 *
 * @example
 * ```typescript
 * // In a server component or API route
 * const user = await requireAuth();
 * ```
 */
export async function requireAuth(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(config.auth.loginUrl);
  }

  return user;
}

/**
 * Get all accounts that a user belongs to.
 *
 * @param userId - The user's ID
 * @returns Array of account memberships with account details
 *
 * @example
 * ```typescript
 * const user = await requireAuth();
 * const accounts = await getUserAccounts(user.id);
 * ```
 */
export async function getUserAccounts(
  userId: string
): Promise<AccountMembership[]> {
  const supabase = await createClient();

  // Get all account memberships for this user
  const { data: memberships, error: membershipError } = await supabase
    .from("account_users")
    .select("*")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  if (membershipError || !memberships) {
    console.error("Error fetching user accounts:", membershipError);
    return [];
  }

  // Get all account IDs
  const accountIds = memberships.map((m) => m.account_id);

  // Fetch all accounts in one query
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("*")
    .in("id", accountIds);

  if (accountsError || !accounts) {
    console.error("Error fetching accounts:", accountsError);
    return [];
  }

  // Combine memberships with accounts
  return memberships.map((membership) => ({
    ...membership,
    accounts: accounts.find((acc) => acc.id === membership.account_id)!,
  })) as AccountMembership[];
}

/**
 * Get the user's default account with their role.
 *
 * @param userId - The user's ID
 * @returns Account with role information, or null if not found
 *
 * @example
 * ```typescript
 * const user = await requireAuth();
 * const defaultAccount = await getUserDefaultAccount(user.id);
 * if (defaultAccount) {
 *   console.log(`User's default account: ${defaultAccount.account.name}`);
 * }
 * ```
 */
export async function getUserDefaultAccount(
  userId: string
): Promise<AccountWithRole | null> {
  const supabase = await createClient();

  // First, get the user's default_account_id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("default_account_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.default_account_id) {
    console.error("Error fetching user profile:", profileError);
    return null;
  }

  // Get the account membership
  const { data: membership, error: membershipError } = await supabase
    .from("account_users")
    .select("*")
    .eq("user_id", userId)
    .eq("account_id", profile.default_account_id)
    .single();

  if (membershipError || !membership) {
    console.error("Error fetching account membership:", membershipError);
    return null;
  }

  // Separately fetch the account details
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", profile.default_account_id)
    .single();

  if (accountError || !account) {
    console.error("Error fetching account:", accountError);
    return null;
  }

  return {
    account: account as AccountWithRole["account"],
    role: membership.role as "owner" | "admin" | "member",
  };
}

/**
 * Get a specific account with the user's role in that account.
 * Throws an error if the user is not a member of the account.
 *
 * @param userId - The user's ID
 * @param accountId - The account ID to fetch
 * @returns Account with role information
 * @throws Error if user is not a member of the account
 *
 * @example
 * ```typescript
 * const user = await requireAuth();
 * try {
 *   const { account, role } = await getAccountWithRole(user.id, accountId);
 *   console.log(`User has ${role} role in ${account.name}`);
 * } catch (error) {
 *   // User is not a member of this account
 * }
 * ```
 */
export async function getAccountWithRole(
  userId: string,
  accountId: string
): Promise<AccountWithRole> {
  const supabase = await createClient();

  // Get the account membership
  const { data: membership, error: membershipError } = await supabase
    .from("account_users")
    .select("*")
    .eq("user_id", userId)
    .eq("account_id", accountId)
    .single();

  if (membershipError || !membership) {
    throw new Error("Not a member of this account");
  }

  // Separately fetch the account details
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", accountId)
    .single();

  if (accountError || !account) {
    throw new Error("Account not found");
  }

  return {
    account: account as AccountWithRole["account"],
    role: membership.role as "owner" | "admin" | "member",
  };
}

/**
 * Require that the user has admin or owner role in the specified account.
 * Throws an error if the user is not an admin/owner.
 *
 * @param accountId - The account ID to check
 * @returns Object with user, account, and role information
 * @throws Error if user is not authenticated or not an admin/owner
 *
 * @example
 * ```typescript
 * // In an API route or server component
 * try {
 *   const { user, account, role } = await requireAccountAdmin(accountId);
 *   // Proceed with admin action
 * } catch (error) {
 *   // User is not authorized
 * }
 * ```
 */
export async function requireAccountAdmin(accountId: string): Promise<{
  user: User;
  account: AccountWithRole["account"];
  role: "owner" | "admin";
}> {
  const user = await requireAuth();
  const { account, role } = await getAccountWithRole(user.id, accountId);

  if (!["owner", "admin"].includes(role)) {
    throw new Error("Unauthorized: Admin access required");
  }

  return {
    user,
    account,
    role: role as "owner" | "admin",
  };
}

/**
 * Check if a user has a specific role (or higher) in an account.
 * Role hierarchy: owner > admin > member
 *
 * @param userId - The user's ID
 * @param accountId - The account ID to check
 * @param requiredRole - The minimum required role
 * @returns true if user has the required role or higher
 *
 * @example
 * ```typescript
 * const canManageMembers = await userHasRole(userId, accountId, "admin");
 * ```
 */
export async function userHasRole(
  userId: string,
  accountId: string,
  requiredRole: "owner" | "admin" | "member"
): Promise<boolean> {
  try {
    const { role } = await getAccountWithRole(userId, accountId);

    const roleHierarchy: Record<string, number> = {
      owner: 3,
      admin: 2,
      member: 1,
    };

    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  } catch {
    return false;
  }
}
