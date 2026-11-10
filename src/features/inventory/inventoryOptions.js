// Option lists for the Inventory filters. VALUES must match the backend (services/inventoryRules.service.js); the statuses
// themselves are always computed by the server — the UI only lists them for filtering and renders what it receives.
export const PRODUCT_STATUS_OPTIONS = [
  { value: "healthy", label: "Healthy" },
  { value: "low_stock", label: "Low stock" },
  { value: "near_expiry", label: "Near expiry" },
  { value: "expired", label: "Expired" },
];
export const BATCH_STATUS_OPTIONS = [
  { value: "healthy", label: "Healthy" },
  { value: "near_expiry", label: "Near expiry" },
  { value: "expired", label: "Expired" },
  { value: "non_saleable", label: "Non-saleable" },
  { value: "out_of_stock", label: "Out of stock" },
];

// Phase 6 — Expiry bucket filter (Near Expiry / FEFO Monitor / Expired Stock). A DIFFERENT axis from batch/product
// status above: a bucket is purely about the expiry DATE window (see services/inventoryRules.service.js#expiryBucket);
// a batch can be, e.g., "critical" (expiring within 30 days) AND already "non_saleable" for an unrelated reason.
// Falls back to this literal list if `lookups.expiryBuckets` (the API's own copy) hasn't loaded yet.
export const EXPIRY_BUCKET_OPTIONS = [
  { value: "critical", label: "Critical (< 30 days)" },
  { value: "high", label: "Near Expiry (30–59 days)" },
  { value: "medium", label: "Monitor (60–89 days)" },
  { value: "healthy", label: "Healthy (90+ days)" },
  { value: "expired", label: "Expired" },
];
