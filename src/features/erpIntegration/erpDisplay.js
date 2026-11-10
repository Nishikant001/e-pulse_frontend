// Display helpers for ERP connections and sync — labels and tones only; the backend (services/erp/erpConstants.js) owns the values.
// Vendor-neutral: SAP is just one of several ERP types / providers.
export const ERP_TYPE_LABEL = { SAP_ECC: "SAP ECC", SAP_S4HANA: "SAP S/4HANA", ORACLE_ERP: "Oracle ERP", MS_DYNAMICS: "Microsoft Dynamics", TALLY: "Tally", CUSTOM_ERP: "Custom ERP", OTHER_ERP: "Other ERP" };
export const ENV_LABEL = { PRODUCTION: "Production", SECONDARY: "Secondary", QUALITY: "Quality", DEVELOPMENT: "Development", TEST: "Test" };
export const DIRECTION_LABEL = { ERP_TO_DMS: "ERP → DMS", DMS_TO_ERP: "DMS → ERP", BIDIRECTIONAL: "Both ways" };
export const PROVIDER_STATUS_META = {
  IMPLEMENTED: { label: "Available", tone: "success" },
  FOUNDATION_ONLY: { label: "Foundation only", tone: "warning" },
  FUTURE: { label: "Planned", tone: "neutral" },
  NOT_SELECTED: { label: "No provider", tone: "neutral" },
};
export const AUTH_LABEL = { BASIC: "Basic (user + password)", BEARER_TOKEN: "Bearer token", API_KEY: "API key" };
export const PAGINATION_LABEL = { NONE: "None (single response)", PAGE_NUMBER: "Page number", OFFSET_LIMIT: "Offset + limit", NEXT_URL: "Next-page link", CURSOR: "Cursor" };

// Lifecycle status is NOT reachability. Health comes only from the last real connection test.
export const STATUS_META = {
  ACTIVE: { label: "Active", tone: "success" },
  INACTIVE: { label: "Inactive", tone: "neutral" },
  ERROR: { label: "Error", tone: "error" },
};
export const HEALTH_META = {
  NOT_TESTED: { label: "Not tested", tone: "neutral" },
  REACHABLE: { label: "Reachable", tone: "success" },
  FAILED: { label: "Failed", tone: "error" },
};
// Phase 17 connection health (server-derived `health.status`): CONNECTED | DEGRADED | FAILED | NOT_TESTED | DISABLED. `state` (REACHABLE | FAILED | NOT_TESTED) is the older field.
export const HEALTH_STATUS_META = {
  CONNECTED: { label: "Connected", tone: "success" },
  DEGRADED: { label: "Degraded", tone: "warning" },
  FAILED: { label: "Failed", tone: "error" },
  NOT_TESTED: { label: "Not tested", tone: "neutral" },
  DISABLED: { label: "Disabled", tone: "neutral" },
};
export const healthMeta = (health) => HEALTH_STATUS_META[health?.status] || HEALTH_META[health?.state] || HEALTH_META.NOT_TESTED;
/** Error text for a toast / alert. Adds the support reference (correlation id) when the server sent one; never anything else from the response. */
export const errorText = (err, fallback = "Something went wrong") => `${err?.message || fallback}${err?.correlationId ? ` (ref ${err.correlationId})` : ""}`;
export const CRED_META = {
  RESOLVED: { label: "Credentials configured", tone: "success" },
  MISSING: { label: "Credentials not found on server", tone: "error" },
  NOT_SET: { label: "No credential reference", tone: "warning" },
};
export const JOB_STATUS_META = {
  QUEUED: { label: "Queued", tone: "info" },
  RUNNING: { label: "Running", tone: "info" },
  SUCCESS: { label: "Success", tone: "success" },
  PARTIAL: { label: "Partial", tone: "warning" },
  FAILED: { label: "Failed", tone: "error" },
};
export const TRIGGER_LABEL = { MANUAL: "Manual", SCHEDULED: "Scheduled", RETRY: "Retry" };
export const isJobActive = (j) => j && (j.status === "QUEUED" || j.status === "RUNNING");
export const enabledCaps = (c) => (c.capabilities || []).filter((x) => x.enabled);

// Phase 15 — sync health (computed by the server from real job history) and schedule display.
export const SYNC_HEALTH_META = {
  HEALTHY: { label: "Healthy", tone: "success" },
  WARNING: { label: "Warning", tone: "warning" },
  ERROR: { label: "Error", tone: "error" },
  UNKNOWN: { label: "No data", tone: "neutral" },
};
export const SCHEDULE_STATUS_LABEL = { QUEUED: "Queued", RUNNING: "Running", SUCCESS: "Success", PARTIAL: "Partial", FAILED: "Failed", SKIPPED: "Skipped" };
export const PAYMENT_MODES = ["CASH", "BANK_TRANSFER", "UPI", "CHEQUE", "OTHER"];
// Capabilities the sync can run: enabled, ERP → DMS (or both), a DMS target exists (server flag).
export const syncableCaps = (c) => (c?.capabilities || []).filter((x) => x.enabled && x.syncSupported && x.direction !== "DMS_TO_ERP");
// Error categories (values owned by the backend, services/erp/erpConstants.js) — used only for the error-monitor filter list.
export const ERROR_CODE_OPTIONS = ["CONNECTION_ERROR", "AUTHENTICATION_ERROR", "AUTHORIZATION_ERROR", "TIMEOUT", "RATE_LIMITED", "SERVER_ERROR", "INVALID_RESPONSE", "INVALID_CONFIGURATION", "INVALID_ENDPOINT", "REQUEST_REJECTED", "MAPPING_ERROR", "MAPPING_NOT_CONFIGURED", "VALIDATION_ERROR", "PROVIDER_NOT_SUPPORTED", "CAPABILITY_NOT_SUPPORTED", "LIMIT_EXCEEDED", "BUSINESS_DECISION_REQUIRED", "INTERNAL_ERROR"];
