"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

interface StartLearningButtonProps {
  pathId: string;
  tracking: {
    id: string;
    status: "active" | "completed" | "archived";
  } | null;
  progress?: {
    percentage: number;
    completed: number;
    total_resources: number;
  };
  className?: string;
  /** Whether the user is logged in */
  isLoggedIn?: boolean;
  /** Whether the user can track progress (has access to any Pro or Team account) */
  canTrackProgress?: boolean;
}

export const StartLearningButton = ({
  pathId,
  tracking,
  progress,
  className = "",
  isLoggedIn = false,
  canTrackProgress = false,
}: StartLearningButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Don't show anything if user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  // Show upgrade prompt for users without paid access (only when not already tracking)
  if (!canTrackProgress && !tracking) {
    return (
      <Link
        href="/upgrade"
        className={`btn btn-primary gap-2 ${className}`}
      >
        <span className="iconify lucide--sparkles size-4" />
        Upgrade to track progress
      </Link>
    );
  }

  const handleStartTracking = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tracking/paths/${pathId}/start`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          toast.error("Please log in to track your progress");
          return;
        }
        throw new Error(data.error || "Failed to start tracking");
      }

      toast.success("Started tracking your progress!");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start tracking"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnarchive = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/tracking/paths/${pathId}/unarchive`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to resume tracking");
      }

      toast.success("Resumed tracking!");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resume tracking"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Not tracking yet
  if (!tracking) {
    return (
      <button
        onClick={handleStartTracking}
        disabled={isLoading}
        className={`btn btn-primary gap-2 ${className}`}
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <span className="iconify lucide--play size-4" />
        )}
        Start Learning
      </button>
    );
  }

  // Archived - show resume button
  if (tracking.status === "archived") {
    return (
      <button
        onClick={handleUnarchive}
        disabled={isLoading}
        className={`btn btn-secondary gap-2 ${className}`}
      >
        {isLoading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <span className="iconify lucide--archive-restore size-4" />
        )}
        Resume Learning
      </button>
    );
  }

  // Completed
  if (tracking.status === "completed") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="badge badge-success gap-1">
          <span className="iconify lucide--check-circle size-3.5" />
          Completed
        </span>
        {progress && (
          <span className="text-sm text-base-content/70">
            {progress.completed}/{progress.total_resources} resources
          </span>
        )}
      </div>
    );
  }

  // Active - show continue with progress
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <a href="#learning-path" className="btn btn-primary gap-2">
        <span className="iconify lucide--book-open size-4" />
        Continue Learning
      </a>
      {progress && progress.percentage > 0 && (
        <span className="text-sm text-base-content/70">
          {progress.percentage}% complete
        </span>
      )}
    </div>
  );
};
