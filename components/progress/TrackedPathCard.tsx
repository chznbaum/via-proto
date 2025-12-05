"use client";

import Link from "next/link";
import { getFallbackGradient } from "@/libs/unsplash";

interface TrackedPathCardProps {
  path: {
    id: string;
    title: string;
    description: string;
    skill_level: string;
    total_estimated_hours: number;
    topic: {
      name: string;
      category: { name: string } | null;
    } | null;
    unsplash_image: { url: string } | null;
  };
  tracking: {
    id: string;
    status: "active" | "completed" | "archived";
    started_at: string;
    last_activity_at: string;
    completed_at: string | null;
  };
  progress: {
    total_resources: number;
    completed: number;
    percentage: number;
  };
  onArchive?: () => void;
  onUnarchive?: () => void;
}

export const TrackedPathCard = ({
  path,
  tracking,
  progress,
  onArchive,
  onUnarchive,
}: TrackedPathCardProps) => {
  const skillLevelColors = {
    beginner: "badge-success",
    intermediate: "badge-warning",
    advanced: "badge-error",
  };

  const skillLevelColor =
    skillLevelColors[path.skill_level as keyof typeof skillLevelColors] ||
    "badge-neutral";

  const fallbackStyle = path.unsplash_image
    ? undefined
    : { background: getFallbackGradient(path.topic?.name || path.title) };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <figure className="h-32 relative" style={fallbackStyle}>
        {path.unsplash_image && (
          <img
            src={path.unsplash_image.url}
            alt={path.title}
            className="w-full h-full object-cover"
          />
        )}
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {tracking.status === "completed" && (
            <span className="badge badge-success gap-1">
              <span className="iconify lucide--check-circle size-3" />
              Completed
            </span>
          )}
          {tracking.status === "archived" && (
            <span className="badge badge-ghost gap-1">
              <span className="iconify lucide--archive size-3" />
              Archived
            </span>
          )}
        </div>
      </figure>

      <div className="card-body p-4">
        {/* Category */}
        {path.topic?.category?.name && (
          <p className="text-xs text-base-content/60 font-medium uppercase tracking-wide">
            {path.topic.category.name}
          </p>
        )}

        {/* Title */}
        <h3 className="card-title text-base line-clamp-1">{path.title}</h3>

        {/* Progress Bar */}
        <div className="mt-2">
          <div className="flex justify-between text-xs text-base-content/70 mb-1">
            <span>
              {progress.completed}/{progress.total_resources} resources
            </span>
            <span>{progress.percentage}%</span>
          </div>
          <progress
            className={`progress w-full ${
              progress.percentage === 100 ? "progress-success" : "progress-primary"
            }`}
            value={progress.percentage}
            max="100"
          />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {path.topic?.name && (
            <span className="badge badge-sm badge-outline">{path.topic.name}</span>
          )}
          <span className={`badge badge-sm ${skillLevelColor}`}>
            {path.skill_level.charAt(0).toUpperCase() + path.skill_level.slice(1)}
          </span>
        </div>

        {/* Last Activity */}
        <p className="text-xs text-base-content/50 mt-2">
          Last activity: {formatDate(tracking.last_activity_at)}
        </p>

        {/* Actions */}
        <div className="card-actions justify-between items-center mt-3">
          <Link
            href={`/paths/${path.id}`}
            className="btn btn-primary btn-sm gap-1"
          >
            <span className="iconify lucide--book-open size-3.5" />
            {tracking.status === "completed" ? "Review" : "Continue"}
          </Link>

          {/* Archive/Unarchive */}
          {tracking.status === "archived" ? (
            <button
              onClick={onUnarchive}
              className="btn btn-ghost btn-sm gap-1"
              title="Restore to active"
            >
              <span className="iconify lucide--archive-restore size-3.5" />
            </button>
          ) : (
            <button
              onClick={onArchive}
              className="btn btn-ghost btn-sm gap-1"
              title="Archive"
            >
              <span className="iconify lucide--archive size-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
