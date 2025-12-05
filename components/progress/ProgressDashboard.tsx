"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TrackedPathCard } from "./TrackedPathCard";
import { ProgressFilters } from "./ProgressFilters";

interface TrackedPath {
  tracking: {
    id: string;
    status: "active" | "completed" | "archived";
    started_at: string;
    last_activity_at: string;
    completed_at: string | null;
    archived_at: string | null;
  };
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
  progress: {
    total_resources: number;
    completed: number;
    percentage: number;
  };
}

interface ProgressDashboardProps {
  userId: string;
}

export const ProgressDashboard = ({ userId }: ProgressDashboardProps) => {
  const [paths, setPaths] = useState<TrackedPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "active" | "completed" | "archived" | "all"
  >("active");
  const [sortBy, setSortBy] = useState<"recent" | "progress" | "title">(
    "recent"
  );
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchPaths = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        sort: sortBy,
        limit: "20",
        offset: "0",
      });

      const response = await fetch(`/api/tracking/dashboard?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch tracked paths");
      }

      const data = await response.json();
      setPaths(data.paths || []);
      setTotal(data.total || 0);
      setHasMore(data.has_more || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, sortBy]);

  useEffect(() => {
    fetchPaths();
  }, [fetchPaths]);

  const handleArchive = async (pathId: string) => {
    try {
      const response = await fetch(`/api/tracking/paths/${pathId}/archive`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to archive");
      }

      // Refresh the list
      fetchPaths();
    } catch (err) {
      console.error("Error archiving:", err);
    }
  };

  const handleUnarchive = async (pathId: string) => {
    try {
      const response = await fetch(`/api/tracking/paths/${pathId}/unarchive`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to unarchive");
      }

      // Refresh the list
      fetchPaths();
    } catch (err) {
      console.error("Error unarchiving:", err);
    }
  };

  // Calculate stats
  const activeCount = paths.filter((p) => p.tracking.status === "active").length;
  const completedCount = paths.filter(
    (p) => p.tracking.status === "completed"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Progress</h1>
        <p className="text-base-content/70 mt-1">
          Track your learning journey across all paths
        </p>
      </div>

      {/* Stats Summary */}
      {!isLoading && paths.length > 0 && (
        <div className="stats shadow bg-base-100 w-full">
          <div className="stat">
            <div className="stat-title">Total Tracked</div>
            <div className="stat-value text-primary">{total}</div>
            <div className="stat-desc">learning paths</div>
          </div>
          <div className="stat">
            <div className="stat-title">In Progress</div>
            <div className="stat-value text-warning">{activeCount}</div>
            <div className="stat-desc">actively learning</div>
          </div>
          <div className="stat">
            <div className="stat-title">Completed</div>
            <div className="stat-value text-success">{completedCount}</div>
            <div className="stat-desc">paths finished</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <ProgressFilters
        statusFilter={statusFilter}
        sortBy={sortBy}
        onStatusChange={setStatusFilter}
        onSortChange={setSortBy}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="alert alert-error">
          <span className="iconify lucide--alert-circle size-5" />
          <span>{error}</span>
          <button onClick={fetchPaths} className="btn btn-sm btn-ghost">
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && paths.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 mb-4">
            <span className="iconify lucide--book-open size-8 text-base-content/50" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {statusFilter === "all"
              ? "No tracked paths yet"
              : statusFilter === "active"
              ? "No active paths"
              : statusFilter === "completed"
              ? "No completed paths"
              : "No archived paths"}
          </h3>
          <p className="text-base-content/70 mb-6 max-w-md mx-auto">
            {statusFilter === "all" || statusFilter === "active"
              ? 'Start tracking your progress on any learning path by clicking "Start Learning" on a path detail page.'
              : statusFilter === "completed"
              ? "Complete learning paths to see them here."
              : "Archive paths you want to hide from your active list."}
          </p>
          <Link href="/explore" className="btn btn-primary gap-2">
            <span className="iconify lucide--compass size-4" />
            Explore Paths
          </Link>
        </div>
      )}

      {/* Paths Grid */}
      {!isLoading && !error && paths.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((item) => (
            <TrackedPathCard
              key={item.tracking.id}
              path={item.path}
              tracking={item.tracking}
              progress={item.progress}
              onArchive={() => handleArchive(item.path.id)}
              onUnarchive={() => handleUnarchive(item.path.id)}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !isLoading && (
        <div className="flex justify-center">
          <button className="btn btn-outline">Load More</button>
        </div>
      )}
    </div>
  );
};
