"use client";

import { ErrorReportContent } from "@/components/ErrorReportContent";

export default function AuthNotFound() {
  return (
    <div className="container flex flex-col py-8">
      <ErrorReportContent type="not-found" />
    </div>
  );
}
