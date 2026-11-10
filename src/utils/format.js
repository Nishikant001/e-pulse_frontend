// Number/currency formatting helpers (Indian numbering: lakh / crore).
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const num = new Intl.NumberFormat("en-IN");

export function formatINR(value) {
  const n = Number(value);
  return Number.isFinite(n) ? inr.format(n) : "—";
}

export function formatNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? num.format(n) : "—";
}

// ₹2.48 Cr, ₹12.4 L, ₹8,250 …  (for KPI cards)
// Options: { fixed: n } keeps exactly n decimals (₹20.0 L) instead of trimming trailing zeros (₹20 L).
export function formatINRCompact(value, { fixed } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const trim = (x) => (fixed === undefined ? Number(x.toFixed(2)).toString() : x.toFixed(fixed)); // 18.70 → 18.7, 2.48 → 2.48
  if (abs >= 1e7) return `${sign}₹${trim(abs / 1e7)} Cr`;
  if (abs >= 1e5) return `${sign}₹${trim(abs / 1e5)} L`;
  return `${sign}₹${num.format(abs)}`;
}

const inrWhole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

// ₹18,42,000 (tables: exact rupees, Indian digit grouping)
export function formatINRWhole(value) {
  const n = Number(value);
  return Number.isFinite(n) ? inrWhole.format(n) : "—";
}

export function formatPercent(value, digits = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });

// "05 Sep 2026" for an ISO date (YYYY-MM-DD) or ISO timestamp — dates are calendar days, so no time-zone shift is applied.
export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(String(value).length <= 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

// "05 Sep 2026, 03:30 pm" (India time) for an ISO timestamp.
export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : dateTimeFmt.format(d);
}
