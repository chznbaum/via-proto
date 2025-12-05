"use client";

import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import type { ResourceProgressStatus } from "@/libs/validation/progress-schema";

interface ResourceProgressControlProps {
  resourceId: string;
  currentStatus: ResourceProgressStatus;
  currentNotes?: string | null;
  isTracking: boolean;
  onStatusChange?: (status: ResourceProgressStatus) => void;
  onNotesChange?: (notes: string) => void;
  className?: string;
}

const statusConfig: Record<
  ResourceProgressStatus,
  { label: string; icon: string; color: string }
> = {
  not_started: {
    label: "Not Started",
    icon: "lucide--circle",
    color: "btn-ghost",
  },
  in_progress: {
    label: "In Progress",
    icon: "lucide--loader",
    color: "btn-warning",
  },
  completed: {
    label: "Completed",
    icon: "lucide--check-circle",
    color: "btn-success",
  },
  skipped: {
    label: "Skipped",
    icon: "lucide--skip-forward",
    color: "btn-ghost opacity-60",
  },
};

const statusOrder: ResourceProgressStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "skipped",
];

export const ResourceProgressControl = ({
  resourceId,
  currentStatus,
  currentNotes = null,
  isTracking,
  onStatusChange,
  onNotesChange,
  className = "",
}: ResourceProgressControlProps) => {
  const [status, setStatus] = useState<ResourceProgressStatus>(currentStatus);
  const [notes, setNotes] = useState<string>(currentNotes || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState<string>(currentNotes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Don't show controls if user isn't tracking this path
  if (!isTracking) {
    return null;
  }

  const handleStatusChange = async (newStatus: ResourceProgressStatus) => {
    if (newStatus === status) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    setIsOpen(false);

    try {
      const response = await fetch(`/api/tracking/resources/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update progress");
      }

      setStatus(newStatus);
      onStatusChange?.(newStatus);

      // Show subtle confirmation
      if (newStatus === "completed") {
        toast.success("Marked as completed!", { duration: 2000 });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update progress"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenNotesModal = () => {
    setNotesDraft(notes);
    setIsNotesModalOpen(true);
    // Focus textarea after modal opens
    setTimeout(() => {
      notesTextareaRef.current?.focus();
    }, 100);
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);

    try {
      const response = await fetch(`/api/tracking/resources/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: notesDraft }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save notes");
      }

      setNotes(notesDraft);
      onNotesChange?.(notesDraft);
      setIsNotesModalOpen(false);
      toast.success("Notes saved!", { duration: 2000 });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save notes"
      );
    } finally {
      setIsSavingNotes(false);
    }
  };

  const config = statusConfig[status];
  const hasNotes = notes.trim().length > 0;

  return (
    <>
      <div ref={dropdownRef} className={`flex items-center gap-1 ${className}`}>
        {/* Notes Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenNotesModal();
          }}
          className={`btn btn-sm btn-ghost btn-circle ${hasNotes ? "text-info" : "text-base-content/50"}`}
          title={hasNotes ? "View/edit notes" : "Add notes"}
        >
          <span className={`iconify ${hasNotes ? "lucide--file-text" : "lucide--sticky-note"} size-4`} />
        </button>

        {/* Status Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            disabled={isUpdating}
            className={`btn btn-sm gap-1.5 ${config.color}`}
          >
            {isUpdating ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <span className={`iconify ${config.icon} size-4`} />
            )}
            <span className="hidden sm:inline">{config.label}</span>
            <span className="iconify lucide--chevron-down size-3" />
          </button>

          {isOpen && (
            <ul className="absolute right-0 top-full z-50 menu p-2 shadow-lg bg-base-100 rounded-box w-44 mt-1 border border-base-300">
              {statusOrder.map((statusOption) => {
                const optionConfig = statusConfig[statusOption];
                const isActive = status === statusOption;

                return (
                  <li key={statusOption}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(statusOption);
                      }}
                      className={`flex items-center gap-2 ${isActive ? "active" : ""}`}
                    >
                      <span className={`iconify ${optionConfig.icon} size-4`} />
                      {optionConfig.label}
                      {isActive && (
                        <span className="iconify lucide--check size-4 ml-auto" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Notes Modal */}
      {isNotesModalOpen && (
        <div className="modal modal-open" onClick={() => setIsNotesModalOpen(false)}>
          <div
            className="modal-box max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="iconify lucide--sticky-note size-5" />
              Resource Notes
            </h3>
            <p className="text-sm text-base-content/70 mt-1">
              Add your personal notes, key takeaways, or reminders for this resource.
            </p>

            <div className="mt-4">
              <textarea
                ref={notesTextareaRef}
                className="textarea textarea-bordered w-full h-40 resize-none"
                placeholder="Write your notes here... What did you learn? Any key insights?"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                maxLength={2000}
              />
              <div className="text-right mt-1">
                <span className="text-xs text-base-content/50">
                  {notesDraft.length}/2000 characters
                </span>
              </div>
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsNotesModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary gap-2"
                onClick={handleSaveNotes}
                disabled={isSavingNotes}
              >
                {isSavingNotes ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <span className="iconify lucide--save size-4" />
                )}
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
