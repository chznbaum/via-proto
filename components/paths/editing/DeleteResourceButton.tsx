"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface DeleteResourceButtonProps {
  pathId: string;
  resourceId: string;
  resourceTitle: string;
  onDelete: () => void;
}

/**
 * Button to delete a resource with confirmation
 */
export const DeleteResourceButton = ({
  pathId,
  resourceId,
  resourceTitle,
  onDelete,
}: DeleteResourceButtonProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/paths/${pathId}/resources/${resourceId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete resource");
      }

      toast.success("Resource removed");
      onDelete();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete resource"
      );
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-base-content/70">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="btn btn-error btn-xs"
        >
          {isDeleting ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            "Yes"
          )}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="btn btn-ghost btn-xs"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
      title={`Delete "${resourceTitle}"`}
    >
      <span className="iconify lucide--trash-2 size-4" />
    </button>
  );
};
