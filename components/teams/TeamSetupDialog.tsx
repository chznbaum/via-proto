"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface TeamSetupDialogProps {
  accountId: string;
  accountName: string;
  onComplete: () => void;
  onClose: () => void;
}

export function TeamSetupDialog({
  accountId,
  accountName,
  onComplete,
  onClose,
}: TeamSetupDialogProps) {
  const [teamName, setTeamName] = useState(accountName);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [pendingInvites, setPendingInvites] = useState<
    Array<{ email: string; role: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const handleAddInvite = async () => {
    if (!inviteEmail.trim()) return;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check for duplicates
    if (pendingInvites.some((i) => i.email.toLowerCase() === inviteEmail.toLowerCase())) {
      toast.error("This email has already been added");
      return;
    }

    setIsInviting(true);

    try {
      const response = await fetch(`/api/accounts/${accountId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      setPendingInvites([...pendingInvites, { email: inviteEmail, role: inviteRole }]);
      setInviteEmail("");
      toast.success(`Invitation sent to ${inviteEmail}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send invitation";
      toast.error(message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveInvite = (email: string) => {
    setPendingInvites(pendingInvites.filter((i) => i.email !== email));
  };

  const handleComplete = async () => {
    if (!teamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update account name and mark setup as complete
      const accountResponse = await fetch(`/api/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamName.trim(),
          needs_setup: false,
        }),
      });

      if (!accountResponse.ok) {
        const data = await accountResponse.json();
        throw new Error(data.error || "Failed to update team");
      }

      toast.success("Team setup complete!");
      onComplete();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to complete setup";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="iconify lucide--users size-8 text-secondary" />
          </div>
          <h3 className="font-bold text-xl">Welcome to your Team!</h3>
          <p className="text-base-content/70 mt-2">
            Let&apos;s set up your team account to get started.
          </p>
        </div>

        {/* Team Name */}
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text font-medium">Team Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            placeholder="Enter your team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            maxLength={100}
          />
          <label className="label">
            <span className="label-text-alt">
              Choose a name that represents your team or organization
            </span>
          </label>
        </div>

        {/* Invite Members */}
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text font-medium">Invite Team Members</span>
            <span className="label-text-alt text-base-content/60">Optional</span>
          </label>

          <div className="flex gap-2">
            <input
              type="email"
              className="input input-bordered flex-1"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddInvite();
                }
              }}
            />
            <select
              className="select select-bordered w-28 shrink-0"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddInvite}
              disabled={!inviteEmail.trim() || isInviting}
            >
              {isInviting ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <span className="iconify lucide--plus size-4" />
              )}
            </button>
          </div>

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <div className="mt-3 space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.email}
                  className="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="iconify lucide--mail size-4 text-base-content/60" />
                    <span className="text-sm">{invite.email}</span>
                    <span className="badge badge-xs badge-outline">
                      {invite.role}
                    </span>
                    <span className="badge badge-xs badge-success">Sent</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => handleRemoveInvite(invite.email)}
                  >
                    <span className="iconify lucide--x size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            className="btn btn-ghost flex-1"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Skip for Now
          </button>
          <button
            type="button"
            className="btn btn-primary flex-1"
            onClick={handleComplete}
            disabled={isSubmitting || !teamName.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-xs" />
                Completing...
              </>
            ) : (
              <>
                <span className="iconify lucide--check size-4" />
                Complete Setup
              </>
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/50" />
    </div>
  );
}
