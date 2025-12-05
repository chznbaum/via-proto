"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
import { createClient } from "@/libs/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface AccountUpdate {
  id: string;
  subscription_tier: string;
}

export function UpgradeProcessingModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [isVisible, setIsVisible] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for upgrade param and initialize
  useEffect(() => {
    const isUpgraded = searchParams?.get("upgraded") === "true";

    if (!isUpgraded) return;

    const initialize = async () => {
      // Get user's default account
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("default_account_id")
        .eq("id", user.id)
        .single();

      if (!profile?.default_account_id) return;

      // Get current subscription tier
      const { data: account } = await supabase
        .from("accounts")
        .select("subscription_tier")
        .eq("id", profile.default_account_id)
        .single();

      if (!account) return;

      // If already upgraded (webhook processed before redirect), just clean up URL
      if (account.subscription_tier !== "free") {
        const tierName = account.subscription_tier.charAt(0).toUpperCase() + account.subscription_tier.slice(1);
        toast.success(`Welcome to ${tierName}!`);

        // Remove query param and refresh to get updated server data
        window.location.href = pathname || "/dashboard";
        return;
      }

      // Show modal and set up realtime subscription
      setAccountId(profile.default_account_id);
      setCurrentTier(account.subscription_tier);
      setIsVisible(true);
    };

    initialize();
  }, [searchParams, supabase, pathname]);

  // Set up realtime subscription when modal becomes visible
  useEffect(() => {
    if (!isVisible || !accountId) return;

    // Subscribe to changes on this specific account
    const channel = supabase
      .channel(`account-upgrade-${accountId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "accounts",
          filter: `id=eq.${accountId}`,
        },
        (payload) => {
          const newRecord = payload.new as AccountUpdate;

          // Check if tier changed from current (free)
          if (newRecord.subscription_tier && newRecord.subscription_tier !== currentTier) {
            const tierName = newRecord.subscription_tier.charAt(0).toUpperCase() + newRecord.subscription_tier.slice(1);
            toast.success(`Welcome to ${tierName}!`);

            // Clean up and refresh
            cleanup();
            window.location.href = pathname || "/dashboard";
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Timeout after 60 seconds - webhook should have processed by then
    timeoutRef.current = setTimeout(() => {
      toast.error("Upgrade is taking longer than expected. Please refresh the page or contact support if this persists.");
      cleanup();
      // Remove query param but don't refresh - let user decide
      router.replace(pathname || "/dashboard");
    }, 60000);

    return () => {
      cleanup();
    };
  }, [isVisible, accountId, currentTier, supabase, pathname, router]);

  const cleanup = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-primary/10 rounded-full p-4">
            <span className="iconify lucide--sparkles text-primary size-8 animate-pulse" />
          </div>

          <div>
            <h3 className="text-lg font-semibold">Activating Your Upgrade</h3>
            <p className="text-base-content/70 mt-2">
              We're processing your subscription. This usually takes just a moment...
            </p>
          </div>

          <span className="loading loading-spinner loading-lg text-primary" />

          <p className="text-base-content/50 text-xs">
            Please don't close this page
          </p>
        </div>
      </div>
      <div className="modal-backdrop bg-base-300/80" />
    </div>
  );
}
