// ═══════════════════════════════════════════════════════════════════════════════════════════════
//  SAMPLE DATA — clearly separated demo layer for the Admin dashboard.
//
//  Nothing in this file is real. It exists so the dashboard can be demonstrated (and designed) where the backend
//  cannot supply a figure yet, or the database is empty. Every screen that shows it says "Sample data".
//  It is produced deterministically (no Math.random) and returns the SAME raw shape as GET /api/admin/dashboard/summary,
//  so it is replaced 1-for-1 by live data. All names are fictitious; no personal information.
//
//  Headline figures are the reference values from the Phase 3 brief (₹2.48 Cr sales, 1,248 orders, 486 distributors …).
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const DAY = 24 * 60 * 60 * 1000;
const iso = (d) => d.toISOString().slice(0, 10);

// Deterministic integer split of `total` by `weights` (sums exactly to total).
function distribute(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const parts = weights.map((w) => Math.floor((total * w) / sum));
  parts[parts.length - 1] += total - parts.reduce((a, b) => a + b, 0);
  return parts;
}

// Pharma secondary sales are lower on Sundays and peak mid-week; a gentle upward drift over the month.
const WEEKDAY = { 1: 1.08, 2: 1.05, 3: 1.02, 4: 1.06, 5: 1.1, 6: 0.98, 0: 0.55 };
const dayWeights = (start, days, drift, factors = WEEKDAY) =>
  Array.from({ length: days }, (_, i) => {
    const d = new Date(start.getTime() + i * DAY);
    return (1 + drift * i) * factors[d.getUTCDay()];
  });

export const SAMPLE_REFERENCE = {
  totalSecondarySales: 24_800_000, // ₹2.48 Cr
  salesChangePct: 12.6,
  todaysOrders: 1248,
  ordersChangePct: 8.4,
  activeDistributors: 486,
  registeredDistributors: 512,
  activeRetailers: 12842,
  registeredRetailers: 14905,
  currentInventory: 187_000_000, // ₹18.7 Cr
  nearExpiry: { critical: 820_000, high: 1_460_000, medium: 2_000_000 }, // ₹8.2 L / ₹14.6 L / ₹20.0 L
  salesReturns: 840_000, // ₹8.4 L
  outstanding: 67_200_000, // ₹6.72 Cr
};

const CATEGORY_SALES = [
  ["Antibiotics", 5_208_000], ["Analgesics", 3_968_000], ["Gastro", 3_472_000], ["Diabetes", 3_224_000],
  ["Vitamins & Supplements", 2_728_000], ["Cardiac", 2_480_000], ["Respiratory", 1_984_000], ["Other", 1_736_000],
]; // sums to exactly 24,800,000

const DISTRIBUTORS = [
  ["Sunrise Pharma Distributors", "Mumbai", 1_428_000, 14.2, 212, 3_182_000],
  ["Shree Sai Drug Agencies", "Pune", 1_186_500, 9.8, 187, 2_410_000],
  ["Lifeline Medico Distributors", "Hyderabad", 1_042_300, 18.6, 164, 4_120_000],
  ["Apex Healthcare Traders", "Bengaluru", 968_400, -3.4, 151, 1_960_000],
  ["Vardhman Pharma Agencies", "Ahmedabad", 902_700, 7.1, 146, 1_340_000],
  ["Om Sai Medical Distributors", "Nagpur", 861_900, 22.4, 139, 2_880_000],
  ["Kaveri Drug Distributors", "Chennai", 804_600, 11.0, 128, 1_520_000],
  ["Northern Star Pharma", "Delhi NCR", 752_300, -1.8, 120, 3_410_000],
  ["Eastern Meds Distribution", "Kolkata", 698_100, 5.6, 109, 980_000],
  ["Konkan Health Supplies", "Goa", 655_200, 12.7, 101, 1_270_000],
];

const PRODUCTS = [
  ["Paracetamol 500mg", "Analgesics", 1_842_000, 612_400, 11.8],
  ["Azithromycin 500mg", "Antibiotics", 1_536_500, 148_200, 9.4],
  ["Pantoprazole 40mg", "Gastro", 1_388_200, 298_600, 14.9],
  ["Amoxicillin 500mg", "Antibiotics", 1_264_900, 186_300, 6.2],
  ["Metformin 500mg", "Diabetes", 1_172_400, 402_800, 8.7],
  ["Vitamin D3", "Vitamins & Supplements", 1_096_700, 254_100, 21.3],
  ["Calcium Tablets", "Vitamins & Supplements", 984_300, 231_700, 5.1],
  ["ORS", "Gastro", 902_600, 519_400, -2.4],
  ["Cough Syrup", "Respiratory", 861_400, 176_900, 17.6],
  ["Insulin", "Diabetes", 812_800, 38_600, 3.9],
];

const prevFromGrowth = (value, growthPct) => Math.round(value / (1 + growthPct / 100));

// `now` is injectable for tests. Trend windows are the last 30 days ending today (the sample is a fixed illustration
// and does NOT respond to the selected date range).
export function buildSampleRaw(now = new Date()) {
  const today = new Date(`${iso(now)}T00:00:00.000Z`);
  const span = 30;
  const start = new Date(today.getTime() - (span - 1) * DAY);
  const prevStart = new Date(start.getTime() - span * DAY);
  const R = SAMPLE_REFERENCE;

  const prevTotal = Math.round(R.totalSecondarySales / (1 + R.salesChangePct / 100));
  const cur = distribute(R.totalSecondarySales, dayWeights(start, span, 0.006));
  const prv = distribute(prevTotal, dayWeights(prevStart, span, 0.004));
  const salesTrendPoints = cur.map((v, i) => ({ date: iso(new Date(start.getTime() + i * DAY)), current: v, previous: prv[i] }));

  const inW = dayWeights(start, span, 0.002, { 1: 1.5, 2: 1.2, 3: 0.9, 4: 1.0, 5: 1.4, 6: 0.7, 0: 0.2 });
  const outW = dayWeights(start, span, 0.005);
  const retW = dayWeights(start, span, 0.0, { 1: 1.1, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.1, 6: 0.9, 0: 0.3 });
  const adjW = dayWeights(start, span, 0.0, { 1: 0.8, 2: 0.6, 3: 1.2, 4: 0.6, 5: 1.0, 6: 1.6, 0: 0.2 });
  const ins = distribute(128_400, inW);
  const outs = distribute(121_900, outW);
  const rets = distribute(6_300, retW);
  const adjs = distribute(1_150, adjW);
  const movementPoints = ins.map((v, i) => ({ date: iso(new Date(start.getTime() + i * DAY)), stockIn: v, stockOut: outs[i], salesReturns: rets[i], adjustments: adjs[i] }));

  const distributors = DISTRIBUTORS.map(([name, territory, sales, growthPct, orders, outstanding], i) => ({
    rank: i + 1, id: i + 1, code: `DTC${String(i + 1).padStart(3, "0")}`, name, territory, sales,
    previousSales: prevFromGrowth(sales, growthPct), growthPct, orders, outstanding, status: "active",
  }));

  const catTotal = CATEGORY_SALES.reduce((a, [, v]) => a + v, 0);
  const categories = CATEGORY_SALES.map(([name, sales]) => ({ name, sales, share: Math.round((sales / catTotal) * 1000) / 10 }));

  const topProducts = PRODUCTS.map(([name, category, sales, quantity, growthPct], i) => ({ rank: i + 1, name, category, sales, quantity, growthPct }));

  const ne = R.nearExpiry;
  const buckets = {
    critical: { batches: 14, products: 9, units: 18_400, value: ne.critical },
    high: { batches: 27, products: 21, units: 41_200, value: ne.high },
    medium: { batches: 41, products: 33, units: 62_900, value: ne.medium },
  };
  const totals = { batches: 82, products: 63, units: 122_500, value: ne.critical + ne.high + ne.medium }; // ₹42.8 L

  const ago = (mins) => new Date(now.getTime() - mins * 60000).toISOString();
  const activity = [
    { id: "s1", module: "Sales Orders", action: "Sales order confirmed", status: "CONFIRMED", reference: "SO-2026-01482", distributor: DISTRIBUTORS[0][0], at: ago(6) },
    { id: "s2", module: "Sales Invoices", action: "Invoice posted", status: "POSTED", reference: "INV-2026-00871", distributor: DISTRIBUTORS[1][0], at: ago(18) },
    { id: "s3", module: "SAP Integration", action: "Distributor synchronization completed", status: "SYNCED", reference: null, distributor: null, at: ago(42) },
    { id: "s4", module: "Inventory", action: "Batch approaching expiry", status: "NEAR_EXPIRY", reference: "B-24017", distributor: DISTRIBUTORS[2][0], at: ago(65) },
    { id: "s5", module: "Sales Returns", action: "Sales return received", status: "POSTED", reference: "SR-2026-00214", distributor: DISTRIBUTORS[3][0], at: ago(130) },
    { id: "s6", module: "Sales Orders", action: "Sales order partially delivered", status: "PARTIALLY_DELIVERED", reference: "SO-2026-01476", distributor: DISTRIBUTORS[4][0], at: ago(190) },
    { id: "s7", module: "Sales Invoices", action: "Invoice paid", status: "PAID", reference: "INV-2026-00864", distributor: DISTRIBUTORS[5][0], at: ago(260) },
  ];

  const alerts = [
    { id: "a1", code: "NEAR_EXPIRY_CRITICAL", tone: "error", count: buckets.critical.batches, value: ne.critical },
    { id: "a2", code: "SAP_SYNC_FAILURE", tone: "error", count: 3 },
    { id: "a3", code: "CREDIT_LIMIT_EXCEEDED", tone: "warning", count: 2 },
    { id: "a4", code: "LOW_STOCK", tone: "warning", count: 18 },
    { id: "a5", code: "PENDING_CLAIM", tone: "info", count: 6 },
    { id: "a6", code: "RECONCILIATION_DONE", tone: "success", count: 1 },
  ];

  return {
    meta: {
      generatedAt: now.toISOString(),
      range: { from: iso(start), to: iso(today) },
      previousRange: { from: iso(prevStart), to: iso(new Date(start.getTime() - DAY)) },
      asOf: iso(today),
      timezone: "UTC",
      nearExpiryThresholdsDays: { critical: 30, high: 60, medium: 90 },
      appliedTo: { range: [], today: [], snapshot: [] },
    },
    kpis: {
      totalSecondarySales: { value: R.totalSecondarySales, previous: prevTotal, changePct: R.salesChangePct },
      todaysOrders: { value: R.todaysOrders, previous: Math.round(R.todaysOrders / (1 + R.ordersChangePct / 100)), changePct: R.ordersChangePct },
      activeDistributors: { value: R.activeDistributors, registered: R.registeredDistributors },
      activeRetailers: { value: R.activeRetailers, registered: R.registeredRetailers },
      currentInventory: { value: R.currentInventory, units: 4_860_000, batches: 3_412 },
      nearExpiryStock: { value: totals.value, batches: totals.batches },
      salesReturns: { value: R.salesReturns, previous: 780_000, changePct: pctChange(R.salesReturns, 780_000), count: 214 },
      outstanding: { value: R.outstanding },
    },
    salesTrend: { granularityDays: 1, points: salesTrendPoints },
    distributors,
    categories,
    stockMovement: { unit: "units", granularityDays: 1, points: movementPoints },
    nearExpiry: { buckets, totals, expired: { batches: 6, products: 5, units: 3_100, value: 214_000 } },
    topProducts,
    activity,
    alerts,
    // Sample SAP statistics (the connection STATUS itself stays honest: not configured).
    sap: { status: "not_configured", stats: { documentsSynced: 1842, pending: 23, failed: 3, lastSyncAt: ago(42) } },
  };
}

function pctChange(cur, prev) {
  return prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null;
}
