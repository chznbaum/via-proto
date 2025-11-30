"use client";

import { ErrorReportContent } from "@/components/ErrorReportContent";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="container flex flex-col py-8 px-4 lg:px-8">
      <ErrorReportContent type="error" error={error} reset={reset} />
    </div>
  );
}
