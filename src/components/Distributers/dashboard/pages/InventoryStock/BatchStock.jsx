import BatchStockPage from "../../../../../features/inventory/pages/BatchStockPage";

// Phase 5: the Distributor portal uses the shared Inventory screen (server-scoped to the signed-in distributor).
export default function BatchStock() {
  return <BatchStockPage portal="distributor" />;
}
