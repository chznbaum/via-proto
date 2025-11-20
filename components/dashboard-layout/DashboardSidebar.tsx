"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SimpleBarCore from "simplebar-core";
// @ts-ignore
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { User } from "@supabase/supabase-js";

import { Logo } from "@/components/Logo";
import { useConfig } from "@/contexts/config";
import { createClient } from "@/libs/supabase/client";

import { ISidebarMenuItem, SidebarMenuItem } from "./SidebarMenuItem";
import { getActivatedItemParentKeys } from "./helpers";

export const DashboardSidebar = ({ menuItems }: { menuItems: ISidebarMenuItem[] }) => {
  const pathname = usePathname();
  const { calculatedSidebarTheme } = useConfig();
  const scrollRef = useRef<SimpleBarCore | null>(null);
  const hasMounted = useRef(false);
  const supabase = createClient();

  const [activatedParents, setActivatedParents] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("Account");
  const [planTier, setPlanTier] = useState<string>("free");

  useEffect(() => {
    setActivatedParents(getActivatedItemParentKeys(menuItems, pathname));
  }, [menuItems, pathname]);

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

  const onToggleActivated = (key: string) => {
    if (activatedParents.has(key)) {
      activatedParents.delete(key);
    } else {
      activatedParents.add(key);
    }
    setActivatedParents(new Set(activatedParents));
  };

  useEffect(() => {
    setTimeout(() => {
      const contentElement = scrollRef.current?.getContentElement();
      const scrollElement = scrollRef.current?.getScrollElement();
      if (contentElement) {
        const activatedItem = contentElement.querySelector<HTMLElement>(".active");
        const top = activatedItem?.getBoundingClientRect().top;
        if (activatedItem && scrollElement && top && top !== 0) {
          scrollElement.scrollTo({ top: scrollElement.scrollTop + top - 300, behavior: "smooth" });
        }
      }
    }, 100);
  }, [activatedParents, scrollRef]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (window.innerWidth <= 64 * 16) {
      const sidebarTrigger = document.querySelector<HTMLInputElement>("#layout-sidebar-toggle-trigger");
      if (sidebarTrigger) {
        sidebarTrigger.checked = false;
      }
    }
  }, [pathname]);

  return (
    <>
      <input
        type="checkbox"
        id="layout-sidebar-toggle-trigger"
        className="hidden"
        aria-label="Toggle layout sidebar"
      />
      <input
        type="checkbox"
        id="layout-sidebar-hover-trigger"
        className="hidden"
        aria-label="Dense layout sidebar"
      />
      <div id="layout-sidebar-hover" className="bg-base-300 h-screen w-1"></div>

      <div id="layout-sidebar" className="sidebar-menu flex flex-col" data-theme={calculatedSidebarTheme}>
        <div className="flex h-16 min-h-16 items-center justify-between gap-3 ps-5 pe-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <label
            htmlFor="layout-sidebar-hover-trigger"
            title="Toggle sidebar hover"
            className="btn btn-circle btn-ghost btn-sm text-base-content/50 relative max-lg:hidden">
            <span className="iconify lucide--panel-left-close absolute size-4.5 opacity-100 transition-all duration-300 group-has-[[id=layout-sidebar-hover-trigger]:checked]/html:opacity-0" />
            <span className="iconify lucide--panel-left-dashed absolute size-4.5 opacity-0 transition-all duration-300 group-has-[[id=layout-sidebar-hover-trigger]:checked]/html:opacity-100" />
          </label>
        </div>
        <div className="relative min-h-0 grow">
          <SimpleBar ref={scrollRef} className="size-full">
            <div className="mb-3 space-y-0.5 px-2.5">
              {menuItems.map((item, index) => (
                <SidebarMenuItem
                  {...item}
                  key={index}
                  activated={activatedParents}
                  onToggleActivated={onToggleActivated}
                />
              ))}
            </div>
          </SimpleBar>
          <div className="from-base-100/60 pointer-events-none absolute start-0 end-0 bottom-0 h-7 bg-linear-to-t to-transparent"></div>
        </div>

        <div className="mb-2">
          <hr className="border-base-300 my-2 border-dashed" />
          <label
            htmlFor="dashboard-account-drawer"
            className="bg-base-200 hover:bg-base-300 rounded-box mx-2 mt-0 flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-all">
            <div className="avatar">
              <div className="bg-base-200 mask mask-circle w-8">
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
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>
            <div className="grow -space-y-0.5">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-base-content/60 text-xs">
                {planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan
              </p>
            </div>
            <span className="iconify lucide--chevrons-up-down text-base-content/60 size-4" />
          </label>
        </div>
      </div>

      <label htmlFor="layout-sidebar-toggle-trigger" id="layout-sidebar-backdrop"></label>
    </>
  );
};
