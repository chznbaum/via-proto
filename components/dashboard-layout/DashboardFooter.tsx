import Link from "next/link";
import config from "@/config";

export const DashboardFooter = () => {
  return (
    <div className="-mt-2 flex items-center justify-between px-6 pb-4">
      <p className="text-sm text-base-content/75">
        © {new Date().getFullYear()} {config.appName}. All rights reserved.
      </p>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/privacy" className="text-base-content/75 hover:text-base-content transition-colors">
          Privacy
        </Link>
        <Link href="/terms" className="text-base-content/75 hover:text-base-content transition-colors">
          Terms
        </Link>
      </div>
    </div>
  );
};
