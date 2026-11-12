// View-model helpers for the Admin dashboard. Pure functions — no React, no network.
//
// The authenticated live API produces the raw shape (see docs/PHARMA_DMS_ADMIN_DASHBOARD.md §8
// and backend/services/adminDashboard.service.js). normalizeDashboard() gives components one stable view-model.

const shortFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" });

export function shortDate(iso) {
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? String(iso) : shortFmt.format(d);
}

export function formatRelative(iso, nowMs = Date.now()) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const mins = Math.floor((nowMs - t) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  if (hrs < 48) return "Yesterday";
  return shortDate(new Date(t).toISOString());
}

// Merge consecutive points so a chart never has more than `maxPoints` groups (sums the given keys).
export function compressSeries(points, keys, maxPoints) {
  if (points.length <= maxPoints) return points;
  const size = Math.ceil(points.length / maxPoints);
  const out = [];
  for (let i = 0; i < points.length; i += size) {
    const slice = points.slice(i, i + size);
    const merged = { ...slice[0] };
    for (const k of keys) merged[k] = slice.reduce((a, p) => a + (Number(p[k]) || 0), 0);
    out.push(merged);
  }
  return out;
}

const arr = (v) => (Array.isArray(v) ? v : []);
const bucket = (b) => ({ batches: b?.batches || 0, products: b?.products || 0, units: b?.units || 0, value: b?.value || 0 });

export function normalizeDashboard(raw, { source }) {
  if (!raw || typeof raw !== "object" || !raw.kpis || !raw.meta) throw new Error("Unexpected dashboard response");

  const trendPoints = arr(raw.salesTrend?.points).map((p) => ({ ...p, label: shortDate(p.date) }));
  const movementPoints = arr(raw.stockMovement?.points).map((p) => ({ ...p, label: shortDate(p.date) }));

  const inventoryValue = raw.kpis.currentInventory?.value || 0;
  const nearValue = raw.nearExpiry?.totals?.value || 0;

  return {
    source, // "live"
    meta: { ...raw.meta, rangeApplied: source === "live" },
    kpis: raw.kpis,
    salesTrend: { granularityDays: raw.salesTrend?.granularityDays || 1, points: trendPoints, hasData: trendPoints.some((p) => p.current > 0 || p.previous > 0) },
    distributors: arr(raw.distributors),
    categories: arr(raw.categories),
    stockMovement: {
      unit: raw.stockMovement?.unit || "units",
      granularityDays: raw.stockMovement?.granularityDays || 1,
      points: movementPoints,
      hasData: movementPoints.some((p) => p.stockIn || p.stockOut || p.salesReturns || p.adjustments),
    },
    nearExpiry: {
      buckets: { critical: bucket(raw.nearExpiry?.buckets?.critical), high: bucket(raw.nearExpiry?.buckets?.high), medium: bucket(raw.nearExpiry?.buckets?.medium) },
      totals: bucket(raw.nearExpiry?.totals),
      expired: bucket(raw.nearExpiry?.expired),
      shareOfInventoryPct: inventoryValue > 0 ? Math.round((nearValue / inventoryValue) * 1000) / 10 : 0,
    },
    topProducts: arr(raw.topProducts),
    activity: arr(raw.activity),
    alerts: arr(raw.alerts),
    sap: { status: raw.sap?.status || "not_configured", stats: raw.sap?.stats || null, erp: raw.sap?.erp || null },
  };
}

/**
 * erpCardModel — turns the LIVE `sap.erp` block (GET /api/admin/dashboard/summary, Phase 21) into what the ERP card shows. Pure.
 * Nothing here claims reachability: "health" is the outcome of recent sync runs, not a live connection test.
 * Returns { tone, label, message, rows: [{ label, value }] } — rows are real figures only.
 */
export function erpCardModel(erp) {
  if (!erp || erp.access === "UNAVAILABLE") {
    return { tone: "neutral", label: "ERP status unavailable", message: "ERP status could not be read just now. Nothing else on this dashboard depends on it.", rows: [] };
  }
  if (erp.access === "RESTRICTED") {
    return { tone: "neutral", label: "ERP details restricted", message: "Your role does not include permission to view ERP integration status.", rows: [] };
  }
  if (!erp.configured) {
    return { tone: "neutral", label: "No ERP connected", message: "No ERP connection is configured. The DMS is running standalone, which is a normal state — nothing is waiting to synchronise.", rows: [] };
  }
  const rows = [
    { label: "Failed syncs (7 days)", value: erp.failedSyncsLast7Days },
    { label: "Running / queued", value: `${erp.runningSyncs} / ${erp.queuedSyncs}` },
    { label: "Open alerts", value: erp.openAlerts },
    { label: "Active connections", value: `${erp.activeConnections} of ${erp.connections}` },
  ];
  if (!erp.activeConnections) {
    return { tone: "neutral", label: "ERP connections inactive", message: "ERP connections exist but none is active, so no synchronisation runs. The DMS is operating standalone.", rows };
  }
  const HEALTH = {
    HEALTHY: { tone: "success", label: "Recent syncs healthy", message: "Recent sync runs succeeded. This reflects sync history, not a live connection test." },
    WARNING: { tone: "warning", label: "Syncs need attention", message: "Some recent sync runs were partial or failed. See ERP Sync History and the Error Monitor." },
    ERROR: { tone: "error", label: "Syncs failing", message: "The latest sync run failed on at least one active connection. See the ERP Error Monitor. Core DMS operations are not affected." },
    UNKNOWN: { tone: "neutral", label: "No recent sync", message: "No sync has completed recently, so health cannot be assessed." },
  };
  return { ...(HEALTH[erp.health] || HEALTH.UNKNOWN), rows };
}
