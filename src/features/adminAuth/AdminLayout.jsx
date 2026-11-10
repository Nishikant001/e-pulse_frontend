import { useMemo } from "react";
import AppShell from "../../components/layout/AppShell";
import { adminPortal, superAdminPortal } from "../../config/portals";
import { filterAdminNavigation } from "../../config/adminNavigation";
import { useAdminSession } from "./adminSessionContext";
import { isSuperAdmin } from "../superAdmin/isSuperAdmin";

const ROLE_LABELS = { ADMIN: "Administrator" };
const roleLabel = (role) => ROLE_LABELS[role] || String(role || "Administrator").toLowerCase().replace(/(^|_)(\w)/g, (m, s, c) => (s ? " " : "") + c.toUpperCase());

// The Admin portal frame: the SAME AppShell (sidebar + header) as every portal, fed with the server-confirmed identity.
export default function AdminLayout() {
  const { admin, logout } = useAdminSession();
  const identity = useMemo(
    () => ({ name: admin.name, email: admin.email, subtitle: roleLabel(admin.role), scope: isSuperAdmin(admin) ? { id: "all", name: "Entire platform" } : { id: "all", name: "All distributors" } }),
    [admin],
  );
  // UX only: ERP menu entries the account cannot use are not shown. The server still enforces every permission.
  // A Super Admin gets the platform menu (dashboard, admins, distributor network, billing, audit…) instead of the day-to-day admin modules.
  const portal = useMemo(() => (isSuperAdmin(admin) ? superAdminPortal : { ...adminPortal, navigation: filterAdminNavigation(adminPortal.navigation, admin) }), [admin]);
  return <AppShell portal={portal} identity={identity} onLogout={logout} />;
}
