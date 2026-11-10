import { Outlet } from "react-router-dom";
import AdminNotFound from "../adminAuth/AdminNotFound";
import { useAdminSession } from "../adminAuth/adminSessionContext";
import { isSuperAdmin } from "./isSuperAdmin";

/** Layout route for the Super Admin screens. UX gate only — the API enforces SUPER_ADMIN on every request. */
export default function RequireSuperAdmin() {
  const { admin } = useAdminSession();
  return isSuperAdmin(admin) ? <Outlet /> : <AdminNotFound />;
}
