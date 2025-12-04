"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface Invitation {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
}

interface PendingInvitationsListProps {
  accountId: string;
  invitations: Invitation[];
  onInvitationRevoked: (invitationId: string) => void;
}

export function PendingInvitationsList({
  accountId,
  invitations,
  onInvitationRevoked,
}: PendingInvitationsListProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRevoke = async (invitationId: string) => {
    setLoadingId(invitationId);

    try {
      const response = await fetch(
        `/api/accounts/${accountId}/invitations/${invitationId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to revoke invitation");
      }

      toast.success("Invitation revoked");
      onInvitationRevoked(invitationId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to revoke invitation";
      toast.error(message);
    } finally {
      setLoadingId(null);
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-base-content/70">
        Pending Invitations
      </h4>
      <div className="space-y-2">
        {invitations.map((invitation) => {
          const isExpired = new Date(invitation.expires_at) < new Date();
          const isLoading = loadingId === invitation.id;

          return (
            <div
              key={invitation.id}
              className={`flex items-center justify-between p-3 rounded-lg bg-base-200 ${
                isExpired ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="iconify lucide--mail size-4 text-base-content/60" />
                <div>
                  <span className="text-sm">{invitation.email}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="badge badge-xs badge-outline">
                      {invitation.role}
                    </span>
                    {isExpired ? (
                      <span className="text-xs text-error">Expired</span>
                    ) : (
                      <span className="text-xs text-base-content/60">
                        Expires{" "}
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isLoading ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <button
                  className="btn btn-xs btn-ghost text-error"
                  onClick={() => handleRevoke(invitation.id)}
                  title="Revoke invitation"
                >
                  <span className="iconify lucide--x size-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
