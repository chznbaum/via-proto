import type { Metadata } from "next";
import { ReactNode } from "react";
import config from "@/config";

// Set metadataBase at root so all routes inherit it
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : `https://${config.domainName}`
  ),
};

// Minimal root layout - (main) route group has its own html/body structure
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
