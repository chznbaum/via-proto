"use client";

import { ErrorReportContent } from "@/components/ErrorReportContent";

export default function DashboardNotFound() {
  return (
    <div className="container flex flex-col py-8 px-4 lg:px-8">
      <ErrorReportContent type="not-found" />
    </div>
  );
}
