"use client";

import { useState } from "react";
import { exportPath, type ExportPath, type ExportFormat } from "@/libs/export";

interface ExportButtonProps {
  path: ExportPath;
}

const exportFormats: Array<{
  format: ExportFormat;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    format: "markdown",
    label: "Markdown",
    icon: "lucide--file-text",
    description: "Human-readable with checkboxes",
  },
  {
    format: "json",
    label: "JSON",
    icon: "lucide--braces",
    description: "Machine-readable format",
  },
  {
    format: "pdf",
    label: "PDF",
    icon: "lucide--printer",
    description: "Print-friendly document",
  },
];

export function ExportButton({ path }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(format);

    // Close dropdown by blurring the active element
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // Small delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      if (format === "pdf") {
        // PDF export via browser print dialog
        window.print();
      } else {
        exportPath(path, format);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <button
        tabIndex={0}
        role="button"
        className="btn btn-sm btn-ghost btn-circle"
        aria-label="Export">
        <span className="iconify lucide--download size-4"></span>
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-10 w-56 p-2 shadow-lg border border-base-200">
        <li className="menu-title">
          <span className="text-xs uppercase tracking-wide">Export as</span>
        </li>
        {exportFormats.map(({ format, label, icon, description }) => (
          <li key={format}>
            <button
              onClick={() => handleExport(format)}
              disabled={isExporting !== null}
              className="flex flex-col items-start gap-0 py-2">
              <span className="flex items-center gap-2">
                <span
                  className={`iconify ${icon} size-4 ${
                    isExporting === format ? "animate-pulse" : ""
                  }`}></span>
                <span className="font-medium">{label}</span>
              </span>
              <span className="text-xs text-base-content/60 ml-6">
                {description}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
