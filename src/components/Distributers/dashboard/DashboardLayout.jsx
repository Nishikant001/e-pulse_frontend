import AppShell from "../../layout/AppShell";
import { distributorPortal } from "../../../config/portals";

// The Distributor portal shell. Routing is unchanged (App.jsx still mounts this at /dashboard);
// the frame itself (sidebar, header, responsive behaviour) now comes from the shared design system.
const DashboardLayout = () => <AppShell portal={distributorPortal} />;

export default DashboardLayout;
