import { lazy, Suspense } from "react";
import LoadingState from "../../components/ui/LoadingState";
import { useAdminSession } from "../adminAuth/adminSessionContext";
import { isSuperAdmin } from "./isSuperAdmin";

const AdminDashboardPage = lazy(() => import("../adminDashboard/AdminDashboardPage"));
const SuperAdminHomePage = lazy(() => import("./pages/SuperAdminHomePage"));

/** /admin/dashboard — Super Admins get the platform dashboard; every other admin keeps the existing head-office dashboard. */
export default function AdminHomeRoute() {
  const { admin } = useAdminSession();
  const Page = isSuperAdmin(admin) ? SuperAdminHomePage : AdminDashboardPage;
  return (
    <Suspense fallback={<LoadingState label="Loading dashboard…" />}>
      <Page />
    </Suspense>
  );
}
