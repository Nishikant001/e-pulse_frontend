import StockLedgerPage from "../../../../../features/inventory/pages/StockLedgerPage";

// Phase 5: the Distributor portal uses the shared Inventory screen (server-scoped to the signed-in distributor).
export default function StockLedger() {
  return <StockLedgerPage portal="distributor" />;
}
