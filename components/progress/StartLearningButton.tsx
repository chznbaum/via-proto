"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
}

export const StartLearningButton = ({
  pathId,
  tracking,
  progress,
  className = "",
}: StartLearningButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
