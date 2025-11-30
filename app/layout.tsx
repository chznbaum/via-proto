import type { Metadata } from "next";
import { ReactNode } from "react";
import config from "@/config";

// Set metadataBase at root so all routes (including Payload admin) inherit it
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : `https://${config.domainName}`
  ),
};

// Minimal root layout - each route group ((main) and (payload)) has its own
// root layout with html/body to prevent nested HTML document errors
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
