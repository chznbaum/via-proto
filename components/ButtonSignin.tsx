"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/libs/supabase/client";
import config from "@/config";
import { trackEvent } from "@/components/SwetrixAnalytics";

// A simple button to sign in or access dashboard.
// When logged out: shows "Sign In"
// When logged in: shows "Dashboard"
const ButtonSignin = ({
  text = "Sign In",
  extraStyle,
}: {
  text?: string;
  extraStyle?: string;
}) => {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getUser();
  }, [supabase]);

  if (user) {
    return (
      <Link
        href={config.auth.callbackUrl}
        className={`btn ${extraStyle ? extraStyle : ""}`}
        onClick={() => trackEvent("cta.nav.dashboard")}
      >
        Dashboard
      </Link>
    );
  }

  return (
    <Link
      className={`btn ${extraStyle ? extraStyle : ""}`}
      href={config.auth.loginUrl}
      onClick={() => trackEvent("cta.nav.sign_in")}
    >
      {text}
    </Link>
  );
};

export default ButtonSignin;
