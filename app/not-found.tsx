"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface ErrorContext {
  url: string;
  referrer: string;
  userAgent: string;
  timestamp: string;
}

export default function RootNotFound() {
  const [email, setEmail] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorContext, setErrorContext] = useState<ErrorContext | null>(null);

  useEffect(() => {
    setErrorContext({
      url: window.location.href,
      referrer: document.referrer || "Direct navigation",
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!errorContext) return;

    setIsSubmitting(true);

    try {
      await fetch("/api/error-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "not-found",
          email: email || undefined,
          additionalInfo: additionalInfo || undefined,
          context: errorContext,
        }),
      });
      setSubmitted(true);
    } catch {
      // Silent fail for root error page
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <html lang="en">
      <head>
        <title>Page Not Found | ViaProto</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: "Fixel", "Fixel Fallback", system-ui, sans-serif;
            min-height: 100vh;
            background: #fafbfc;
            color: #1e2328;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }
          .container {
            max-width: 64rem;
            width: 100%;
          }
          .grid {
            display: grid;
            gap: 3rem;
            align-items: center;
          }
          @media (min-width: 1024px) {
            .grid { grid-template-columns: 1fr 1fr; }
            .content { order: 1; }
            .image-box { order: 2; }
          }
          .label {
            font-family: monospace;
            font-size: 0.875rem;
            font-weight: 500;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: rgba(30, 35, 40, 0.6);
          }
          .heading {
            font-family: "Young Serif", "Young Serif Fallback", Georgia, serif;
            font-size: clamp(1.5rem, 4vw, 2.5rem);
            font-weight: 600;
            color: #1e2328;
            margin-top: 0.5rem;
          }
          .description {
            color: rgba(30, 35, 40, 0.8);
            margin-top: 0.5rem;
            line-height: 1.6;
          }
          .form { margin-top: 2rem; }
          .form-group { margin-bottom: 1rem; }
          .input, .textarea {
            width: 100%;
            max-width: 20rem;
            padding: 0.75rem 1rem;
            border: 1px solid #dcdee0;
            border-radius: 0.25rem;
            font-size: 1rem;
            font-family: inherit;
            background: #ffffff;
            color: #1e2328;
          }
          .input:focus, .textarea:focus {
            outline: none;
            border-color: #006CFA;
            box-shadow: 0 0 0 3px rgba(0, 108, 250, 0.1);
          }
          .textarea { resize: vertical; min-height: 5rem; }
          .hint {
            font-size: 0.75rem;
            color: rgba(30, 35, 40, 0.6);
            font-style: italic;
            margin-top: 0.25rem;
          }
          .buttons { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.5rem; }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.25rem;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 0.25rem;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.15s;
            border: none;
            font-family: inherit;
          }
          .btn-primary {
            background: #006CFA;
            color: #ffffff;
          }
          .btn-primary:hover { background: #0055c8; }
          .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
          .btn-ghost {
            background: transparent;
            color: #1e2328;
            border: 1px solid #dcdee0;
          }
          .btn-ghost:hover { background: #eef0f2; }
          .image-box {
            background: #ffffff;
            border: 1px solid #eef0f2;
            border-radius: 0.25rem;
            padding: 2rem;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .image-box img { max-width: 100%; height: auto; }
          .success {
            background: rgba(0, 138, 61, 0.1);
            border: 1px solid rgba(0, 138, 61, 0.3);
            color: #008a3d;
            padding: 1rem;
            border-radius: 0.25rem;
            max-width: 20rem;
          }
          .success-title { font-weight: 500; }
          .success-text { font-size: 0.875rem; opacity: 0.8; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="grid">
            <div className="content">
              <p className="label">Not Found</p>
              <h1 className="heading">This page took a wrong turn</h1>
              <p className="description">
                The page you're looking for doesn't exist or may have moved.
              </p>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="form">
                  <div className="form-group">
                    <input
                      type="email"
                      placeholder="Email (optional, for follow-up)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div className="form-group">
                    <textarea
                      placeholder="What were you trying to do? (optional)"
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      className="textarea"
                      rows={3}
                    />
                  </div>
                  <p className="hint">Help us fix this by reporting the issue.</p>

                  <div className="buttons">
                    <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                      {isSubmitting ? "Sending..." : "Report Issue"}
                    </button>
                    <Link href="/" className="btn btn-ghost">
                      ← Go Home
                    </Link>
                  </div>
                </form>
              ) : (
                <div style={{ marginTop: "2rem" }}>
                  <div className="success">
                    <p className="success-title">Report submitted</p>
                    <p className="success-text">Thanks for letting us know. We'll look into it.</p>
                  </div>
                  <div className="buttons">
                    <Link href="/" className="btn btn-primary">
                      ← Go Home
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="image-box">
              <img
                src="/images/errors/undraw_page-not-found_6wni.svg"
                alt="Page not found"
              />
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
