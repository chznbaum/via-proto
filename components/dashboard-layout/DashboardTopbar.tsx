"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/libs/supabase/client";
import { TopbarSearchButton } from "./TopbarSearchButton";

export function DashboardTopbar() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [planTier, setPlanTier] = useState<string>("free");

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (user) {
        // Fetch profile data including avatar and default account
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url, name, default_account_id")
          .eq("id", user.id)
          .single();

        if (profile) {
          setAvatarUrl(profile.avatar_url);
          setDisplayName(profile.name || user.email?.split("@")[0] || "Account");

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
        } else {
          setDisplayName(user.email?.split("@")[0] || "Account");
        }
      }
    };

    getUser();
  }, [supabase]);

  return (
    <div
      role="navigation"
      aria-label="Navbar"
      className="flex items-center justify-between px-3"
      id="layout-topbar">
      <div className="inline-flex items-center gap-3">
        <label
          className="btn btn-square btn-ghost btn-sm group-has-[[id=layout-sidebar-hover-trigger]:checked]/html:hidden"
          aria-label="Leftmenu toggle"
          htmlFor="layout-sidebar-toggle-trigger">
          <span className="iconify lucide--menu size-5" />
        </label>
        <label
          className="btn btn-square btn-ghost btn-sm hidden group-has-[[id=layout-sidebar-hover-trigger]:checked]/html:flex"
          aria-label="Leftmenu toggle"
          htmlFor="layout-sidebar-hover-trigger">
          <span className="iconify lucide--menu size-5" />
        </label>
        <TopbarSearchButton />
      </div>
      <div className="inline-flex items-center gap-0.5">
        <label htmlFor="layout-rightbar-drawer" className="btn btn-circle btn-ghost btn-sm drawer-button">
          <span className="iconify lucide--settings-2 size-4.5" />
        </label>
        <label htmlFor="dashboard-account-drawer" className="btn btn-ghost max-sm:btn-square gap-2 px-1.5">
          <div className="avatar">
            <div className="bg-base-200 mask mask-squircle w-8">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  width={32}
                  height={32}
                />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center text-primary-content text-sm font-semibold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div className="text-start max-sm:hidden">
            <p className="text-sm/none">{displayName}</p>
            <p className="text-base-content/50 mt-0.5 text-xs/none">
              {planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
