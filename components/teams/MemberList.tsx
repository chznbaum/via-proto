"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface Member {
  user_id: string;
  name: string;
  avatar_url: string | null;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

interface MemberListProps {
  accountId: string;
  members: Member[];
  currentUserId: string;
  currentUserRole: "owner" | "admin" | "member";
  onMemberRemoved: (userId: string) => void;
  onRoleChanged: (userId: string, newRole: string) => void;
  onOwnershipTransferred: (newOwnerId: string) => void;
}

export function MemberList({
  accountId,
  members,
  currentUserId,
  currentUserRole,
  onMemberRemoved,
  onRoleChanged,
  onOwnershipTransferred,
}: MemberListProps) {
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [confirmingTransfer, setConfirmingTransfer] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState<string | null>(null);

  const canManageMembers = ["owner", "admin"].includes(currentUserRole);
  const isOwner = currentUserRole === "owner";

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingUserId(userId);

    try {
      const response = await fetch(
        `/api/accounts/${accountId}/members/${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update role");
      }

      toast.success(`Role updated to ${newRole}`);
      onRoleChanged(userId, newRole);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update role";
      toast.error(message);
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setLoadingUserId(userId);
    setConfirmingRemove(null);

    try {
      const response = await fetch(
        `/api/accounts/${accountId}/members/${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove member");
      }

      toast.success(data.message);
      onMemberRemoved(userId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove member";
      toast.error(message);
    } finally {
      setLoadingUserId(null);
    }
  };

  const handleTransferOwnership = async (userId: string) => {
    setLoadingUserId(userId);
    setConfirmingTransfer(null);

    try {
      const response = await fetch(
        `/api/accounts/${accountId}/members/${userId}/transfer-ownership`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to transfer ownership");
      }

      toast.success("Ownership transferred successfully");
      onOwnershipTransferred(userId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to transfer ownership";
      toast.error(message);
    } finally {
      setLoadingUserId(null);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "owner":
        return "badge-primary";
      case "admin":
        return "badge-secondary";
      default:
        return "badge-outline";
    }
  };

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isSelf = member.user_id === currentUserId;
        const isLoading = loadingUserId === member.user_id;
        const canEditRole =
          canManageMembers &&
          member.role !== "owner" &&
          !isSelf &&
          (isOwner || member.role !== "admin");
        const canRemove =
          member.role !== "owner" &&
          (canManageMembers || isSelf) &&
          (isOwner || member.role !== "admin" || isSelf);

        return (
          <div
            key={member.user_id}
            className="flex items-center gap-3 p-3 rounded-lg bg-base-200"
          >
            {/* Avatar */}
            <div className="avatar placeholder">
              <div className="w-10 rounded-full bg-primary text-primary-content">
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Name and Role */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{member.name}</span>
                {isSelf && (
                  <span className="badge badge-xs badge-ghost">You</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`badge badge-xs ${getRoleBadgeClass(member.role)}`}
                >
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
                <span className="text-xs text-base-content/60">
                  Joined{" "}
                  {new Date(member.joined_at).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* Actions */}
            {isLoading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <div className="flex items-center gap-2">
                {/* Role Dropdown */}
                {canEditRole && (
                  <select
                    className="select select-bordered select-xs"
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.user_id, e.target.value)
                    }
                    disabled={isLoading}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                )}

                {/* Transfer Ownership Button (Owner only) */}
                {isOwner && !isSelf && (
                  <>
                    {confirmingTransfer === member.user_id ? (
                      <div className="flex items-center gap-1">
                        <button
                          className="btn btn-xs btn-warning"
                          onClick={() =>
                            handleTransferOwnership(member.user_id)
                          }
                        >
                          Confirm
                        </button>
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={() => setConfirmingTransfer(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => setConfirmingTransfer(member.user_id)}
                        title="Transfer ownership"
                      >
                        <span className="iconify lucide--crown size-4" />
                      </button>
                    )}
                  </>
                )}

                {/* Remove Button */}
                {canRemove && (
                  <>
                    {confirmingRemove === member.user_id ? (
                      <div className="flex items-center gap-1">
                        <button
                          className="btn btn-xs btn-error"
                          onClick={() => handleRemoveMember(member.user_id)}
                        >
                          {isSelf ? "Leave" : "Remove"}
                        </button>
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={() => setConfirmingRemove(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="btn btn-xs btn-ghost text-error"
                        onClick={() => setConfirmingRemove(member.user_id)}
                        title={isSelf ? "Leave team" : "Remove member"}
                      >
                        <span className="iconify lucide--x size-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {members.length === 0 && (
        <div className="text-center py-8 text-base-content/60">
          <span className="iconify lucide--users size-8 mb-2" />
          <p>No members yet</p>
        </div>
      )}
    </div>
  );
}
