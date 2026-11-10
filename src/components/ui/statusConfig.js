import {
  Ban, BadgeCheck, CircleAlert, CircleCheck, CircleDashed, CircleX, Clock, Eye, Hourglass, Info,
  LoaderCircle, Lock, Send, ShieldAlert, ShieldCheck, Truck, TrendingDown, TriangleAlert,
} from "lucide-react";

/**
 * Status system — ONE place that defines every status the product shows.
 * tone: success | warning | error | info | neutral   (colour is never the only signal: each has an icon + label)
 * Domains cover the pharma statuses from the spec AND the statuses that already exist in the current data
 * (e.g. DRAFT/CONFIRMED/PARTIALLY_DELIVERED, POSTED/PAID, Pending/Dispatched/Delivered).
 */
export const TONE_STYLES = {
  success: { badge: "bg-success-50 text-success-700 ring-success-200", dot: "bg-success-500", text: "text-success-700", chip: "bg-success-50 text-success-700", bar: "bg-success-600", border: "border-success-200", surface: "bg-success-50" },
  warning: { badge: "bg-warning-50 text-warning-700 ring-warning-200", dot: "bg-warning-500", text: "text-warning-700", chip: "bg-warning-50 text-warning-700", bar: "bg-warning-500", border: "border-warning-200", surface: "bg-warning-50" },
  error: { badge: "bg-error-50 text-error-700 ring-error-200", dot: "bg-error-500", text: "text-error-700", chip: "bg-error-50 text-error-700", bar: "bg-error-600", border: "border-error-200", surface: "bg-error-50" },
  info: { badge: "bg-info-50 text-info-700 ring-info-200", dot: "bg-info-500", text: "text-info-700", chip: "bg-info-50 text-info-700", bar: "bg-info-600", border: "border-info-200", surface: "bg-info-50" },
  neutral: { badge: "bg-neutral-100 text-neutral-700 ring-neutral-200", dot: "bg-neutral-500", text: "text-neutral-700", chip: "bg-neutral-100 text-neutral-700", bar: "bg-neutral-500", border: "border-neutral-200", surface: "bg-neutral-50" },
  brand: { badge: "bg-brand-50 text-brand-700 ring-brand-200", dot: "bg-brand-500", text: "text-brand-700", chip: "bg-brand-50 text-brand-700", bar: "bg-brand-600", border: "border-brand-200", surface: "bg-brand-50" },
};

export const TONE_ICONS = { success: CircleCheck, warning: TriangleAlert, error: CircleX, info: Info, neutral: CircleDashed, brand: Info };

const s = (label, tone, icon, spin = false) => ({ label, tone, icon, spin });

export const STATUS_DOMAINS = {
  salesOrder: {
    draft: s("Draft", "neutral", CircleDashed),
    confirmed: s("Confirmed", "info", CircleCheck),
    processing: s("Processing", "warning", Clock),
    partially_delivered: s("Partially delivered", "warning", Truck),
    fully_delivered: s("Fully delivered", "success", Truck),
    invoiced: s("Invoiced", "success", CircleCheck),
    closed: s("Closed", "neutral", Lock),
    cancelled: s("Cancelled", "neutral", Ban),
    synced: s("Synced", "success", BadgeCheck),
  },
  // Distributor portal — purchase-side documents (PO status values come from the backend in UPPER_SNAKE_CASE; statusKey() normalises them)
  purchaseOrder: {
    draft: s("Draft", "neutral", CircleDashed),
    confirmed: s("Confirmed", "info", CircleCheck),
    partially_received: s("Partially received", "warning", Truck),
    fully_received: s("Fully received", "success", Truck),
    closed: s("Closed", "neutral", Lock),
    cancelled: s("Cancelled", "neutral", Ban),
  },
  delivery: {
    pending: s("Pending", "warning", Clock),
    dispatched: s("Dispatched", "info", Truck),
    delivered: s("Delivered", "success", CircleCheck),
    cancelled: s("Cancelled", "neutral", Ban),
  },
  invoice: {
    draft: s("Draft", "neutral", CircleDashed),
    posted: s("Posted", "info", CircleCheck),
    partially_paid: s("Partially paid", "warning", Clock),
    paid: s("Paid", "success", BadgeCheck),
    cancelled: s("Cancelled", "neutral", Ban),
  },
  inventory: {
    healthy: s("Healthy", "success", ShieldCheck),
    low_stock: s("Low stock", "warning", TrendingDown),
    near_expiry: s("Near expiry", "warning", Hourglass),
    expired: s("Expired", "error", CircleX),
    damaged: s("Damaged", "error", TriangleAlert),
    quarantine: s("Quarantine", "info", ShieldAlert),
    active: s("Active", "success", CircleCheck),
    inactive: s("Inactive", "neutral", Ban),
    // Phase 5 — batch / stock-state statuses (text + icon, never colour alone)
    non_saleable: s("Non-saleable", "error", Ban),
    out_of_stock: s("Out of stock", "neutral", CircleDashed),
    saleable: s("Saleable", "success", CircleCheck),
    // Phase 6 — expiry buckets (FEFO Monitor / Near Expiry). Same 30/60/90-day thresholds as the batch/product status
    // above; "healthy" and "expired" above already fit these two buckets exactly and are reused, not duplicated.
    critical: s("Critical", "error", CircleAlert),
    high: s("Near Expiry", "warning", Hourglass),
    medium: s("Monitor", "info", Info),
  },
  // Phase 8 — Distributor Management account status (text + icon, never colour alone)
  distributor: {
    active: s("Active", "success", CircleCheck),
    inactive: s("Inactive", "neutral", Ban),
    pending: s("Pending", "warning", Clock),
  },
  // Phase 10 — Scheme Engine: effective status = stored status combined with the validity window
  scheme: {
    active: s("Active", "success", CircleCheck),
    inactive: s("Inactive", "neutral", Ban),
    scheduled: s("Scheduled", "info", Clock),
    expired: s("Expired", "warning", Hourglass),
  },
  sap: {
    synced: s("Synced", "success", BadgeCheck),
    pending: s("Pending", "neutral", Clock),
    running: s("Running", "info", LoaderCircle, true),
    failed: s("Failed", "error", CircleX),
    partial: s("Partial", "warning", CircleAlert),
  },
  claim: {
    draft: s("Draft", "neutral", CircleDashed),
    submitted: s("Submitted", "info", Send),
    under_review: s("Under review", "warning", Eye),
    approved: s("Approved", "success", CircleCheck),
    rejected: s("Rejected", "error", CircleX),
    settled: s("Settled", "success", BadgeCheck),
    // Phase 11 — Claims workflow additions
    needs_correction: s("Needs correction", "warning", CircleAlert),
    resubmitted: s("Resubmitted", "info", Send),
  },
  generic: {
    success: s("Success", "success", CircleCheck),
    warning: s("Warning", "warning", TriangleAlert),
    error: s("Error", "error", CircleX),
    info: s("Info", "info", Info),
    neutral: s("Neutral", "neutral", CircleDashed),
    active: s("Active", "success", CircleCheck),
    inactive: s("Inactive", "neutral", Ban),
  },
};

export function statusKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function titleCase(value) {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// Resolve { label, tone, icon, spin } for a raw status string. Unknown values fall back to a neutral badge.
export function getStatusMeta(status, domain) {
  const key = statusKey(status);
  const domains = domain ? [STATUS_DOMAINS[domain] || {}] : Object.values(STATUS_DOMAINS);
  for (const d of domains) {
    if (d[key]) return d[key];
  }
  return { label: titleCase(status) || "Unknown", tone: "neutral", icon: CircleDashed, spin: false };
}

// [{ value, label }] for building status filters.
export function getStatusOptions(domain) {
  return Object.entries(STATUS_DOMAINS[domain] || {}).map(([value, meta]) => ({ value, label: meta.label }));
}
