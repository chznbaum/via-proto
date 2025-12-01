/**
 * Learning path export utilities
 *
 * Supports exporting learning paths to various formats:
 * - Markdown (.md) - Human-readable with checkboxes
 * - JSON (.json) - Machine-readable, portable format
 * - PDF (planned) - Print-friendly format
 * - Notion (planned) - Direct export to Notion workspace
 */

export * from './types';
export * from './markdown';
export * from './json';

import type { ExportPath, ExportFormat } from './types';
import { generateMarkdown, generateFilename } from './markdown';
import { generateJSON, stringifyJSON } from './json';

/**
 * Trigger a file download in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export a learning path to the specified format
 */
export function exportPath(path: ExportPath, format: ExportFormat): void {
  switch (format) {
    case 'markdown': {
      const content = generateMarkdown(path);
      const filename = generateFilename(path, 'md');
      downloadFile(content, filename, 'text/markdown');
      break;
    }
    case 'json': {
      const data = generateJSON(path);
      const content = stringifyJSON(data);
      const filename = generateFilename(path, 'json');
      downloadFile(content, filename, 'application/json');
      break;
    }
    case 'pdf': {
      // TODO: Implement PDF export (print dialog or server-side generation)
      console.warn('PDF export not yet implemented');
      break;
    }
    default:
      console.error(`Unknown export format: ${format}`);
  }
}
