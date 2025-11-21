import { ISidebarMenuItem } from "@/components/dashboard-layout/SidebarMenuItem";

export const dashboardMenuItems: ISidebarMenuItem[] = [
  {
    id: "main-label",
    isTitle: true,
    label: "Main",
  },
  {
    id: "learning-paths",
    icon: "lucide--map",
    label: "Learning Paths",
    url: "/dashboard",
  },
  {
    id: "skills",
    icon: "lucide--award",
    label: "My Skills",
    url: "/skills",
  },
  {
    id: "explore",
    icon: "lucide--compass",
    label: "Explore",
    url: "/explore",
  },
  {
    id: "account-label",
    isTitle: true,
    label: "Account",
  },
  {
    id: "settings",
    icon: "lucide--settings",
    label: "Settings",
    url: "/dashboard/settings",
  },
];
