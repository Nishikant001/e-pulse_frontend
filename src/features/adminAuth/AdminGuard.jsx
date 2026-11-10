import { Navigate, useLocation } from "react-router-dom";
import ErrorState from "../../components/ui/ErrorState";
import LoadingState from "../../components/ui/LoadingState";
import { useAdminSession } from "./adminSessionContext";
import AdminLayout from "./AdminLayout";

/**
 * AdminGuard — layout route for every private /admin page. Access requires a server-confirmed Admin session
 * (GET /api/admin/me answered 200). A Distributor login — including localStorage["user"] — never satisfies it.
 * This gate only decides what to RENDER; the backend independently refuses every /api/admin data request without
 * a valid Admin cookie.
 */
export default function AdminGuard() {
  const { status, retry } = useAdminSession();
  const location = useLocation();

  if (status === "loading") return <LoadingState label="Checking your session…" className="min-h-screen" />;
  if (status === "unauthenticated") return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (status === "error") {
    return <ErrorState className="min-h-screen" title="Unable to verify your session" message="The server could not be reached. Check your connection and try again." onRetry={retry} />;
  }
  return <AdminLayout />;
}
