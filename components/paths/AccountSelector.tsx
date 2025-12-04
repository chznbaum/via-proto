"use client";

interface Account {
  id: string;
  name: string;
  account_type: "personal" | "team";
  subscription_tier: string;
  seat_count: number;
  paths_this_month: number;
}

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccountId: string;
  onSelect: (accountId: string) => void;
}

/**
 * Calculate rate limit based on subscription tier and seat count
 */
function getRateLimit(tier: string, seatCount: number): number {
  if (tier === "free") return 1;
  if (tier === "pro") return 5;
  if (tier === "team") {
    const additionalSeats = Math.max(0, seatCount - 2);
    return 10 + additionalSeats * 3;
  }
  return 1;
}

export function AccountSelector({
  accounts,
  selectedAccountId,
  onSelect,
}: AccountSelectorProps) {
  if (accounts.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-base-content/80">
        Create path in
      </label>
      <div className="grid gap-2">
        {accounts.map((account) => {
          const isSelected = account.id === selectedAccountId;
          const isTeam = account.account_type === "team";
          const limit = getRateLimit(account.subscription_tier, account.seat_count);
          const remaining = Math.max(0, limit - account.paths_this_month);
          const isAtLimit = remaining === 0;

          return (
            <button
              key={account.id}
              type="button"
              onClick={() => !isAtLimit && onSelect(account.id)}
              disabled={isAtLimit}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : isAtLimit
                    ? "border-base-300 bg-base-200 opacity-60 cursor-not-allowed"
                    : "border-base-300 hover:border-primary/50 cursor-pointer"
              }`}
            >
              {/* Account Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isTeam
                    ? "bg-secondary text-secondary-content"
                    : "bg-primary text-primary-content"
                }`}
              >
                {isTeam ? (
                  <span className="iconify lucide--users size-5" />
                ) : (
                  <span className="iconify lucide--user size-5" />
                )}
              </div>

              {/* Account Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{account.name}</span>
                  <span
                    className={`badge badge-xs ${
                      isTeam ? "badge-secondary" : "badge-primary"
                    }`}
                  >
                    {isTeam ? "Team" : "Personal"}
                  </span>
                  <span className="badge badge-xs badge-outline">
                    {account.subscription_tier.charAt(0).toUpperCase() +
                      account.subscription_tier.slice(1)}
                  </span>
                </div>
                <p className="text-xs text-base-content/60 mt-0.5">
                  {isAtLimit ? (
                    <span className="text-error">Monthly limit reached</span>
                  ) : (
                    <>
                      {remaining} of {limit} paths remaining this month
                    </>
                  )}
                </p>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <span className="iconify lucide--check size-5 text-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
