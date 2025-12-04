"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { MemberList } from "@/components/teams/MemberList";
import { InviteTeamMemberForm } from "@/components/teams/InviteTeamMemberForm";
import { PendingInvitationsList } from "@/components/teams/PendingInvitationsList";

interface Account {
  id: string;
  name: string;
  account_type: string;
  subscription_tier: string;
  seat_count: number;
}

interface Member {
  user_id: string;
  name: string;
  avatar_url: string | null;
  role: "owner" | "admin" | "member";
  joined_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
}

interface Pricing {
  unitAmount: number;
  currency: string;
  interval: string;
}

interface TeamSettingsClientProps {
  account: Account;
  currentUserId: string;
  currentUserRole: "owner" | "admin" | "member";
  initialMembers: Member[];
  initialInvitations: Invitation[];
  pricing?: Pricing | null;
}

export function TeamSettingsClient({
  account,
  currentUserId,
  currentUserRole,
  initialMembers,
  initialInvitations,
  pricing,
}: TeamSettingsClientProps) {
  const router = useRouter();
  const [teamName, setTeamName] = useState(account.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
  const [seatCount, setSeatCount] = useState(account.seat_count);
  const [isUpdatingSeats, setIsUpdatingSeats] = useState(false);

  const canManageTeam = ["owner", "admin"].includes(currentUserRole);
  const isOwner = currentUserRole === "owner";

  // Calculate seat usage
  const usedSeats = members.length + invitations.length;
  const availableSeats = seatCount - usedSeats;
  const hasAvailableSeats = availableSeats > 0;

  const handleSaveName = async () => {
    if (!teamName.trim()) {
      toast.error("Team name cannot be empty");
      return;
    }

    setIsSavingName(true);

    try {
      const response = await fetch(`/api/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update team name");
      }

      toast.success("Team name updated");
      setIsEditingName(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update team name";
      toast.error(message);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleUpdateSeats = async (newSeatCount: number) => {
    if (newSeatCount < 2) {
      toast.error("Minimum seat count is 2");
      return;
    }

    if (newSeatCount < usedSeats) {
      toast.error(
        `Cannot reduce below ${usedSeats} seats (currently in use by members and pending invitations)`
      );
      return;
    }

    setIsUpdatingSeats(true);

    try {
      const response = await fetch(`/api/accounts/${account.id}/seats`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seat_count: newSeatCount }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update seat count");
      }

      setSeatCount(newSeatCount);
      toast.success("Seat count updated");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update seat count";
      toast.error(message);
    } finally {
      setIsUpdatingSeats(false);
    }
  };

  const handleMemberRemoved = (userId: string) => {
    setMembers(members.filter((m) => m.user_id !== userId));

    // If current user left, redirect to dashboard
    if (userId === currentUserId) {
      router.push("/dashboard");
    }
  };

  const handleRoleChanged = (userId: string, newRole: string) => {
    setMembers(
      members.map((m) =>
        m.user_id === userId ? { ...m, role: newRole as Member["role"] } : m
      )
    );
  };

  const handleOwnershipTransferred = (newOwnerId: string) => {
    setMembers(
      members.map((m) => {
        if (m.user_id === newOwnerId) {
          return { ...m, role: "owner" as const };
        }
        if (m.user_id === currentUserId) {
          return { ...m, role: "admin" as const };
        }
        return m;
      })
    );
    router.refresh();
  };

  const handleInviteSent = () => {
    router.refresh();
  };

  const handleInvitationRevoked = (invitationId: string) => {
    setInvitations(invitations.filter((i) => i.id !== invitationId));
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="text-sm breadcrumbs">
        <ul>
          <li>
            <Link href="/account">Account Settings</Link>
          </li>
          <li>{account.name}</li>
        </ul>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Team Settings</h1>
        <p className="text-base-content/70 mt-1">
          Manage your team, members, and invitations
        </p>
      </div>

      {/* Team Name */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Team Information</h2>

          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text font-medium">Team Name</span>
            </label>
            {isEditingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-bordered flex-1"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={100}
                  disabled={isSavingName}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleSaveName}
                  disabled={isSavingName}
                >
                  {isSavingName ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setTeamName(account.name);
                    setIsEditingName(false);
                  }}
                  disabled={isSavingName}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-lg">{account.name}</span>
                {canManageTeam && (
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => setIsEditingName(true)}
                  >
                    <span className="iconify lucide--pencil size-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Subscription Info */}
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div>
              <span className="text-sm text-base-content/70">Plan: </span>
              <span className="badge badge-primary">
                {account.subscription_tier.charAt(0).toUpperCase() +
                  account.subscription_tier.slice(1)}
              </span>
            </div>
            <div>
              <span className="text-sm text-base-content/70">Seats: </span>
              <span className="font-medium">{seatCount}</span>
            </div>
            <div>
              <span className="text-sm text-base-content/70">Used: </span>
              <span className="font-medium">
                {usedSeats} / {seatCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Seat Management (Owner only) */}
      {isOwner && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Seat Management</h2>
            <p className="text-base-content/70 text-sm mt-1">
              Adjust the number of seats on your team plan. Changes will be prorated on your next invoice.
            </p>

            <div className="mt-4">
              <div className="flex items-center gap-4">
                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => handleUpdateSeats(seatCount - 1)}
                    disabled={isUpdatingSeats || seatCount <= 2 || seatCount <= usedSeats}
                  >
                    <span className="iconify lucide--minus size-4" />
                  </button>
                  <div className="join-item btn btn-sm no-animation cursor-default">
                    {seatCount} seats
                  </div>
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => handleUpdateSeats(seatCount + 1)}
                    disabled={isUpdatingSeats}
                  >
                    <span className="iconify lucide--plus size-4" />
                  </button>
                </div>

                {isUpdatingSeats && (
                  <span className="loading loading-spinner loading-sm" />
                )}

                {pricing && (
                  <div className="text-sm text-base-content/70">
                    <span className="font-medium">${pricing.unitAmount}</span>
                    <span>/{pricing.interval}/seat</span>
                  </div>
                )}
              </div>

              <div className="mt-4 text-sm text-base-content/70">
                <p>
                  <span className="font-medium">{members.length}</span> active members,{" "}
                  <span className="font-medium">{invitations.length}</span> pending invitations,{" "}
                  <span className="font-medium text-success">{availableSeats}</span> available
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Team Members</h2>

          <div className="mt-4">
            <MemberList
              accountId={account.id}
              members={members}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onMemberRemoved={handleMemberRemoved}
              onRoleChanged={handleRoleChanged}
              onOwnershipTransferred={handleOwnershipTransferred}
            />
          </div>
        </div>
      </div>

      {/* Invite Members */}
      {canManageTeam && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Invite Members</h2>
            <p className="text-base-content/70 text-sm mt-1">
              Send an invitation email to add new team members
            </p>

            <div className="mt-4">
              {hasAvailableSeats ? (
                <InviteTeamMemberForm
                  accountId={account.id}
                  onInviteSent={handleInviteSent}
                />
              ) : (
                <div className="alert alert-warning">
                  <span className="iconify lucide--alert-triangle size-5" />
                  <div>
                    <p className="font-medium">No seats available</p>
                    <p className="text-sm">
                      {isOwner
                        ? "Increase your seat count above to invite more members."
                        : "Ask the team owner to add more seats."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {invitations.length > 0 && (
              <div className="mt-6">
                <PendingInvitationsList
                  accountId={account.id}
                  invitations={invitations}
                  onInvitationRevoked={handleInvitationRevoked}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="card bg-base-100 shadow border border-error/20">
        <div className="card-body">
          <h2 className="card-title text-error">Danger Zone</h2>

          <div className="mt-4 space-y-4">
            {/* Leave Team (for non-owners) */}
            {!isOwner && (
              <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                <div>
                  <p className="font-medium">Leave Team</p>
                  <p className="text-sm text-base-content/70">
                    Remove yourself from this team
                  </p>
                </div>
                <button
                  className="btn btn-error btn-outline btn-sm"
                  onClick={async () => {
                    if (
                      confirm(
                        "Are you sure you want to leave this team? You'll need a new invitation to rejoin."
                      )
                    ) {
                      try {
                        const response = await fetch(
                          `/api/accounts/${account.id}/members/${currentUserId}`,
                          { method: "DELETE" }
                        );
                        if (!response.ok) {
                          throw new Error("Failed to leave team");
                        }
                        handleMemberRemoved(currentUserId);
                      } catch (error) {
                        toast.error("Failed to leave team");
                      }
                    }
                  }}
                >
                  Leave Team
                </button>
              </div>
            )}

            {/* Transfer Ownership Info (for owner) */}
            {isOwner && (
              <div className="p-4 bg-base-200 rounded-lg">
                <p className="font-medium">Transfer Ownership</p>
                <p className="text-sm text-base-content/70 mt-1">
                  To transfer ownership, click the crown icon next to a member
                  in the list above. You must transfer ownership before you can
                  leave the team.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
