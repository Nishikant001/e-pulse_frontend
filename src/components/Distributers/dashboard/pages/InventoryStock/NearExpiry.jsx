import NearExpiryPage from "../../../../../features/inventory/pages/NearExpiryPage";

// Phase 6: the Distributor portal uses the shared Inventory screen (server-scoped to the signed-in distributor).
export default function NearExpiry() {
  return <NearExpiryPage portal="distributor" />;
}
