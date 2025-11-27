import { ReactNode } from "react";

// Minimal root layout - each route group ((main) and (payload)) has its own
// root layout with html/body to prevent nested HTML document errors
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
