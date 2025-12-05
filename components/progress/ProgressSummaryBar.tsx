"use client";

interface ProgressSummaryBarProps {
  totalResources: number;
  completed: number;
  inProgress: number;
  skipped: number;
  percentage: number;
  className?: string;
}

export const ProgressSummaryBar = ({
  totalResources,
  completed,
  inProgress,
  skipped,
  percentage,
  className = "",
}: ProgressSummaryBarProps) => {
  if (totalResources === 0) {
    return null;
  }

  const completedWidth = (completed / totalResources) * 100;
  const inProgressWidth = (inProgress / totalResources) * 100;
  const skippedWidth = (skipped / totalResources) * 100;

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Your Progress</span>
        <span className="text-sm text-base-content/70">
          {completed} of {totalResources} completed ({percentage}%)
        </span>
      </div>

      {/* Segmented Progress Bar */}
      <div className="w-full h-3 bg-base-300 rounded-full overflow-hidden flex">
        {completedWidth > 0 && (
          <div
            className="bg-success h-full transition-all duration-300"
            style={{ width: `${completedWidth}%` }}
            title={`${completed} completed`}
          />
        )}
        {inProgressWidth > 0 && (
          <div
            className="bg-warning h-full transition-all duration-300"
            style={{ width: `${inProgressWidth}%` }}
            title={`${inProgress} in progress`}
          />
        )}
        {skippedWidth > 0 && (
          <div
            className="bg-base-content/30 h-full transition-all duration-300"
            style={{ width: `${skippedWidth}%` }}
            title={`${skipped} skipped`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-2 text-xs text-base-content/70">
        {completed > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-success" />
            {completed} completed
          </span>
        )}
        {inProgress > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-warning" />
            {inProgress} in progress
          </span>
        )}
        {skipped > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-base-content/30" />
            {skipped} skipped
          </span>
        )}
      </div>
    </div>
  );
};
