// Phase 18 display helpers. All meaning comes from the server (overview / reconciliation); this file only maps codes to labels and tones.
export const CLASSIFICATION_META = {
  COMPLETE: { label: "Complete", tone: "success" },
  PARTIAL: { label: "Partial", tone: "warning" },
  BLOCKED: { label: "Blocked", tone: "error" },
  UNSUPPORTED: { label: "Unsupported", tone: "neutral" },
};
export const STATE_META = {
  READY: { label: "Ready", tone: "success" },
  WARNING: { label: "Warning", tone: "warning" },
  BLOCKED: { label: "Blocked", tone: "error" },
  RUNNING: { label: "Running", tone: "info" },
  SUCCESS: { label: "Success", tone: "success" },
  PARTIAL: { label: "Partial", tone: "warning" },
  FAILED: { label: "Failed", tone: "error" },
  NOT_CONFIGURED: { label: "Not configured", tone: "neutral" },
};
export const VERIFICATION_LABEL = {
  NOT_CONFIGURED: "Not configured", CONFIGURED: "Configured", MOCK_VERIFIED: "Mock verified (no real ERP reached)", CONNECTION_TESTED: "Connection tested",
  READ_VERIFIED: "Read verified", WRITE_VERIFIED: "Write verified", PRODUCTION_VERIFIED: "Production verified",
};
export const RECON_META = {
  MATCHED: { label: "Matched", tone: "success" },
  MISMATCH: { label: "Mismatch", tone: "warning" },
  MISSING_IN_DMS: { label: "Missing in DMS", tone: "info" },
  MISSING_IN_ERP: { label: "Missing in ERP", tone: "info" },
  BLOCKED: { label: "Blocked", tone: "error" },
  PENDING_REVIEW: { label: "Pending review", tone: "warning" },
};
export const DECISION_META = { DECIDED: { label: "Decided", tone: "success" }, REQUIRED: { label: "Decision required", tone: "error" }, READY: { label: "Foundation ready", tone: "info" } };
/** A blocker the business must resolve is explained in plain words; technical codes never reach the user as a stack trace. */
export const blockerTitle = (b) => (b.code === "BUSINESS_DECISION_REQUIRED" ? "Business decision required" : b.code === "OUTBOUND_SYNC_BLOCKED" ? "Sending to the ERP is blocked" : b.code === "MAPPING_NOT_CONFIGURED" ? "Field mapping incomplete" : b.code === "PROVIDER_NOT_SUPPORTED" ? "Provider not supported" : "Configuration needed");
export const RECONCILABLE = ["PRODUCT_MASTER", "CUSTOMER_MASTER", "DISTRIBUTOR_MASTER", "PRICING", "STOCK", "SALES", "PAYMENT"];
