import { notFound } from "next/navigation";

// Catch-all route to handle any unmatched paths within (main) layout
// This ensures 404s render with proper layout (topbar, footer) and error reporting
export default function CatchAllNotFound() {
  notFound();
}
