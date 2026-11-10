import { formatINRCompact, formatNumber } from "../../../utils/format";

// Structured alerts from the API/sample → display text. Codes the UI does not know fall back to a neutral message.
const plural = (n, one, many) => `${formatNumber(n)} ${n === 1 ? one : many}`;

export function alertText(alert, thresholds = { critical: 30, high: 60, medium: 90 }) {
  const value = alert.value !== undefined ? `Stock value ${formatINRCompact(alert.value)}` : undefined;
  switch (alert.code) {
    case "NEAR_EXPIRY_CRITICAL":
      return { title: `${plural(alert.count, "batch expires", "batches expire")} in under ${thresholds.critical} days`, description: value };
    case "NEAR_EXPIRY_HIGH":
      return { title: `${plural(alert.count, "batch expires", "batches expire")} in ${thresholds.critical}–${thresholds.high - 1} days`, description: value };
    case "EXPIRED_STOCK":
      return { title: `${plural(alert.count, "expired batch still holds", "expired batches still hold")} stock`, description: value };
    case "LOW_STOCK":
      return { title: `Low stock detected: ${plural(alert.count, "product", "products")} at or below reorder level`, description: "Based on each product's reorder level" };
    case "CREDIT_LIMIT_EXCEEDED":
      return { title: `Distributor credit limit exceeded (${plural(alert.count, "distributor", "distributors")})` };
    case "SAP_SYNC_FAILURE":
      return { title: `SAP synchronization failure (${plural(alert.count, "document", "documents")})` };
    case "PENDING_CLAIM":
      return { title: `Pending claim${alert.count === 1 ? "" : "s"}: ${formatNumber(alert.count)} awaiting review` };
    case "RECONCILIATION_DONE":
      return { title: "Stock reconciliation completed" };
    default:
      return { title: String(alert.code || "Alert").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) };
  }
}

export const TONE_LABEL = { error: "Critical", warning: "Warning", info: "Info", success: "Success" };
