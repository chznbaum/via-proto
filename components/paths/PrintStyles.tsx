"use client";

/**
 * PrintStyles component
 *
 * Injects print-specific styles only on pages where it's included.
 * This keeps print styles scoped to the path detail page rather than global.
 */
export function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        /* ===========================================
         * Hide non-essential elements
         * =========================================== */

        /* Navigation and layout chrome */
        #layout-topbar,
        #layout-sidebar,
        #layout-sidebar-backdrop,
        footer,
        .footer,

        /* Interactive elements */
        .btn,
        button:not(.no-print-hide),

        /* Page-specific elements to hide */
        .print-hidden,
        [data-print-hidden],

        /* Back links and navigation */
        a[href="/explore"],
        a[href="/dashboard"],

        /* Related content */
        .related-paths,

        /* Share/export actions */
        .dropdown,

        /* Unsplash attribution */
        .unsplash-attribution {
          display: none !important;
        }

        /* ===========================================
         * Page setup
         * =========================================== */

        @page {
          size: A4;
          margin: 1.5cm 2cm;
        }

        html,
        body {
          font-size: 11pt;
          line-height: 1.5;
          color: #000 !important;
          background: #fff !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* ===========================================
         * Layout adjustments
         * =========================================== */

        main {
          padding-top: 0 !important;
          margin: 0 !important;
        }

        .container {
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Remove horizontal margins on path detail */
        .lg\\:mx-16,
        .xl\\:mx-32,
        .2xl\\:mx-48 {
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        /* ===========================================
         * Typography
         * =========================================== */

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          color: #000 !important;
          page-break-after: avoid;
          break-after: avoid;
        }

        h1 {
          font-size: 18pt !important;
        }

        h2 {
          font-size: 14pt !important;
          margin-top: 1em !important;
        }

        h3 {
          font-size: 12pt !important;
        }

        p,
        li {
          orphans: 3;
          widows: 3;
        }

        /* ===========================================
         * Featured image - hide to save ink
         * =========================================== */

        .featured-image {
          display: none !important;
        }

        /* ===========================================
         * Badges
         * =========================================== */

        .badge {
          border: 1px solid #ccc !important;
          background: #f5f5f5 !important;
          color: #333 !important;
          padding: 2px 8px !important;
        }

        .badge-primary,
        .badge-secondary,
        .badge-success,
        .badge-warning,
        .badge-error {
          background: #e0e0e0 !important;
          color: #000 !important;
        }

        /* ===========================================
         * Links
         * =========================================== */

        a {
          color: #000 !important;
          text-decoration: underline !important;
        }

        /* Show URL after resource links */
        .resource-link::after {
          content: " (" attr(href) ")";
          font-size: 9pt;
          color: #666;
        }

        /* ===========================================
         * Sections and resources
         * =========================================== */

        .section-card,
        [data-section] {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .section-header {
          page-break-after: avoid;
          break-after: avoid;
        }

        .resource-item {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* ===========================================
         * Timeline - simplify for print
         * =========================================== */

        /* Hide timeline decorative elements */
        .timeline::before,
        .timeline hr,
        .timeline-middle {
          display: none !important;
        }

        /* Reset timeline layout to simple vertical stack */
        .timeline {
          display: block !important;
          padding: 0 !important;
        }

        .timeline > li {
          display: block !important;
          margin: 0 0 1.5em 0 !important;
          padding: 0 !important;
        }

        /* Reset alternating sides - everything left-aligned */
        .timeline-start,
        .timeline-end {
          text-align: left !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* ===========================================
         * Cards - flatten for print
         * =========================================== */

        .card {
          box-shadow: none !important;
          border: 1px solid #ddd !important;
          border-radius: 4px !important;
          padding: 1em !important;
          margin-bottom: 1em !important;
          background: #fff !important;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* Remove hover states */
        .card:hover {
          box-shadow: none !important;
        }

        /* Simplify link preview boxes inside cards */
        .card a.block {
          border: 1px solid #ccc !important;
          border-radius: 4px !important;
        }

        /* Hide OG images in print to save space/ink */
        .card img.object-cover {
          display: none !important;
        }

        /* Simplify the domain/favicon row */
        .card .bg-base-200\\/50 {
          background: #f9f9f9 !important;
          padding: 0.5em !important;
        }

        /* Hide external link icons */
        .card .lucide--external-link {
          display: none !important;
        }

        /* Ensure URL is visible for resources */
        .card a.block::after {
          content: " (" attr(href) ")";
          display: block;
          font-size: 8pt;
          color: #666;
          word-break: break-all;
          margin-top: 0.5em;
          padding: 0 0.5em 0.5em;
        }

        /* ===========================================
         * Section headers for print
         * =========================================== */

        /* Add visual separator between sections */
        .space-y-12 > div,
        .space-y-16 > div {
          padding-top: 1em !important;
          margin-top: 0 !important;
          border-top: 2px solid #333 !important;
        }

        .space-y-12 > div:first-child,
        .space-y-16 > div:first-child {
          border-top: none !important;
          padding-top: 0 !important;
        }

        /* Hide collapse buttons */
        .btn-circle {
          display: none !important;
        }

        /* Ensure section badge is visible */
        .bg-primary\\/10 {
          background: #f0f0f0 !important;
          border: 1px solid #ccc !important;
        }

        /* ===========================================
         * Print footer
         * =========================================== */

        .print-footer {
          display: block !important;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 9pt;
          color: #666;
          border-top: 1px solid #ccc;
          padding-top: 0.5em;
        }

        /* ===========================================
         * Utility classes
         * =========================================== */

        .print-only {
          display: block !important;
        }

        .screen-only,
        .no-print {
          display: none !important;
        }
      }

      /* Hide print-only elements on screen */
      @media screen {
        .print-only,
        .print-footer {
          display: none !important;
        }
      }
    `}</style>
  );
}
