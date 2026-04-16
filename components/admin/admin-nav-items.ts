export type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
  adminOnly: boolean;
};

export const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard", adminOnly: false },
  { label: "Users", href: "/admin/users", icon: "group", adminOnly: false },
  { label: "Hackathons", href: "/admin/hackathons", icon: "rocket_launch", adminOnly: true },
  { label: "Mentors", href: "/admin/mentors", icon: "school", adminOnly: true },
  { label: "Sponsors", href: "/admin/sponsors", icon: "handshake", adminOnly: true },
  { label: "Roles", href: "/admin/roles", icon: "admin_panel_settings", adminOnly: true },
  { label: "Audit Log", href: "/admin/audit", icon: "history", adminOnly: true },
  { label: "Draw", href: "/admin/draw", icon: "casino", adminOnly: true },
  { label: "Streamers", href: "/admin/streamers", icon: "live_tv", adminOnly: true },
];
