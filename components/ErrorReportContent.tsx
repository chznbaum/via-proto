"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ErrorReportContentProps {
  type: "error" | "not-found";
  error?: Error;
  reset?: () => void;
}

interface ErrorContext {
  url: string;
  referrer: string;
  userAgent: string;
  timestamp: string;
  errorMessage?: string;
  errorStack?: string;
}

export function ErrorReportContent({
  type,
  error,
  reset,
}: ErrorReportContentProps) {
  const [email, setEmail] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errorContext, setErrorContext] = useState<ErrorContext | null>(null);

  // Capture error context on mount (client-side only)
  useEffect(() => {
    setErrorContext({
      url: window.location.href,
      referrer: document.referrer || "Direct navigation",
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      errorMessage: error?.message,
      errorStack: error?.stack,
    });
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!errorContext) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/error-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          email: email || undefined,
          additionalInfo: additionalInfo || undefined,
          context: errorContext,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit report");
      }

      setSubmitted(true);
    } catch (err) {
      setSubmitError("Failed to submit report. Please try again.");
      console.error("Error report submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isNotFound = type === "not-found";
  const imageSrc = isNotFound
    ? "/images/errors/undraw_page-not-found_6wni.svg"
    : "/images/errors/undraw_server-error_syuz.svg";

  return (
    <div className="relative flex grow flex-col justify-center py-6 sm:py-12">
      <div className="grid grid-cols-1 gap-8 sm:gap-16 lg:grid-cols-2 lg:gap-12">
        {/* Left side - Content & Form */}
        <div className="order-2 lg:order-1">
          <p className="text-base-content/60 font-mono text-sm font-medium tracking-[2px] uppercase">
            {isNotFound ? "Not Found" : "Error"}
          </p>
          <h1 className="font-serif mt-2 text-2xl font-semibold sm:text-3xl xl:text-4xl">
            {isNotFound
              ? "This page took a wrong turn"
              : "Something went wrong"}
          </h1>
          <p className="text-base-content/80 mt-2">
            {isNotFound
              ? "The page you're looking for doesn't exist or may have moved."
              : "We encountered an unexpected error. Our team has been notified."}
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="mt-8 sm:mt-12 lg:mt-16">
              <div className="space-y-4">
                <div>
                  <label className="input w-full max-w-xs">
                    <span className="iconify lucide--mail text-base-content/60 size-5"></span>
                    <input
                      name="email"
                      placeholder="Email (optional, for follow-up)"
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                </div>

                <div>
                  <textarea
                    id="additionalInfo"
                    className="textarea textarea-bordered w-full max-w-xs"
                    placeholder="What were you trying to do? (optional)"
                    rows={3}
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                  />
                </div>
              </div>

              <p className="text-base-content/60 mt-1 text-xs italic sm:text-sm">
                Help us fix this by reporting the issue.
              </p>

              {submitError && (
                <p className="text-error mt-2 text-sm">{submitError}</p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary gap-2"
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <span className="iconify lucide--send size-4"></span>
                  )}
                  Report Issue
                </button>

                {reset && (
                  <button
                    type="button"
                    onClick={reset}
                    className="btn btn-ghost gap-2"
                  >
                    <span className="iconify lucide--refresh-cw size-4"></span>
                    Try Again
                  </button>
                )}

                <Link href="/" className="btn btn-ghost gap-2">
                  <span className="iconify lucide--home size-4"></span>
                  Go Home
                </Link>
              </div>
            </form>
          ) : (
            <div className="mt-8 sm:mt-12 lg:mt-16">
              <div className="alert alert-success max-w-xs">
                <span className="iconify lucide--check-circle size-5"></span>
                <div>
                  <p className="font-medium">Report submitted</p>
                  <p className="text-sm opacity-80">
                    Thanks for letting us know. We'll look into it.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {reset && (
                  <button onClick={reset} className="btn btn-primary gap-2">
                    <span className="iconify lucide--refresh-cw size-4"></span>
                    Try Again
                  </button>
                )}
                <Link href="/" className="btn btn-ghost gap-2">
                  <span className="iconify lucide--home size-4"></span>
                  Go Home
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Image */}
        <div className="border-base-200 rounded-box bg-base-100 shadow-base-content/5 order-1 flex items-center justify-center p-6 shadow-lg transition-all hover:shadow-xl lg:order-2">
          <img
            src={imageSrc}
            alt={isNotFound ? "Page not found" : "Server error"}
            className="w-full max-w-sm"
          />
        </div>
      </div>
    </div>
  );
}
