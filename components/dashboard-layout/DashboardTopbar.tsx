"use client";

import ButtonAccount from "@/components/ButtonAccount";

export function DashboardTopbar() {
  return (
    <div className="navbar bg-base-100 border-b border-base-300 px-4">
      {/* Mobile menu toggle */}
      <div className="navbar-start">
        <label
          htmlFor="dashboard-drawer"
          className="btn btn-square btn-ghost lg:hidden"
        >
          <span className="iconify lucide--menu size-5"></span>
        </label>
      </div>

      {/* Center - can add breadcrumbs or page title here later */}
      <div className="navbar-center"></div>

      {/* Right side - account menu */}
      <div className="navbar-end">
        <ButtonAccount />
      </div>
    </div>
  );
}
