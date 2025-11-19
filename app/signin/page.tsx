"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Redirect to new auth pages
export default function OldSignInRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth/login");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="mt-4 text-base-content/70">Redirecting to sign in...</p>
      </div>
    </div>
  );
}
