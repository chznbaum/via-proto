"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface AcceptInvitationButtonProps {
  token: string;
}

export function AcceptInvitationButton({ token }: AcceptInvitationButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept invitation");
      }

      toast.success(data.message || "You've joined the team!");

      // Redirect to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept invitation";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAccept}
      disabled={isLoading}
      className="btn btn-primary btn-lg"
    >
      {isLoading ? (
        <>
          <span className="loading loading-spinner loading-sm" />
          Joining...
        </>
      ) : (
        <>
          <span className="iconify lucide--check size-5" />
          Accept Invitation
        </>
      )}
    </button>
  );
}
