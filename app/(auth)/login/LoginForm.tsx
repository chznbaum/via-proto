"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";
import { trackEvent } from "@/components/SwetrixAnalytics";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createClient();

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, check if a user with this email exists by checking the profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      // If no profile exists, this is a new user - redirect to register
      if (!profile) {
        toast.error("No account found with this email. Please sign up first.");
        setIsLoading(false);
        // Give user time to read the message before redirecting
        setTimeout(() => {
          window.location.href = `/register?email=${encodeURIComponent(email)}`;
        }, 1500);
        return;
      }

      // User exists, send the magic link
      // Using page-based callback for better browser compatibility
      // (some browsers in private mode treat API redirects as downloads)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success("Check your email for the magic link!");
      trackEvent("auth.login_initiated", { unique: true });
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to send magic link");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="text-center">
        <div className="alert alert-success">
          <span className="iconify lucide--mail-check size-6" />
          <div>
            <h3 className="font-semibold">Check your email!</h3>
            <p className="text-sm">We've sent a magic link to <strong>{email}</strong></p>
          </div>
        </div>
        <button
          onClick={() => setEmailSent(false)}
          className="btn btn-ghost btn-sm mt-4"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleMagicLinkSignIn}>
        <div className="fieldset">
          <div className="space-y-2">
            <label className="fieldset-label" htmlFor="email">
              Email Address
            </label>
            <label className="input w-full">
              <span className="iconify lucide--mail text-base-content/80 size-5"></span>
              <input
                placeholder="you@example.com"
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !email}
          className="btn btn-primary btn-wide mt-6 max-w-full gap-3"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <span className="iconify lucide--send size-5" />
          )}
          Send Magic Link
          <span className="iconify lucide--arrow-right size-4" />
        </button>
      </form>

      <p className="text-base-content/80 mt-5 text-center text-sm md:mt-6">
        Don't have an account?
        <Link className="text-primary ms-1 hover:underline" href="/register">
          Create One
        </Link>
      </p>
    </>
  );
};
