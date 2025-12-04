"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface DeleteSectionButtonProps {
  pathId: string;
  sectionId: string;
  sectionTitle: string;
  resourceCount: number;
  onDelete: () => void;
}

/**
 * Button to delete a section
 * Only enabled if section has no resources
 */
export const DeleteSectionButton = ({
  pathId,
  sectionId,
  sectionTitle,
  resourceCount,
  onDelete,
}: DeleteSectionButtonProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasResources = resourceCount > 0;

  const handleDelete = async () => {
    if (hasResources) {
      toast.error("Remove all resources before deleting the section");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/paths/${pathId}/sections/${sectionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete section");
      }

      toast.success("Section removed");
      onDelete();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete section"
      );
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-base-content/70">Delete section?</span>
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
      disabled={hasResources}
      className={`btn btn-ghost btn-xs gap-1 ${
        hasResources
          ? "opacity-50 cursor-not-allowed"
          : "text-error hover:bg-error/10"
      }`}
      title={
        hasResources
          ? `Remove all ${resourceCount} resources before deleting`
          : `Delete "${sectionTitle}"`
      }
    >
      <span className="iconify lucide--trash-2 size-4" />
      Delete Section
    </button>
  );
};
