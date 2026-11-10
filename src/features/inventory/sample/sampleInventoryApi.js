// Read-only sample adapter for the Inventory screens. It answers the SAME requests as /api/admin/inventory/* with the SAME
// response shapes, computed from the deterministic demo dataset (see dataset.js). Quantities are derived from the sample
// ledger exactly as the server derives them from StockLedger — nothing is stored as a counter.
import { buildDataset } from "./dataset.js";
import * as R from "./rules.js";

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const money = (v) => Math.round(num(v) * 100) / 100;
const iso = (d) => new Date(d).toISOString();
const signed = (r) => (r.dir === "OUT" ? -r.qty : r.qty);
const like = (hay, needle) => String(hay ?? "").toLowerCase().includes(String(needle).toLowerCase());
const bad = (message, status = 400) => Object.assign(new Error(message), { status });

function paging(p, size = 25) {
  const page = Math.max(1, Number(p.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(p.pageSize) || size));
  return { page, pageSize, offset: (page - 1) * pageSize };
}
function sorter(rows, key, dir, cols, tie) {
  const col = cols[key];
  const d = dir === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const va = col(a), vb = col(b);
    let c;
    if (va == null && vb == null) c = 0;
    else if (va == null) c = 1;
    else if (vb == null) c = -1;
    else c = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: "base" });
    return c !== 0 ? c * d : tie(a, b);
  });
}

export function createSampleInventoryApi(now = new Date()) {
  const ds = buildDataset(now);
  const dist = new Map(ds.distributors.map((d) => [d.id, d]));
  const wh = new Map(ds.warehouses.map((w) => [w.id, w]));
  const defaultWh = new Map(ds.warehouses.filter((w) => w.isDefault).map((w) => [w.distributorId, w.id])); // Phase 6: fefoPreview's dispatch warehouse
  const prod = new Map(ds.products.map((p) => [p.id, p]));
  const batch = new Map(ds.batches.map((b) => [b.id, b]));

  // ── ledger with running balances (per batch + warehouse, both states, in ledger order) ─────────────────────────────────────────
  const ledger = [...ds.ledger].sort((a, b) => a.at - b.at || a.id - b.id);
  const running = new Map();
  for (const r of ledger) {
    const k = `${r.batchId}|${r.warehouseId}`;
    running.set(k, (running.get(k) || 0) + signed(r));
    r.balance = running.get(k);
  }

  // ── per (distributor, warehouse, batch) rows with derived quantities / flags / status ────────────────────────────────────────
  const bl = new Map();
  for (const r of ledger) {
    const k = `${r.batchId}|${r.warehouseId}`;
    const row = bl.get(k) || { distributorId: r.distributorId, productId: r.productId, batchId: r.batchId, wid: r.warehouseId, s: 0, n: 0 };
    if (r.state === "NON_SALEABLE") row.n += signed(r);
    else row.s += signed(r);
    bl.set(k, row);
  }
  const batchRows = [...bl.values()].map((x) => {
    const b = batch.get(x.batchId), p = prod.get(x.productId), d = dist.get(x.distributorId), w = wh.get(x.wid);
    const q = R.splitQuantities({ s: x.s, n: x.n, exp: b.expDate, active: b.active }, now);
    return {
      ...x, b, p, d, w, onHand: q.onHand, saleable: q.saleable, nonSaleable: q.nonSaleable, blocked: q.blocked,
      expired: R.isExpired(b.expDate, now), near: R.isNear(b.expDate, now), value: q.onHand * b.unitCost,
      status: R.batchStatus({ s: x.s, n: x.n, exp: b.expDate, active: b.active }, now),
    };
  });

  const distributorOf = (d) => ({ id: d.id, name: d.name, code: d.code });
  const warehouseOf = (w) => ({ id: w.id, name: w.name, code: w.code, implicit: false });
  const reservedByProduct = new Map();
  ds.openOrders.forEach((o) => reservedByProduct.set(o.productId, (reservedByProduct.get(o.productId) || 0) + o.qty));

  // Phase 6 — FEFO priority: 1-based rank within (distributor, warehouse, product), among currently-eligible rows
  // (status healthy/near_expiry) only, in the same earliest-expiry-first order allocation would actually use.
  // Mirrors services/inventoryQuery.service.js's SQL-computed `priority` (see docs — parity is checked by hand, not
  // by an automated cross-language test, same as the rest of this sample-data mirror).
  const priorityByKey = new Map();
  {
    const groups = new Map();
    for (const r of batchRows) {
      if (!["healthy", "near_expiry"].includes(r.status)) continue;
      const gk = `${r.distributorId}|${r.wid}|${r.productId}`;
      if (!groups.has(gk)) groups.set(gk, []);
      groups.get(gk).push(r);
    }
    for (const rows of groups.values()) {
      const ordered = [...rows].sort((a, b) => {
        const an = a.b.expDate == null, bn = b.b.expDate == null;
        if (an !== bn) return an ? 1 : -1;
        const at = an ? 0 : new Date(a.b.expDate).getTime();
        const bt = bn ? 0 : new Date(b.b.expDate).getTime();
        return at !== bt ? at - bt : a.batchId - b.batchId;
      });
      ordered.forEach((r, i) => priorityByKey.set(`${r.batchId}|${r.wid}`, i + 1));
    }
  }

  const mapBatch = (r) => ({
    key: `${r.distributorId}-${r.batchId}-${r.wid}`, batchId: r.batchId, productId: r.productId, sku: r.p.sku, product: r.p.name, category: r.p.category,
    batchNo: r.b.batchNo, distributor: distributorOf(r.d), warehouse: warehouseOf(r.w), mfgDate: r.b.mfgDate, expDate: r.b.expDate,
    daysToExpiry: R.daysToExpiry(r.b.expDate, now), availableQty: r.onHand, saleableQty: r.saleable, nonSaleableQty: r.nonSaleable,
    mrp: r.b.mrp, unitCost: r.b.unitCost, stockValue: money(r.value), status: r.status, batchActive: r.b.active,
    expiryBucket: R.expiryBucket(r.b.expDate, now), priority: priorityByKey.get(`${r.batchId}|${r.wid}`) ?? null,
  });

  // ── filters shared by the screens (same parameter names as the API) ─────────────────────────────────────────────────────────────
  const inScope = (r, p) => (!p.distributorId || r.distributorId === Number(p.distributorId)) && (!p.warehouseId || r.wid === Number(p.warehouseId)) && (!p.productId || r.productId === Number(p.productId)) && (!p.batchId || r.batchId === Number(p.batchId));

  function currentRows(p, { byWarehouse = true } = {}) {
    const base = batchRows.filter((r) => inScope(r, p));
    const all = batchRows.filter((r) => inScope(r, { ...p, warehouseId: null }));
    const pSaleable = new Map();
    all.forEach((r) => pSaleable.set(`${r.distributorId}|${r.productId}`, (pSaleable.get(`${r.distributorId}|${r.productId}`) || 0) + r.saleable));
    const groups = new Map();
    for (const r of base) {
      const k = byWarehouse ? `${r.distributorId}|${r.wid}|${r.productId}` : `${r.distributorId}|${r.productId}`;
      const g = groups.get(k) || { r, avail: 0, saleable: 0, nonSaleable: 0, expiredQty: 0, nearQty: 0, value: 0, batches: 0 };
      g.avail += r.onHand; g.saleable += r.saleable; g.nonSaleable += r.nonSaleable; g.value += r.value;
      if (r.expired && r.onHand > 0) g.expiredQty += r.onHand;
      if (r.near && !r.blocked) g.nearQty += r.saleable;
      if (r.onHand > 0) g.batches += 1;
      groups.set(k, g);
    }
    return [...groups.values()].map((g) => {
      const { r } = g;
      const isDefault = byWarehouse ? wh.get(r.wid)?.isDefault : true;
      const reserved = isDefault ? reservedByProduct.get(r.productId) || 0 : 0;
      const ps = pSaleable.get(`${r.distributorId}|${r.productId}`) || 0;
      return {
        key: `${r.distributorId}-${byWarehouse ? r.wid : "all"}-${r.productId}`, productId: r.productId, sku: r.p.sku, product: r.p.name, category: r.p.category, unit: r.p.unit,
        distributor: distributorOf(r.d), warehouse: byWarehouse ? warehouseOf(r.w) : null,
        availableQty: g.avail, reservedQty: reserved, saleableQty: g.saleable, nonSaleableQty: g.nonSaleable, expiredQty: g.expiredQty, nearExpiryQty: g.nearQty,
        batchCount: g.batches, reorderLevel: r.p.reorder, stockValue: money(g.value),
        status: R.productStatus({ expiredQty: g.expiredQty, nearExpiryQty: g.nearQty, productSaleable: ps, reorderLevel: r.p.reorder }),
      };
    });
  }

  const applyCurrentFilters = (rows, p) =>
    rows.filter((x) => {
      if (p.product && !(like(x.product, p.product) || like(x.sku, p.product))) return false;
      if (p.category && x.category !== p.category) return false;
      const batchesOf = () => ds.batches.filter((b) => b.productId === x.productId);
      if (p.batch && !batchesOf().some((b) => like(b.batchNo, p.batch))) return false;
      if (p.q && !(like(x.sku, p.q) || like(x.product, p.q) || like(x.distributor.name, p.q) || like(x.distributor.code, p.q) || like(x.warehouse?.name, p.q) || batchesOf().some((b) => like(b.batchNo, p.q)))) return false;
      return true;
    });

  const CURRENT_SORT = {
    sku: (x) => x.sku, product: (x) => x.product, category: (x) => x.category, distributor: (x) => x.distributor.name, warehouse: (x) => x.warehouse?.name,
    available: (x) => x.availableQty, reserved: (x) => x.reservedQty, saleable: (x) => x.saleableQty, non_saleable: (x) => x.nonSaleableQty, value: (x) => x.stockValue,
  };
  const BATCH_SORT = {
    product: (x) => x.product, sku: (x) => x.sku, batch_no: (x) => x.batchNo, distributor: (x) => x.distributor.name, warehouse: (x) => x.warehouse?.name, mfg_date: (x) => x.mfgDate,
    exp_date: (x) => x.expDate, available: (x) => x.availableQty, saleable: (x) => x.saleableQty, non_saleable: (x) => x.nonSaleableQty, mrp: (x) => x.mrp, value: (x) => x.stockValue,
    priority: (x) => x.priority,
  };

  // ── API ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  function lookups() {
    return {
      distributors: ds.distributors.map(distributorOf),
      warehouses: ds.warehouses.map((w) => ({ id: w.id, distributorId: w.distributorId, code: w.code, name: w.name, isDefault: w.isDefault, status: w.status })),
      categories: [...new Set(ds.products.map((p) => p.category))].sort(),
      transactionTypes: Object.entries(R.TXN_TYPES).map(([value, v]) => ({ value, label: v.label })),
      nonSaleableReasons: Object.entries(R.NON_SALEABLE_REASONS).map(([value, label]) => ({ value, label })),
      thresholds: { nearExpiryDays: R.NEAR_EXPIRY_DAYS, lowStock: "Product reorder level" },
      expiryBuckets: R.EXPIRY_BUCKETS,
      valuation: { basis: "COST", label: "Stock value at purchase cost (on-hand qty × batch purchase price)" },
    };
  }

  function current(p = {}) {
    const { page, pageSize, offset } = paging(p);
    let rows = applyCurrentFilters(currentRows(p), p);
    if (p.status) rows = rows.filter((x) => x.status === p.status);
    rows = sorter(rows, p.sort && CURRENT_SORT[p.sort] ? p.sort : "product", p.dir || "asc", CURRENT_SORT, (a, b) => a.product.localeCompare(b.product) || a.productId - b.productId);
    return { items: rows.slice(offset, offset + pageSize), total: rows.length, page, pageSize };
  }

  function summary(p = {}) {
    const rows = applyCurrentFilters(currentRows(p, { byWarehouse: false }), p);
    const sum = (f) => rows.reduce((a, x) => a + f(x), 0);
    return {
      totalStockValue: money(sum((x) => x.stockValue)), onHandQty: sum((x) => x.availableQty), saleableQty: sum((x) => x.saleableQty), nonSaleableQty: sum((x) => x.nonSaleableQty),
      totalSkus: rows.filter((x) => x.availableQty > 0).length, totalBatches: sum((x) => x.batchCount),
      lowStockItems: rows.filter((x) => x.status === "low_stock").length, nearExpiryItems: rows.filter((x) => x.nearExpiryQty > 0).length, expiredItems: rows.filter((x) => x.expiredQty > 0).length,
      valuation: lookups().valuation, nearExpiryDays: R.NEAR_EXPIRY_DAYS,
    };
  }

  function batches(p = {}) {
    const { page, pageSize, offset } = paging(p);
    let rows = batchRows.filter((r) => inScope(r, p)).map(mapBatch);
    if (p.includeEmpty !== "1" && p.includeEmpty !== true && p.status !== "out_of_stock") rows = rows.filter((x) => x.availableQty !== 0);
    if (p.product) rows = rows.filter((x) => like(x.product, p.product) || like(x.sku, p.product));
    if (p.category) rows = rows.filter((x) => x.category === p.category);
    if (p.batch) rows = rows.filter((x) => like(x.batchNo, p.batch));
    if (p.q) rows = rows.filter((x) => like(x.sku, p.q) || like(x.product, p.q) || like(x.batchNo, p.q) || like(x.distributor.name, p.q) || like(x.distributor.code, p.q) || like(x.warehouse.name, p.q));
    if (p.status) rows = rows.filter((x) => x.status === p.status);
    // Phase 6
    if (p.bucket) rows = rows.filter((x) => x.expiryBucket === p.bucket);
    if (p.fefoEligible === "1" || p.fefoEligible === true) rows = rows.filter((x) => ["healthy", "near_expiry"].includes(x.status));
    else rows = rows.map((x) => ({ ...x, priority: null })); // priority is only meaningful (and only returned) when asked for
    if (p.expFrom) rows = rows.filter((x) => x.expDate && x.expDate >= p.expFrom);
    if (p.expTo) rows = rows.filter((x) => x.expDate && x.expDate <= p.expTo);
    rows = sorter(rows, p.sort && BATCH_SORT[p.sort] ? p.sort : "exp_date", p.dir || "asc", BATCH_SORT, (a, b) => a.batchId - b.batchId || a.warehouse.id - b.warehouse.id);
    return { items: rows.slice(offset, offset + pageSize), total: rows.length, page, pageSize };
  }

  // Phase 6 — expiry bucket rollup, mirroring services/inventoryQuery.service.js#getExpiryBucketSummary: critical/
  // high/medium count only saleable, active, not-yet-expired stock; expired counts full on-hand.
  function expirySummary(p = {}) {
    const rows = batchRows.filter((r) => !p.distributorId || r.distributorId === Number(p.distributorId));
    const empty = () => ({ batches: 0, products: 0, units: 0, value: 0 });
    const acc = { critical: empty(), high: empty(), medium: empty(), healthy: empty(), expired: empty() };
    const seenBatch = { critical: new Set(), high: new Set(), medium: new Set(), healthy: new Set(), expired: new Set() };
    const seenProduct = { critical: new Set(), high: new Set(), medium: new Set(), healthy: new Set(), expired: new Set() };
    for (const r of rows) {
      if (r.onHand <= 0) continue;
      const bucket = R.expiryBucket(r.b.expDate, now);
      const qty = bucket === "expired" ? r.onHand : r.blocked ? 0 : r.saleable;
      if (qty <= 0 && bucket !== "expired") continue;
      acc[bucket].units += qty;
      acc[bucket].value += qty * r.b.unitCost;
      if (!seenBatch[bucket].has(r.batchId)) { seenBatch[bucket].add(r.batchId); acc[bucket].batches += 1; }
      if (!seenProduct[bucket].has(r.productId)) { seenProduct[bucket].add(r.productId); acc[bucket].products += 1; }
    }
    Object.values(acc).forEach((b) => { b.value = money(b.value); });
    return acc;
  }

  // Phase 6 — read-only "FEFO Allocation Preview": same algorithm the backend's inventory.service.planFefoAllocation
  // uses (earliest-eligible-expiry-first, deterministic id tie-break), applied to the sample dataset.
  function fefoPreview(p = {}) {
    const productId = Number(p.productId);
    const quantity = Number(p.quantity);
    if (!productId || !quantity || quantity <= 0) throw bad("productId and a positive quantity are required");
    const distributorId = p.distributorId ? Number(p.distributorId) : prod.get(productId)?.distributorId ?? null;
    const whId = p.warehouseId ? Number(p.warehouseId) : defaultWh.get(distributorId);
    let rows = batchRows.filter((r) => r.productId === productId && r.wid === whId && ["healthy", "near_expiry"].includes(r.status));
    rows = [...rows].sort((a, b) => {
      const an = a.b.expDate == null, bn = b.b.expDate == null;
      if (an !== bn) return an ? 1 : -1;
      const at = an ? 0 : new Date(a.b.expDate).getTime();
      const bt = bn ? 0 : new Date(b.b.expDate).getTime();
      return at !== bt ? at - bt : a.batchId - b.batchId;
    });
    let remaining = quantity;
    const allocations = [];
    for (const r of rows) {
      if (remaining <= 0) break;
      const take = Math.min(r.saleable, remaining);
      if (take > 0) {
        allocations.push({ batchId: r.batchId, batchNo: r.b.batchNo, expDate: r.b.expDate, available: r.saleable, allocated: take });
        remaining -= take;
      }
    }
    return { productId, distributorId, warehouseId: whId, requested: quantity, allocations, totalAllocated: quantity - remaining, remaining, sufficient: remaining <= 0 };
  }

  function batchDetail(id) {
    const b = batch.get(Number(id));
    if (!b) throw bad("Not found", 404);
    const p = prod.get(b.productId), d = dist.get(b.distributorId);
    const locs = batchRows.filter((r) => r.batchId === b.id);
    const sum = (f) => locs.reduce((a, r) => a + f(r), 0);
    const onHand = sum((r) => r.onHand), saleable = sum((r) => r.saleable), nonSaleable = sum((r) => r.nonSaleable);
    const status = R.batchStatus({ s: sum((r) => r.s), n: sum((r) => r.n), exp: b.expDate, active: b.active }, now);
    const reasons = new Map();
    ds.ledger.filter((r) => r.batchId === b.id && r.state === "NON_SALEABLE").forEach((r) => reasons.set(r.nsReason, (reasons.get(r.nsReason) || 0) + signed(r)));
    const breakdown = [...reasons].filter(([, q]) => q !== 0).map(([reason, qty]) => ({ reason, label: R.NON_SALEABLE_REASONS[reason] || reason, qty }));
    const derived = nonSaleable - breakdown.reduce((a, r) => a + r.qty, 0);
    if (derived > 0) breakdown.push({ reason: "EXPIRED", label: "Expired batch", qty: derived });
    return {
      batchId: b.id, batchNo: b.batchNo, status, batchActive: b.active,
      product: { id: p.id, name: p.name, sku: p.sku, category: p.category, unit: p.unit, manufacturer: p.manufacturer },
      mfgDate: b.mfgDate, expDate: b.expDate, daysToExpiry: R.daysToExpiry(b.expDate, now), mrp: b.mrp, unitCost: b.unitCost, hsn: p.hsn, gstRate: p.gst,
      stock: { totalQty: onHand, saleableQty: saleable, nonSaleableQty: nonSaleable, reservedQty: ds.openOrders.filter((o) => o.batchId === b.id).reduce((a, o) => a + o.qty, 0), stockValue: money(onHand * b.unitCost), nonSaleableBreakdown: breakdown },
      distributor: distributorOf(d),
      locations: locs.map((r) => ({ warehouse: warehouseOf(r.w), totalQty: r.onHand, saleableQty: r.saleable, nonSaleableQty: r.nonSaleable })),
      valuation: lookups().valuation,
    };
  }

  const ledgerFiltered = (p) => {
    const from = p.from ? new Date(`${p.from}T00:00:00.000Z`) : null;
    const to = p.to ? new Date(new Date(`${p.to}T00:00:00.000Z`).getTime() + 86400000) : null;
    return ledger.filter((r) => {
      if (p.distributorId && r.distributorId !== Number(p.distributorId)) return false;
      if (p.warehouseId && r.warehouseId !== Number(p.warehouseId)) return false;
      if (p.productId && r.productId !== Number(p.productId)) return false;
      if (p.batchId && r.batchId !== Number(p.batchId)) return false;
      const pr = prod.get(r.productId), bt = batch.get(r.batchId);
      if (p.product && !(like(pr.name, p.product) || like(pr.sku, p.product))) return false;
      if (p.batch && !like(bt.batchNo, p.batch)) return false;
      if (from && r.at < from) return false;
      if (to && r.at >= to) return false;
      if (p.txnType && R.classifyTransaction(r.ref, r.dir).key !== p.txnType) return false;
      if (p.q && !(like(pr.name, p.q) || like(pr.sku, p.q) || like(bt.batchNo, p.q) || like(r.returnNumber, p.q) || like(r.note, p.q) || String(r.refId ?? "") === String(p.q))) return false;
      return true;
    });
  };
  const refLabel = (r) => {
    if (r.ref === "PURCHASE") return `Purchase delivery #${r.refId}`;
    if (r.ref === "SALES") return `Sales delivery #${r.refId}`;
    if (r.ref === "RETURN") return r.returnNumber;
    if (r.ref === "TRANSFER") return `TRF-${String(r.refId).padStart(6, "0")}`;
    return r.note || (r.ref === "OPENING" ? "Opening stock" : "—");
  };

  function ledgerList(p = {}) {
    const { page, pageSize, offset } = paging(p);
    let rows = ledgerFiltered(p);
    rows = p.dir === "asc" ? rows : [...rows].reverse();
    const total = rows.length;
    const items = rows.slice(offset, offset + pageSize).map((r) => {
      const pr = prod.get(r.productId), bt = batch.get(r.batchId), t = R.classifyTransaction(r.ref, r.dir);
      return {
        id: r.id, date: iso(r.at), reference: refLabel(r), transactionType: t.key, transactionLabel: t.label, productId: pr.id, sku: pr.sku, product: pr.name,
        batchId: bt.id, batchNo: bt.batchNo, distributor: distributorOf(dist.get(r.distributorId)), warehouse: warehouseOf(wh.get(r.warehouseId)),
        inQty: r.dir === "IN" ? r.qty : null, outQty: r.dir === "OUT" ? r.qty : null, balance: r.balance,
        stockState: r.state === "NON_SALEABLE" ? "non_saleable" : "saleable", nonSaleableReason: r.nsReason || null, note: r.note || null,
      };
    });
    return { items, total, page, pageSize };
  }

  function movement(p = {}) {
    if (!p.productId && !p.batchId) throw bad("productId or batchId is required");
    const rows = ledger.filter((r) => inScope({ ...r, wid: r.warehouseId }, p));
    const from = p.from ? new Date(`${p.from}T00:00:00.000Z`) : null;
    const to = p.to ? new Date(new Date(`${p.to}T00:00:00.000Z`).getTime() + 86400000) : null;
    const inRange = (r) => (!from || r.at >= from) && (!to || r.at < to);
    const sum = (pred, f = (r) => r.qty) => rows.filter((r) => inRange(r) && pred(r)).reduce((a, r) => a + f(r), 0);
    const opening = from ? rows.filter((r) => r.at < from).reduce((a, r) => a + signed(r), 0) : 0;
    const stockIn = sum((r) => r.dir === "IN" && (r.ref === "PURCHASE" || r.ref === "OPENING"));
    const stockOut = sum((r) => r.dir === "OUT" && r.ref === "SALES");
    const returnsIn = sum((r) => r.ref === "RETURN" && r.dir === "IN");
    const returnsOut = sum((r) => r.ref === "RETURN" && r.dir === "OUT");
    const transfers = sum((r) => r.ref === "TRANSFER", signed);
    const adjustments = sum((r) => R.ADJUSTMENT_REFS.includes(r.ref), signed);
    const net = sum(() => true, signed);
    const returns = returnsIn - returnsOut;
    return {
      productId: p.productId ? Number(p.productId) : null, batchId: p.batchId ? Number(p.batchId) : null, from: p.from || null, to: p.to || null,
      opening, stockIn, stockOut, returns, returnsIn, returnsOut, transfers, adjustments, other: net - (stockIn - stockOut + returns + transfers + adjustments), closing: opening + net,
    };
  }

  const transfers = () => ({ items: [], total: 0, page: 1, pageSize: 25 });

  return { lookups, summary, current, batches, batchDetail, ledger: ledgerList, movement, transfers, expirySummary, fefoPreview, _dataset: ds };
}

let instance = null;
export function getSampleInventoryApi() {
  if (!instance) instance = createSampleInventoryApi(new Date());
  return instance;
}
