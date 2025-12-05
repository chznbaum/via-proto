"use client";

interface ProgressFiltersProps {
  statusFilter: "active" | "completed" | "archived" | "all";
  sortBy: "recent" | "progress" | "title";
  onStatusChange: (status: "active" | "completed" | "archived" | "all") => void;
  onSortChange: (sort: "recent" | "progress" | "title") => void;
}

export const ProgressFilters = ({
  statusFilter,
  sortBy,
  onStatusChange,
  onSortChange,
}: ProgressFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Status Tabs */}
      <div className="tabs tabs-boxed bg-base-200">
        <button
          className={`tab ${statusFilter === "active" ? "tab-active" : ""}`}
          onClick={() => onStatusChange("active")}
        >
          <span className="iconify lucide--play size-3.5 mr-1.5" />
          Active
        </button>
        <button
          className={`tab ${statusFilter === "completed" ? "tab-active" : ""}`}
          onClick={() => onStatusChange("completed")}
        >
          <span className="iconify lucide--check-circle size-3.5 mr-1.5" />
          Completed
        </button>
        <button
          className={`tab ${statusFilter === "archived" ? "tab-active" : ""}`}
          onClick={() => onStatusChange("archived")}
        >
          <span className="iconify lucide--archive size-3.5 mr-1.5" />
          Archived
        </button>
        <button
          className={`tab ${statusFilter === "all" ? "tab-active" : ""}`}
          onClick={() => onStatusChange("all")}
        >
          All
        </button>
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-base-content/70">Sort by:</span>
        <select
          className="select select-bordered select-sm"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as typeof sortBy)}
        >
          <option value="recent">Last Activity</option>
          <option value="progress">Progress %</option>
          <option value="title">Title</option>
        </select>
      </div>
    </div>
  );
};
