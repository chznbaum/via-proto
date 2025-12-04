"use client";

interface AddedByBadgeProps {
  user: {
    name: string;
    avatar_url?: string | null;
  } | null;
}

/**
 * Badge showing who manually added a resource
 * Returns null for AI-generated resources (user is null)
 */
export const AddedByBadge = ({ user }: AddedByBadgeProps) => {
  if (!user) return null;

  return (
    <div className="badge badge-ghost badge-sm gap-1.5">
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt={user.name}
          className="size-3 rounded-full"
        />
      ) : (
        <span className="iconify lucide--user size-3" />
      )}
      <span className="text-xs">Added by {user.name}</span>
    </div>
  );
};
