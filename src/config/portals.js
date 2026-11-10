import { getStoredUser } from "../utils/session";
import { adminNavigation } from "./adminNavigation";
import { superAdminNavigation } from "./superAdminNavigation";
import { distributorNavigation } from "./navigation";

/**
 * Portal definitions. The application shell (components/layout/AppShell) is portal-agnostic: it receives one of these.
 *
 *   distributorPortal → /dashboard/*   (EXISTING Distributor login + screens — unchanged)
 *   adminPortal       → /admin/*       (Phase 3: Dashboard only; separate identity, cookie and API — see features/adminAuth)
 *   retailerPortal    → /retailer/*    (future phase — not defined yet)
 *
 * Each portal owns its navigation, identity source and SAP status source, so the three portals stay separate.
 */
export const distributorPortal = {
  id: "distributor",
  label: "Distributor Portal",
  basePath: "/dashboard",
  designSystemPath: "/dashboard/design-system", // development builds only
  // Phase 2: the Distributor model (config/navigation.js) now contains only Distributor entries, so no filtering is needed here.
  navigation: distributorNavigation,
  // SAP integration does not exist yet, so the shell honestly shows "not configured".
  sapStatus: "not_configured",
  // Real identity of the logged-in distributor (from the existing login response). No fake admin data.
  getIdentity() {
    const u = getStoredUser();
    const name = u?.name || "Distributor";
    const code = u?.distributor_code;
    return {
      name,
      email: u?.email,
      subtitle: code ? `Distributor · ${code}` : "Distributor",
      scope: { id: code || "self", name, code },
    };
  },
};

/**
 * Admin portal. Its identity is NEVER read from localStorage: it comes from GET /api/admin/me (httpOnly admin cookie),
 * provided to AppShell by features/adminAuth/AdminLayout. `getIdentity` is only a safe fallback.
 */
export const adminPortal = {
  id: "admin",
  label: "Admin Portal",
  tone: "admin",
  basePath: "/admin",
  homePath: "/admin/dashboard",
  navigation: adminNavigation,
  defaultRangePresetId: "month", // the dashboard opens on "This month"
  // Phase 2: no `sapStatus` — the ERP/SAP header badge is not shown in the Admin portal (Header renders it only when a portal defines one).
  getIdentity: () => ({ name: "Admin", subtitle: "Administrator", scope: { id: "all", name: "All distributors" } }),
};

/**
 * Super Admin portal — the Admin session (same cookie, same /admin routes) rendered with the platform-level menu.
 * AdminLayout picks it when the confirmed role is SUPER_ADMIN; the shell, header and identity are otherwise identical.
 */
export const superAdminPortal = {
  ...adminPortal,
  label: "Super Admin Portal",
  tone: "super",
  navigation: superAdminNavigation,
  getIdentity: () => ({ name: "Super Admin", subtitle: "Super Administrator", scope: { id: "all", name: "Entire platform" } }),
};
