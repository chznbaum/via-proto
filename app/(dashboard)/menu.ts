import { ISidebarMenuItem } from "@/components/dashboard-layout/SidebarMenuItem";

export const getDashboardMenuItems = (): ISidebarMenuItem[] => {
  const teamsEnabled = process.env.TEAMS_ENABLED === 'true';

  const items: ISidebarMenuItem[] = [
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
      id: "progress",
      icon: "lucide--bar-chart-2",
      label: "My Progress",
      url: "/progress",
    },
    {
      id: "explore",
      icon: "lucide--compass",
      label: "Explore",
      url: "/explore",
    },
  ];

  // Only show Account settings when teams are enabled
  if (teamsEnabled) {
    items.push(
      {
        id: "account-label",
        isTitle: true,
        label: "Account",
      },
      {
        id: "account",
        icon: "lucide--settings",
        label: "Settings",
        url: "/account",
      }
    );
  }

  return items;
};

// For backwards compatibility
export const dashboardMenuItems = getDashboardMenuItems();
