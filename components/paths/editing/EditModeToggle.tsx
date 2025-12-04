"use client";

interface EditModeToggleProps {
  isEditMode: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

/**
 * Toggle button for entering/exiting edit mode on a learning path
 */
export const EditModeToggle = ({
  isEditMode,
  onToggle,
  disabled = false,
}: EditModeToggleProps) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`btn btn-sm gap-2 ${
        isEditMode ? "btn-primary" : "btn-ghost"
      }`}
    >
      {isEditMode ? (
        <>
          <span className="iconify lucide--check size-4" />
          Done Editing
        </>
      ) : (
        <>
          <span className="iconify lucide--pencil size-4" />
          Edit Path
        </>
      )}
    </button>
  );
};
