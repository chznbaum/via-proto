/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/libs/supabase/client";
import apiClient from "@/libs/api";
import { AccountSwitcher } from "./AccountSwitcher";

interface Account {
  id: string;
  name: string;
  account_type: string;
  subscription_tier: string;
}

export function DashboardAccountDrawer() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [planTier, setPlanTier] = useState<string>("free");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string>("");

  // Check if teams feature is enabled (client-side check for visibility)
  const [teamsEnabled, setTeamsEnabled] = useState(false);

  useEffect(() => {
    // Check if teams is enabled by attempting to read from public env var
    // Since this needs to match server behavior, we'll assume false by default
    setTeamsEnabled(false);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (user) {
        setUserEmail(user.email || "");

        // Fetch profile data including avatar and default account
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url, name, default_account_id")
          .eq("id", user.id)
          .single();

        if (profile) {
          setAvatarUrl(profile.avatar_url);
          setDisplayName(profile.name || user.email?.split("@")[0] || "Account");
          setCurrentAccountId(profile.default_account_id || "");

          // Fetch account subscription tier
          if (profile.default_account_id) {
            const { data: account } = await supabase
              .from("accounts")
              .select("subscription_tier")
              .eq("id", profile.default_account_id)
              .single();

            if (account) {
              setPlanTier(account.subscription_tier);
            }
          }

          // Fetch all user accounts for the switcher
          const { data: memberships } = await supabase
            .from("account_users")
            .select("account_id")
            .eq("user_id", user.id);

          if (memberships && memberships.length > 0) {
            const accountIds = memberships.map((m) => m.account_id);
            const { data: userAccounts } = await supabase
              .from("accounts")
              .select("id, name, account_type, subscription_tier")
              .in("id", accountIds);

            if (userAccounts) {
              setAccounts(userAccounts);
            }
          }
        } else {
          setDisplayName(user.email?.split("@")[0] || "Account");
        }
      }
    };

    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleBilling = async () => {
    setIsLoading(true);

    try {
      const { url }: { url: string } = await apiClient.post(
        "/stripe/create-portal",
        {
          returnUrl: window.location.href,
        }
      );

      window.location.href = url;
    } catch (e) {
      console.error(e);
    }

    setIsLoading(false);
  };

  return (
    <div className="drawer drawer-end">
      <input id="dashboard-account-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-side z-50">
        <label
          htmlFor="dashboard-account-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <div className="h-full w-72 p-2 sm:w-84">
          <div className="bg-base-100 rounded-box relative flex h-full flex-col pt-4 sm:pt-8">
            <label
              htmlFor="dashboard-account-drawer"
              className="btn btn-xs btn-circle btn-ghost absolute start-2 top-2"
              aria-label="Close"
            >
              <span className="iconify lucide--x size-4" />
            </label>

            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="avatar bg-base-200 isolate size-20 cursor-pointer overflow-hidden rounded-full px-1 pt-1 md:size-24">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="User Avatar"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center text-primary-content text-2xl font-semibold">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="bg-base-100 absolute end-0 bottom-0 flex items-center justify-center rounded-full p-1.5 shadow-sm">
                  <span className="iconify lucide--pencil size-4" />
                </div>
              </div>

              <p className="mt-4 text-lg/none font-medium sm:mt-8">{displayName}</p>
              <p className="text-base-content/75 mt-1 text-sm">{userEmail}</p>

              {/* Plan badge */}
              <div className="mt-3">
                <div className="badge badge-primary badge-sm">
                  {planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan
                </div>
              </div>
            </div>

            {/* Account Switcher - show when user has multiple accounts */}
            {accounts.length > 1 && (
              <div className="border-base-300 mt-4 border-t border-dashed px-4 pt-4">
                <p className="text-xs font-medium text-base-content/60 uppercase tracking-wider mb-2">
                  Switch Account
                </p>
                <AccountSwitcher
                  accounts={accounts}
                  currentAccountId={currentAccountId}
                />
              </div>
            )}

            <div className="border-base-300 mt-4 grow overflow-auto border-t border-dashed px-2 sm:mt-6">
              <ul className="menu w-full p-2">
                <li className="menu-title">Account</li>
                {teamsEnabled && (
                  <li>
                    <Link href="/account">
                      <span className="iconify lucide--settings size-4.5" />
                      <span>Account Settings</span>
                    </Link>
                  </li>
                )}
                <li>
                  <button onClick={handleBilling} disabled={isLoading}>
                    <span className="iconify lucide--credit-card size-4.5" />
                    <span>Billing</span>
                    {isLoading && <span className="loading loading-spinner loading-xs" />}
                  </button>
                </li>

                <li className="menu-title">Resources</li>
                {teamsEnabled && (
                  <li>
                    <Link href="/docs" target="_blank">
                      <span className="iconify lucide--book-open size-4.5" />
                      <span>Documentation</span>
                    </Link>
                  </li>
                )}
                <li>
                  <button
                    onClick={async () => {
                      const { Crisp } = await import("crisp-sdk-web");
                      Crisp.chat.show();
                      Crisp.chat.open();
                    }}
                  >
                    <span className="iconify lucide--help-circle size-4.5" />
                    <span>Support</span>
                  </button>
                </li>

                <li>
                  <button
                    className="text-error hover:bg-error/10"
                    onClick={handleSignOut}
                  >
                    <span className="iconify lucide--log-out size-4.5" />
                    <span>Sign Out</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Upgrade CTA - only show when teams are enabled */}
            {teamsEnabled && (
              <div className="rounded-box from-primary to-secondary text-primary-content m-4 mt-auto flex cursor-pointer flex-col items-center justify-center bg-linear-to-br p-4 text-center transition-all hover:opacity-95 sm:p-6">
                <div className="bg-primary-content/10 border-primary-content/10 flex items-center justify-center rounded-full border p-1.5 sm:p-2.5">
                  <span className="iconify lucide--zap size-5 sm:size-6" />
                </div>
                <p className="mt-2 font-mono text-[11px] font-medium tracking-wider uppercase opacity-70 sm:mt-4">
                  Upgrade your plan
                </p>
                <p className="mt-1 leading-none font-medium sm:text-lg">
                  Unlock <span className="font-semibold underline">unlimited</span> paths
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
