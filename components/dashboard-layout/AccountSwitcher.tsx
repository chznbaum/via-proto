"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface Account {
  id: string;
  name: string;
  account_type: string;
  subscription_tier: string;
}

interface AccountSwitcherProps {
  accounts: Account[];
  currentAccountId: string;
  onSwitch?: (account: Account) => void;
}

export function AccountSwitcher({
  accounts,
  currentAccountId,
  onSwitch,
}: AccountSwitcherProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSwitch = async (account: Account) => {
    if (account.id === currentAccountId) return;

    setIsLoading(account.id);

    try {
      const response = await fetch("/api/accounts/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_id: account.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to switch account");
      }

      toast.success(`Switched to ${account.name}`);

      if (onSwitch) {
        onSwitch(account);
      }

      // Refresh the page to update all account-dependent data
      window.location.reload();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to switch account";
      toast.error(message);
    } finally {
      setIsLoading(null);
    }
  };

  if (accounts.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-1">
      {accounts.map((account) => {
        const isCurrent = account.id === currentAccountId;
        const isTeam = account.account_type === "team";

        return (
          <button
            key={account.id}
            onClick={() => handleSwitch(account)}
            disabled={isCurrent || isLoading !== null}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
              isCurrent
                ? "bg-primary/10 cursor-default"
                : "hover:bg-base-200 cursor-pointer"
            }`}
          >
            {/* Account Avatar */}
            <div className="avatar placeholder">
              <div
                className={`w-8 rounded-full ${
                  isTeam ? "bg-secondary text-secondary-content" : "bg-primary text-primary-content"
                }`}
              >
                <span className="text-xs">
                  {isTeam ? (
                    <span className="iconify lucide--users size-4" />
                  ) : (
                    account.name.charAt(0).toUpperCase()
                  )}
                </span>
              </div>
            </div>

            {/* Account Info */}
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">{account.name}</p>
              <p className="text-xs text-base-content/60">
                {isTeam ? "Team" : "Personal"} &middot;{" "}
                {account.subscription_tier.charAt(0).toUpperCase() +
                  account.subscription_tier.slice(1)}
              </p>
            </div>

            {/* Status Indicator */}
            {isLoading === account.id ? (
              <span className="loading loading-spinner loading-xs" />
            ) : isCurrent ? (
              <span className="iconify lucide--check size-4 text-primary" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
