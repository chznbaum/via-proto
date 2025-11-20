export interface ISidebarMenuItem {
  id: string;
  label: string;
  icon?: string;
  url?: string;
  isTitle?: boolean;
  badges?: string[];
  children?: ISidebarMenuItem[];
  linkProp?: {
    target?: string;
  };
}

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
