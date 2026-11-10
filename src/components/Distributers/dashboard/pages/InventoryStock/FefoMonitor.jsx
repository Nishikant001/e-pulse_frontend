import FefoMonitorPage from "../../../../../features/inventory/pages/FefoMonitorPage";

// Phase 6: the Distributor portal uses the shared Inventory screen (server-scoped to the signed-in distributor).
export default function FefoMonitor() {
  return <FefoMonitorPage portal="distributor" />;
}
