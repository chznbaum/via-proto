"use client";

import { User } from "@supabase/supabase-js";
import { createClient } from "@/libs/supabase/client";
import { useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import config from "@/config";
import { ConfigProvider } from "@/contexts/config";
import { TeamSetupDialog } from "@/components/teams/TeamSetupDialog";

// Crisp customer chat support:
// This component is separated from ClientLayout because it needs to be wrapped with <SessionProvider> to use useSession() hook
const CrispChat = (): null => {
  const pathname = usePathname();

  const supabase = createClient();
  const [data, setData] = useState<{ user: User } | null>(null);

  // This is used to get the user data from Supabase Auth (if logged in) => user ID is used to identify users in Crisp
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setData({ user });
      }
    };
    getUser();
  }, [supabase, pathname]);

  useEffect(() => {
    if (!config?.crisp?.id) return;

    const crispId = config.crisp.id;

    // Dynamic import to keep Crisp SDK out of initial bundle
    import("crisp-sdk-web").then(({ Crisp }) => {
      Crisp.configure(crispId);

      // (Optional) If onlyShowOnRoutes array is not empty in config.js file, Crisp will be hidden on the routes in the array.
      // Use <AppButtonSupport> instead to show it (user clicks on the button to show Crisp—it cleans the UI)
      if (
        config.crisp.onlyShowOnRoutes &&
        pathname &&
        !config.crisp.onlyShowOnRoutes?.includes(pathname)
      ) {
        Crisp.chat.hide();
        Crisp.chat.onChatClosed(() => {
          Crisp.chat.hide();
        });
      }
    });
  }, [pathname]);

  // Add User Unique ID to Crisp to easily identify users when reaching support (optional)
  useEffect(() => {
    if (data?.user && config?.crisp?.id) {
      import("crisp-sdk-web").then(({ Crisp }) => {
        Crisp.session.setData({ userId: data.user?.id });
      });
    }
  }, [data]);

  return null;
};

// Team setup checker: Shows dialog when user has team account needing setup
interface AccountNeedingSetup {
  id: string;
  name: string;
}

const TeamSetupChecker = () => {
  const pathname = usePathname();
  const supabase = createClient();
  const [accountNeedingSetup, setAccountNeedingSetup] = useState<AccountNeedingSetup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only check on dashboard routes
    if (!pathname?.startsWith("/dashboard") && !pathname?.startsWith("/skills")) {
      setIsLoading(false);
      return;
    }

    const checkForSetup = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get user's account memberships
        const { data: memberships } = await supabase
          .from("account_users")
          .select("account_id")
          .eq("user_id", user.id);

        if (!memberships || memberships.length === 0) {
          setIsLoading(false);
          return;
        }

        const accountIds = memberships.map((m) => m.account_id);

        // Check for any accounts needing setup
        const { data: accountsNeedingSetup } = await supabase
          .from("accounts")
          .select("id, name")
          .in("id", accountIds)
          .eq("needs_setup", true)
          .limit(1);

        if (accountsNeedingSetup && accountsNeedingSetup.length > 0) {
          setAccountNeedingSetup(accountsNeedingSetup[0]);
        }
      } catch (error) {
        console.error("Error checking for team setup:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkForSetup();
  }, [supabase, pathname]);

  const handleComplete = () => {
    setAccountNeedingSetup(null);
    window.location.reload();
  };

  const handleClose = async () => {
    if (accountNeedingSetup) {
      try {
        await fetch(`/api/accounts/${accountNeedingSetup.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ needs_setup: false }),
        });
      } catch (error) {
        console.error("Error marking setup as skipped:", error);
      }
    }
    setAccountNeedingSetup(null);
  };

  if (isLoading || !accountNeedingSetup) {
    return null;
  }

  return (
    <TeamSetupDialog
      accountId={accountNeedingSetup.id}
      accountName={accountNeedingSetup.name}
      onComplete={handleComplete}
      onClose={handleClose}
    />
  );
};

// All the client wrappers are here (they can't be in server components)
// 1. NextTopLoader: Show a progress bar at the top when navigating between pages
// 2. Toaster: Show Success/Error messages anywhere from the app with toast()
// 3. CrispChat: Set Crisp customer chat support (see above)
const ClientLayout = ({ children }: { children: ReactNode }) => {
  return (
    <ConfigProvider>
      {/* Show a progress bar at the top when navigating between pages */}
      <NextTopLoader color={config.colors.main} showSpinner={false} />

      {/* Content inside app/page.js files  */}
      {children}

      {/* Show Success/Error messages anywhere from the app with toast() */}
      <Toaster
        toastOptions={{
          duration: 3000,
        }}
      />

      {/* Set Crisp customer chat support */}
      <CrispChat />

      {/* Check for team accounts needing setup */}
      <TeamSetupChecker />
    </ConfigProvider>
  );
};

export default ClientLayout;
