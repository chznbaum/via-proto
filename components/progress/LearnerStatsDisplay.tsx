"use client";

interface LearnerStatsDisplayProps {
  totalLearners: number;
  activeThisMonth: number;
  className?: string;
}

export const LearnerStatsDisplay = ({
  totalLearners,
  activeThisMonth,
  className = "",
}: LearnerStatsDisplayProps) => {
  // Don't show if no one is learning
  if (totalLearners === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 text-sm text-base-content/70 ${className}`}>
      <span className="flex items-center gap-1.5">
        <span className="iconify lucide--users size-4" />
        {totalLearners} {totalLearners === 1 ? "learner" : "learners"}
      </span>
      {activeThisMonth > 0 && (
        <>
          <span className="text-base-content/40">|</span>
          <span className="flex items-center gap-1.5">
            <span className="iconify lucide--activity size-4 text-success" />
            {activeThisMonth} active this month
          </span>
        </>
      )}
    </div>
  );
};
