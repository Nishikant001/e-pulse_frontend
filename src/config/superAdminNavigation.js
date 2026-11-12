import { Building2, CreditCard, LayoutDashboard, Megaphone, ScrollText, Settings, Users } from "lucide-react";

/**
 * Super Admin navigation (shown at /admin/* when the signed-in account has the SUPER_ADMIN role).
 *
 * A Super Admin runs the platform — admin accounts, the distributor network, plans and audit — not the day-to-day Sales / Inventory /
 * Masters / Accounts modules, so those groups are deliberately absent here (adminNavigation.js still serves every other admin role).
 * Live: Dashboard, Admins & Users, role definitions, distributor network and pending onboarding records.
 * Sections without a persistent backend API intentionally render empty states rather than fabricated records.
 */
export const superAdminNavigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard", end: true },

  {
    id: "admin-management", label: "Admin Management", icon: Users,
    items: [
      { id: "admins-users", label: "Admins & Users", to: "/admin/super-admin", end: true },
      { id: "roles-permissions", label: "Roles & Permissions", to: "/admin/super-admin/roles" },
    ],
  },

  {
    id: "distributor-network", label: "Distributor Network", icon: Building2,
    items: [
      { id: "all-distributors", label: "All Distributors", to: "/admin/super-admin/distributors" },
      { id: "onboarding", label: "Onboarding Requests", to: "/admin/super-admin/onboarding" },
    ],
  },

  { id: "billing", label: "Plans & Billing", icon: CreditCard, to: "/admin/super-admin/billing" },
  { id: "audit-logs", label: "Audit Logs", icon: ScrollText, to: "/admin/super-admin/audit-logs" },
  { id: "announcements", label: "Announcements", icon: Megaphone, to: "/admin/super-admin/announcements" },
  { id: "platform-settings", label: "Platform Settings", icon: Settings, to: "/admin/super-admin/settings" },
];
