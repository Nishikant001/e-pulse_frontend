// ERP permissions on the client — UX ONLY. The server (middleware/erpAccess.js) enforces every one of these on every request; hiding a
// button here never grants or removes access. The list comes from GET /api/admin/session|me (`admin.erpPermissions`), never from localStorage.
import { useMemo } from "react";
import { useAdminSession } from "../adminAuth/adminSessionContext";

export const ERP_PERMISSIONS = ["ERP_VIEW", "ERP_MANAGE", "ERP_SYNC", "ERP_RETRY", "ERP_SCHEDULE", "ERP_AUDIT"];

/** Pure helper (also used by the navigation filter and the tests). Unknown / missing → false. `needed` may be one permission or an any-of list. */
export function hasErpPermission(admin, needed) {
  const have = Array.isArray(admin?.erpPermissions) ? admin.erpPermissions : [];
  return [].concat(needed).some((p) => have.includes(p));
}

export function useErpPermissions() {
  const { admin } = useAdminSession();
  return useMemo(() => {
    const have = new Set(Array.isArray(admin?.erpPermissions) ? admin.erpPermissions : []);
    return {
      can: (needed) => [].concat(needed).some((p) => have.has(p)),
      view: have.has("ERP_VIEW"), manage: have.has("ERP_MANAGE"), sync: have.has("ERP_SYNC"), retry: have.has("ERP_RETRY"), schedule: have.has("ERP_SCHEDULE"), audit: have.has("ERP_AUDIT"),
      any: have.size > 0,
    };
  }, [admin]);
}

/** Tooltip text for a disabled control. Deliberately generic: it never names the permission or role. */
export const NO_ACCESS_HINT = "You don't have permission to perform this action.";
