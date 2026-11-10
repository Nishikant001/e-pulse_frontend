import CurrentStockPage from "../../../../../features/inventory/pages/CurrentStockPage";

// Phase 5: the Distributor portal uses the shared Inventory screen (server-scoped to the signed-in distributor).
export default function CurrentStock() {
  return <CurrentStockPage portal="distributor" />;
}
