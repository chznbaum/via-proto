"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

// List of available avatars
const AVATARS = [
  "/images/avatars/undraw_a-woman-avatar_ifsl.svg",
  "/images/avatars/undraw_avatar-traveler_ljy2.svg",
  "/images/avatars/undraw_businesswoman-avatar_ktl2.svg",
  "/images/avatars/undraw_chill-guy-avatar_tqsm.svg",
  "/images/avatars/undraw_cool-girl-avatar_fifz.svg",
  "/images/avatars/undraw_cool-guy-avatar_qjc4.svg",
  "/images/avatars/undraw_deep-thinker-avatar_6xg6.svg",
  "/images/avatars/undraw_designer-avatar_n5q8.svg",
  "/images/avatars/undraw_developer-avatar_f6ac.svg",
  "/images/avatars/undraw_female-avatar_7t6k.svg",
  "/images/avatars/undraw_finance-guy-avatar_vhop.svg",
  "/images/avatars/undraw_fitness-guy-avatar_50y6.svg",
  "/images/avatars/undraw_fitness-influencer-avatar_04j0.svg",
  "/images/avatars/undraw_friendly-guy-avatar_dqp5.svg",
  "/images/avatars/undraw_friendly-guy-avatar_ibbp.svg",
  "/images/avatars/undraw_male-athlete-avatar_dabn.svg",
  "/images/avatars/undraw_male-avatar_zkzx.svg",
  "/images/avatars/undraw_pic-profile_nr49.svg",
  "/images/avatars/undraw_professional-woman-avatar_ivds.svg",
  "/images/avatars/undraw_professor-avatar_y9ai.svg",
  "/images/avatars/undraw_profile-pic_fatv.svg",
  "/images/avatars/undraw_shy-guy-avatar_094a.svg",
  "/images/avatars/undraw_stylish-girl-avatar_m8po.svg",
  "/images/avatars/undraw_young-man-avatar_wgbd.svg",
];

export const RegisterForm = () => {
  const searchParams = useSearchParams();
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATARS[0]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createClient();

  // Pre-fill email from URL params if redirected from login
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleMagicLinkSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Store selected avatar and name in cookies for the callback
      document.cookie = `pendingAvatar=${encodeURIComponent(selectedAvatar)}; path=/; max-age=3600; SameSite=Lax`;
      if (name) {
        document.cookie = `pendingName=${encodeURIComponent(name)}; path=/; max-age=3600; SameSite=Lax`;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success("Check your email for the magic link!");
    } catch (error) {
      console.error("Signup error:", error);
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
            <p className="text-xs mt-1 text-base-content/60">
              Your avatar will be set up when you click the link
            </p>
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
      <form onSubmit={handleMagicLinkSignUp}>
        <div className="text-center mb-6">
          <p className="text-sm text-base-content/70">
            Choose your avatar to get started
          </p>
        </div>

        {/* Avatar Selection Grid */}
        <div className="max-h-80 overflow-y-auto pr-2 scrollbar-thin">
          <div className="grid grid-cols-4 gap-3">
            {AVATARS.map((avatar) => (
              <button
                key={avatar}
                type="button"
                onClick={() => setSelectedAvatar(avatar)}
                className={`avatar cursor-pointer transition-all hover:scale-110 ${
                  selectedAvatar === avatar
                    ? "ring-4 ring-primary ring-offset-2 ring-offset-base-100"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <div className="mask mask-circle w-full bg-base-200 p-1">
                  <img src={avatar} alt="Avatar option" className="w-full h-full object-cover" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Email Input (Required) */}
        <div className="fieldset mt-6">
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

        {/* Optional Name Input */}
        <div className="fieldset mt-4">
          <div className="space-y-2">
            <label className="fieldset-label" htmlFor="name">
              Display Name (Optional)
            </label>
            <label className="input w-full">
              <span className="iconify lucide--user text-base-content/80 size-5"></span>
              <input
                placeholder="Your name"
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
        Already have an account?
        <Link className="text-primary ms-1 hover:underline" href="/auth/login">
          Sign In
        </Link>
      </p>
    </>
  );
};
