// Sample-data mirror of the backend inventory rules (secondary_backend/services/inventoryRules.service.js).
// Used ONLY by the read-only sample adapter so demo data behaves like live data. The live screens never compute statuses:
// they render what the API returns. Keep in sync with the backend file (parity is checked in docs → Verification).
export const DAY_MS = 24 * 60 * 60 * 1000;
export const NEAR_EXPIRY_DAYS = 90;

// Phase 6: REGULATORY_HOLD added (additive on the backend too — non_saleable_reason is a plain string column).
export const NON_SALEABLE_REASONS = { DAMAGED: "Damaged", EXPIRED: "Expired", QUALITY_ISSUE: "Quality issue", REGULATORY_HOLD: "Regulatory hold", RETURNED: "Returned", BLOCKED: "Blocked", OTHER: "Other" };

// Phase 6 — FEFO & Expiry Management. Same 30/60/90-day thresholds as the Phase 3 Admin Dashboard and
// services/inventoryRules.service.js's EXPIRY_BUCKET_THRESHOLDS_DAYS (see that file for why).
export const EXPIRY_BUCKET_THRESHOLDS_DAYS = { critical: 30, high: 60, medium: 90 };
export function expiryBucket(exp, now, thresholds = EXPIRY_BUCKET_THRESHOLDS_DAYS) {
  if (!exp) return "healthy";
  const d = new Date(exp);
  if (d < now) return "expired";
  if (d < new Date(now.getTime() + thresholds.critical * DAY_MS)) return "critical";
  if (d < new Date(now.getTime() + thresholds.high * DAY_MS)) return "high";
  if (d < new Date(now.getTime() + thresholds.medium * DAY_MS)) return "medium";
  return "healthy";
}
export const EXPIRY_BUCKETS = [
  { key: "expired", label: "Expired", days: "Past expiry" },
  { key: "critical", label: "Critical", days: `Under ${EXPIRY_BUCKET_THRESHOLDS_DAYS.critical} days` },
  { key: "high", label: "Near Expiry", days: `${EXPIRY_BUCKET_THRESHOLDS_DAYS.critical}–${EXPIRY_BUCKET_THRESHOLDS_DAYS.high - 1} days` },
  { key: "medium", label: "Monitor", days: `${EXPIRY_BUCKET_THRESHOLDS_DAYS.high}–${EXPIRY_BUCKET_THRESHOLDS_DAYS.medium - 1} days` },
  { key: "healthy", label: "Healthy", days: `${EXPIRY_BUCKET_THRESHOLDS_DAYS.medium}+ days` },
];
export const ADJUSTMENT_REFS = ["DAMAGE", "EXPIRY", "BREAKAGE", "PHYSICAL_COUNT", "CORRECTION", "ADJUSTMENT"];
export const TXN_TYPES = {
  purchase: { label: "Purchase", match: [{ refs: ["PURCHASE"] }] },
  sale: { label: "Sale", match: [{ refs: ["SALES"] }] },
  sales_return: { label: "Sales Return", match: [{ refs: ["RETURN"], dir: "IN" }] },
  purchase_return: { label: "Purchase Return", match: [{ refs: ["RETURN"], dir: "OUT" }] },
  transfer: { label: "Stock Transfer", match: [{ refs: ["TRANSFER"] }] },
  adjustment: { label: "Adjustment", match: [{ refs: ADJUSTMENT_REFS }] },
  opening: { label: "Opening Stock", match: [{ refs: ["OPENING"] }] },
  status_change: { label: "Stock Status Change", match: [{ refs: ["RECLASSIFY"] }] },
};
export function classifyTransaction(ref, dir) {
  for (const [key, t] of Object.entries(TXN_TYPES)) {
    if (t.match.some((m) => m.refs.includes(ref) && (!m.dir || m.dir === dir))) return { key, label: t.label };
  }
  return { key: "other", label: "Other" };
}

export const isExpired = (exp, now) => !!exp && new Date(exp) < now;
export const isNear = (exp, now) => !!exp && new Date(exp) >= now && new Date(exp) < new Date(now.getTime() + NEAR_EXPIRY_DAYS * DAY_MS);
export const daysToExpiry = (exp, now) => (exp ? Math.ceil((new Date(exp).getTime() - now.getTime()) / DAY_MS) : null);

export function splitQuantities({ s, n, exp, active }, now) {
  const blocked = isExpired(exp, now) || !active;
  return { onHand: s + n, saleable: blocked ? 0 : s, nonSaleable: n + (blocked ? s : 0), blocked };
}
export function batchStatus({ s, n, exp, active }, now) {
  const q = splitQuantities({ s, n, exp, active }, now);
  if (q.onHand <= 0) return "out_of_stock";
  if (isExpired(exp, now)) return "expired";
  if (!active || q.saleable <= 0) return "non_saleable";
  return isNear(exp, now) ? "near_expiry" : "healthy";
}
export function productStatus({ expiredQty, nearExpiryQty, productSaleable, reorderLevel }) {
  if (expiredQty > 0) return "expired";
  if (reorderLevel != null && reorderLevel > 0 && productSaleable <= reorderLevel) return "low_stock";
  if (nearExpiryQty > 0) return "near_expiry";
  return "healthy";
}
