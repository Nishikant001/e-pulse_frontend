import { Navigate, useLocation } from "react-router-dom";
import PortalLoginPage from "../../components/auth/PortalLoginPage";
import { useAdminSession } from "./adminSessionContext";

/**
 * /admin/login — kept so existing bookmarks work. It is the same sign-in page as /login with the Admin tab preselected;
 * the session itself is still the separate httpOnly Admin cookie, never localStorage.
 */
export default function AdminLoginPage() {
  const { status, login } = useAdminSession();
  const location = useLocation();
  if (status === "authenticated") return <Navigate to="/admin/dashboard" replace />;
  const from = location.state?.from;
  const redirect = typeof from === "string" && from.startsWith("/admin") && from !== "/admin/login" ? from : "/admin/dashboard";
  return <PortalLoginPage initialPortal="admin" onAdminLogin={login} adminRedirect={redirect} />;
}
