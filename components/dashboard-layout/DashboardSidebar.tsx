"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ISidebarMenuItem } from "@/app/(dashboard)/menu";
import config from "@/config";

export function DashboardSidebar({ menuItems }: { menuItems: ISidebarMenuItem[] }) {
  const pathname = usePathname();

  const isActive = (url?: string) => {
    if (!url) return false;
    return pathname === url || pathname.startsWith(url + "/");
  };

  return (
    <div className="drawer-side z-40">
      <label htmlFor="dashboard-drawer" className="drawer-overlay"></label>
      <aside className="bg-base-200 flex h-full w-72 flex-col">
        {/* Logo/Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-base-300 px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold">{config.appName}</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="menu gap-2">
            {menuItems.map((item) => {
              if (item.isTitle) {
                return (
                  <li key={item.id} className="menu-title">
                    <span className="text-xs font-semibold uppercase opacity-60">
                      {item.label}
                    </span>
                  </li>
                );
              }

              if (item.children) {
                return (
                  <li key={item.id}>
                    <details open>
                      <summary>
                        {item.icon && (
                          <span className={`iconify ${item.icon} size-5`}></span>
                        )}
                        {item.label}
                      </summary>
                      <ul>
                        {item.children.map((child) => (
                          <li key={child.id}>
                            <Link
                              href={child.url || "#"}
                              className={isActive(child.url) ? "active" : ""}
                            >
                              {child.label}
                              {child.badges?.map((badge) => (
                                <span
                                  key={badge}
                                  className="badge badge-sm badge-primary"
                                >
                                  {badge}
                                </span>
                              ))}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <Link
                    href={item.url || "#"}
                    className={isActive(item.url) ? "active" : ""}
                    {...item.linkProp}
                  >
                    {item.icon && (
                      <span className={`iconify ${item.icon} size-5`}></span>
                    )}
                    {item.label}
                    {item.badges?.map((badge) => (
                      <span key={badge} className="badge badge-sm badge-primary">
                        {badge}
                      </span>
                    ))}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-base-300 p-4">
          <div className="text-xs text-base-content/60">
            <p>© {new Date().getFullYear()} {config.appName}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
