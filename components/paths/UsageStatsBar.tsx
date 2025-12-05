import Link from "next/link";

interface UsageStatsBarProps {
  pathsUsed: number;
  pathsLimit: number;
  subscriptionTier: string;
}

export function UsageStatsBar({
  pathsUsed,
  pathsLimit,
  subscriptionTier,
}: UsageStatsBarProps) {
  const remaining = Math.max(0, pathsLimit - pathsUsed);
  const percentageUsed = (pathsUsed / pathsLimit) * 100;

  const getTierColor = () => {
    if (subscriptionTier === 'team') return 'text-purple-400';
    if (subscriptionTier === 'pro') return 'text-blue-400';
    return 'text-gray-400';
  };

  const getTierName = () => {
    if (subscriptionTier === 'team') return 'Team';
    if (subscriptionTier === 'pro') return 'Pro';
    return 'Free';
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Quick Insights Card */}
      <div className="card bg-base-100 h-full cursor-pointer p-4 shadow transition-all hover:shadow-md sm:col-span-2">
        <div className="flex justify-between">
          <p className="leading-none font-medium">Monthly Usage</p>
          <span className={`iconify lucide--chart-line size-5 ${getTierColor()}`}></span>
        </div>
        <div className="mt-3.5 flex h-full items-stretch gap-4 sm:gap-8">
          <div>
            <p className="text-2xl font-semibold">
              {pathsUsed}
              <span className="text-base-content/75 text-xl">/{pathsLimit}</span>
            </p>
            <p className="text-base-content/50 mt-auto pt-1 text-center text-sm/none">
              Paths Used
            </p>
          </div>
          <div className="border-base-300 h-full border-s border-dashed" />
          <div>
            <p className="text-2xl font-semibold">
              {remaining}
              <span className="text-base-content/75 text-xl"></span>
            </p>
            <p className="text-base-content/50 mt-auto pt-1 text-center text-sm/none">
              Remaining
            </p>
          </div>
          <div className="border-base-300 h-full border-s border-dashed max-sm:hidden" />
          <div className="max-sm:hidden">
            <p className="text-2xl font-semibold">
              {percentageUsed.toFixed(0)}%
              <span className="text-base-content/75 text-xl"></span>
            </p>
            <p className="text-base-content/50 mt-auto pt-1 text-center text-sm/none">
              Utilized
            </p>
          </div>
        </div>
      </div>

      {/* Current Plan */}
      <div className="card bg-base-100 cursor-pointer p-4 shadow transition-all hover:shadow-md">
        <div className="flex justify-between">
          <p className="text-sm/none">Current Plan</p>
          <span className={`iconify lucide--crown size-4 ${getTierColor()}`}></span>
        </div>
        <p className="mt-2 text-2xl font-medium">{getTierName()}</p>
        <div className="flex items-end justify-between gap-2">
          <p className="text-base-content/50 text-sm/none">
            {pathsLimit} paths/month
          </p>
        </div>
      </div>

      {/* Upgrade CTA (show for free and pro tiers) */}
      {(subscriptionTier === 'free' || subscriptionTier === 'pro') && (
        <div className="bg-neutral text-neutral-content card h-full p-3 shadow">
          <p className="text-lg/5.5 font-medium">
            {subscriptionTier === 'free' ? 'Upgrade to Pro' : 'Upgrade to Team'}
          </p>
          <div className="mt-auto flex items-end justify-between gap-3 pt-2">
            <div>
              <p className="text-sm/none italic opacity-80">
                {subscriptionTier === 'free'
                  ? 'Get 10 paths & premium models'
                  : 'Collaborate with your team'}
              </p>
            </div>
            <Link href="/upgrade" className="btn btn-sm rounded-full">
              Upgrade
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
