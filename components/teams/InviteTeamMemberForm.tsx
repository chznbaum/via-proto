"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface InviteTeamMemberFormProps {
  accountId: string;
  onInviteSent: () => void;
}

export function InviteTeamMemberForm({
  accountId,
  onInviteSent,
}: InviteTeamMemberFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/accounts/${accountId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      setRole("member");
      onInviteSent();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send invitation";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        className="input input-bordered flex-1"
        placeholder="Enter email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
      />
      <select
        className="select select-bordered"
        value={role}
        onChange={(e) => setRole(e.target.value as "admin" | "member")}
        disabled={isLoading}
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={isLoading || !email.trim()}
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <>
            <span className="iconify lucide--send size-4" />
            Invite
          </>
        )}
      </button>
    </form>
  );
}
