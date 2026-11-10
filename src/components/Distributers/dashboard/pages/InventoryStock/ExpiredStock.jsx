import ExpiredStockPage from "../../../../../features/inventory/pages/ExpiredStockPage";

// Phase 6: the Distributor portal uses the shared Inventory screen (server-scoped to the signed-in distributor).
export default function ExpiredStock() {
  return <ExpiredStockPage portal="distributor" />;
}
