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
         * Featured image
         * =========================================== */

        .h-64,
        .sm\\:h-100,
        .lg\\:h-120 {
          height: 150px !important;
          max-height: 150px !important;
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
         * Timeline
         * =========================================== */

        .timeline::before,
        .timeline-start::before,
        .timeline-middle,
        .timeline-end::before {
          background: #ccc !important;
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
