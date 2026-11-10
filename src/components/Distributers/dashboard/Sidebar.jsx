import Sidebar from "../../layout/Sidebar";
import { distributorPortal } from "../../../config/portals";

// Kept so existing imports of this path keep working. The sidebar itself now lives in
// components/layout/Sidebar.jsx and is driven by config/navigation.js.
const DistributorSidebar = (props) => <Sidebar navigation={distributorPortal.navigation} portalLabel={distributorPortal.label} {...props} />;

export default DistributorSidebar;
