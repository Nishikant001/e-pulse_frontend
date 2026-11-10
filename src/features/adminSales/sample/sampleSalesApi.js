// Sample-mode implementation of the Admin Sales API. It answers the SAME requests as the live API
// (server-style filtering, search, sorting and pagination) from the isolated demo dataset (./dataset.js), returning the SAME
// response shapes. It is read-only: sample mode never creates, changes or deletes anything.
import { buildSampleDataset } from "./dataset.js";

const DAY = 24 * 60 * 60 * 1000;
const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const iso = (s) => (s ? `${String(s).replace(" ", "T")}.000Z` : null);
const day = (s) => (s ? String(s).slice(0, 10) : null);
const lc = (v) => String(v ?? "").toLowerCase();

const SALES_STATUSES = ["POSTED", "PARTIALLY_PAID", "PAID"];

// Presentation rules — a twin of backend services/salesStatus.service.js (verified equal by the parity test).
function displayStatus({ status, deliveries, uninvoiced, sap }) {
  if (status !== "DRAFT" && status !== "CANCELLED" && sap === "SYNCED") return "synced";
  if (status === "DRAFT") return "draft";
  if (status === "CANCELLED") return "cancelled";
  if (status === "CONFIRMED") return "confirmed";
  if (status === "CLOSED") return "invoiced";
  if (status === "FULLY_DELIVERED" && deliveries > 0 && uninvoiced === 0) return "invoiced";
  return "processing";
}
function orderActions({ status, remaining, uninvoiced }) {
  const a = ["view"];
  if (status === "DRAFT") a.push("edit", "confirm", "cancel");
  if (status === "CONFIRMED") a.push("cancel");
  if (["CONFIRMED", "PARTIALLY_DELIVERED", "FULLY_DELIVERED"].includes(status) && (remaining > 0 || uninvoiced > 0)) a.push("create_invoice");
  return a;
}
const invoiceActions = (status) => (status === "DRAFT" ? ["view", "print", "download", "post", "cancel"] : ["view", "print", "download"]);

const STAGES = [["draft", "Order created"], ["confirmed", "Confirmed"], ["processing", "Processing"], ["invoiced", "Invoiced"], ["synced", "SAP synced"]];

function paginate(rows, query) {
  const pageSize = Number(query.pageSize) || 25;
  const page = Number(query.page) || 1;
  return { items: rows.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: rows.length };
}
function sortRows(rows, query, map, fallback, tie) {
  const key = map[query.sort] ? query.sort : fallback.key;
  const dir = (query.dir || fallback.dir) === "asc" ? 1 : -1;
  const pick = map[key];
  return [...rows].sort((a, b) => {
    const va = pick(a);
    const vb = pick(b);
    if (va === vb || (va == null && vb == null)) return tie(b) - tie(a);
    if (va == null) return -dir;
    if (vb == null) return dir;
    return (va < vb ? -1 : 1) * dir;
  });
}

export function createSampleApi(data) {
  const distributors = new Map(data.distributors.map((d) => [d.id, d]));
  const customers = new Map(data.customers.map((c) => [c.id, c]));
  const products = new Map(data.products.map((p) => [p.id, p]));
  const batches = new Map(data.batches.map((b) => [b.id, b]));
  const hsn = new Map(data.hsn.map((h) => [h.id, h]));
  const territoryOf = (d) => d.city || d.region || null;
  const categoryOf = (p) => (String(p.category || "").trim() ? p.category.trim() : "Uncategorised");
  const sapOf = (type, id) => data.sap.find((s) => s.entity_type === type && s.entity_id === id) || null;
  const linesOf = new Map();
  data.orderLines.forEach((l) => linesOf.set(l.orderId, [...(linesOf.get(l.orderId) || []), l]));
  const deliveriesOf = new Map();
  data.deliveries.forEach((d) => deliveriesOf.set(d.orderId, [...(deliveriesOf.get(d.orderId) || []), d]));
  const dLinesOf = new Map();
  data.deliveryLines.forEach((l) => dLinesOf.set(l.deliveryId, [...(dLinesOf.get(l.deliveryId) || []), l]));
  const invoiceOfDelivery = new Map();
  data.invoices.forEach((i) => invoiceOfDelivery.set(i.deliveryId, [...(invoiceOfDelivery.get(i.deliveryId) || []), i]));
  const invLines = new Map();
  data.invoiceLines.forEach((l) => invLines.set(l.invoiceId, [...(invLines.get(l.invoiceId) || []), l]));
  const outByDeliveryLine = new Map();
  data.ledger.filter((l) => l.movement_type === "OUT" && l.reference_type === "SALES").forEach((l) => outByDeliveryLine.set(l.reference_line_id, [...(outByDeliveryLine.get(l.reference_line_id) || []), l]));
  const orderById = new Map(data.orders.map((o) => [o.id, o]));

  // ───────── orders ─────────
  function orderRow(o) {
    const d = distributors.get(o.distributor_id);
    const dels = (deliveriesOf.get(o.id) || []).filter((x) => x.status !== "Cancelled");
    const uninvoiced = dels.filter((x) => !(invoiceOfDelivery.get(x.id) || []).some((i) => i.status !== "CANCELLED")).length;
    const lines = linesOf.get(o.id) || [];
    const qty = lines.reduce((a, l) => a + l.quantity, 0);
    const delivered = dels.reduce((a, x) => a + (dLinesOf.get(x.id) || []).reduce((s, l) => s + l.quantityDelivered, 0), 0);
    const sapRow = sapOf("SALES_ORDER", o.id);
    const applicable = o.status !== "DRAFT" && o.status !== "CANCELLED";
    const sapStatus = applicable ? (sapRow ? sapRow.status : "PENDING") : null;
    const cust = customers.get(o.customerId);
    return {
      _o: o, _dels: dels.length, _uninv: uninvoiced,
      id: o.id, orderNumber: o.order_number, orderDate: day(o.orderDate),
      distributor: { id: d.id, code: d.distributor_code, name: d.name }, retailer: { id: o.customerId, name: cust ? cust.name : o.customerName },
      territory: territoryOf(d), paymentTerms: o.paymentMethod, productCount: lines.length, quantity: qty, amount: r2(o.totalAmount), scheme: null,
      status: displayStatus({ status: o.status, deliveries: dels.length, uninvoiced, sap: sapRow ? sapRow.status : null }), rawStatus: o.status,
      sapStatus, sapDocumentNo: sapRow ? sapRow.sap_document_no : null, actions: orderActions({ status: o.status, remaining: qty - delivered, uninvoiced }),
    };
  }
  const allOrders = () => data.orders.map(orderRow);

  function listOrders(query = {}) {
    let rows = allOrders();
    if (query.from) rows = rows.filter((r) => r.orderDate >= query.from);
    if (query.to) rows = rows.filter((r) => r.orderDate <= query.to);
    if (query.distributorId) rows = rows.filter((r) => r.distributor.id === Number(query.distributorId));
    if (query.retailer) rows = rows.filter((r) => lc(r.retailer.name).includes(lc(query.retailer)));
    if (query.territory) rows = rows.filter((r) => r.territory === query.territory);
    if (query.q) {
      const s = lc(query.q);
      rows = rows.filter((r) => [r.orderNumber, r.distributor.name, r.distributor.code, r.retailer.name, r.sapDocumentNo].some((v) => lc(v).includes(s))
        || (deliveriesOf.get(r.id) || []).some((d) => (invoiceOfDelivery.get(d.id) || []).some((i) => lc(i.invoice_number).includes(s))));
    }
    if (query.status) rows = rows.filter((r) => r.status === query.status);
    if (query.sap) rows = rows.filter((r) => r.sapStatus === String(query.sap).toUpperCase());
    rows = sortRows(rows, query, {
      order_number: (r) => r.orderNumber, order_date: (r) => r.orderDate, distributor_name: (r) => r.distributor.name, retailer_name: (r) => r.retailer.name,
      product_count: (r) => r.productCount, quantity: (r) => r.quantity, amount: (r) => r.amount, status: (r) => r.status,
    }, { key: "order_date", dir: "desc" }, (r) => r.id);
    const page = paginate(rows, query);
    return { ...page, items: page.items.map(({ _o, _dels, _uninv, ...r }) => r) };
  }

  function orderLineAmounts(l) {
    const p = products.get(l.productId);
    return l._a && { ...l._a, cgstRate: p.cgst, sgstRate: p.sgst, igstRate: 0 };
  }

  function getOrder(id) {
    const o = orderById.get(Number(id));
    if (!o) return null;
    const { _o, _dels, _uninv, ...row } = orderRow(o);
    const d = distributors.get(o.distributor_id);
    const cust = customers.get(o.customerId);
    const lines = (linesOf.get(o.id) || []).map((l) => {
      const p = products.get(l.productId);
      const b = l.batchId ? batches.get(l.batchId) : null;
      const a = orderLineAmounts(l);
      const delivered = (deliveriesOf.get(o.id) || []).filter((x) => x.status !== "Cancelled").reduce((s, x) => s + (dLinesOf.get(x.id) || []).filter((dl) => dl.orderLineId === l.id).reduce((t, dl) => t + dl.quantityDelivered, 0), 0);
      return {
        id: l.id, productId: p.id, product: p.name, sku: p.material_code, hsn: hsn.get(p.hsn_id).hsn_code, unit: p.unit, category: categoryOf(p),
        batch: b ? { id: b.id, batchNo: b.batch_no, mfgDate: day(b.mfg_date), expDate: day(b.exp_date), status: b.status } : null,
        quantity: l.quantity, deliveredQuantity: delivered, mrp: null, dealerPrice: r2(l.pricePerUnit), discountPercent: l.discount,
        gstRate: a.cgstRate + a.sgstRate + a.igstRate, gross: a.gross, discountAmount: a.discountAmount, taxable: a.taxable, cgst: a.cgst, sgst: a.sgst, igst: a.igst,
        tax: a.tax, cgstRate: a.cgstRate, sgstRate: a.sgstRate, igstRate: a.igstRate, net: a.net, storedNet: r2(l.lineNetValue),
      };
    });
    const sum = (k) => r2(lines.reduce((a, l) => a + l[k], 0));
    const totals = { subtotal: sum("gross"), discount: sum("discountAmount"), taxable: sum("taxable"), cgst: sum("cgst"), sgst: sum("sgst"), igst: sum("igst") };
    totals.totalTax = r2(totals.cgst + totals.sgst + totals.igst);
    totals.roundOff = 0;
    totals.grandTotal = r2(totals.taxable + totals.totalTax);
    totals.stored = { taxable: r2(o.netValue), cgst: r2(o.cgstAmount), sgst: r2(o.sgstAmount), igst: r2(o.igstAmount), grandTotal: r2(o.totalAmount) };

    const dels = deliveriesOf.get(o.id) || [];
    const events = [{ key: "created", label: "Order created", at: iso(o.createdAt), detail: null }];
    dels.forEach((dl) => {
      const q = (dLinesOf.get(dl.id) || []).reduce((s, l) => s + l.quantityDelivered, 0);
      events.push({ key: `delivery-${dl.id}`, label: `Delivery ${dl.status === "Cancelled" ? "cancelled" : "recorded"}`, at: iso(dl.deliveryDate || dl.createdAt), detail: `${q} units` });
      (invoiceOfDelivery.get(dl.id) || []).filter((i) => i.status !== "CANCELLED").forEach((i) => events.push({ key: `invoice-${i.id}`, label: `Invoice ${i.invoice_number} ${i.status.toLowerCase().replace("_", " ")}`, at: iso(i.postedAt || i.invoiceDate || i.createdAt), detail: null }));
    });
    if (o.status === "CANCELLED") events.push({ key: "cancelled", label: "Order cancelled (time is the last update)", at: iso(o.updatedAt), detail: null });
    const sapRow = sapOf("SALES_ORDER", o.id);
    if (sapRow && sapRow.last_attempt_at) events.push({ key: "sap", label: `SAP ${sapRow.status.toLowerCase()}`, at: iso(sapRow.last_attempt_at), detail: sapRow.sap_document_no || sapRow.last_error || null });
    events.sort((a, b) => (a.at || "").localeCompare(b.at || ""));
    const rank = { draft: 0, confirmed: 1, processing: 2, invoiced: 3, synced: 4 }[row.status] ?? 0;
    const cancelled = row.status === "cancelled";
    return {
      order: {
        ...row, remarks: o.description || null, billingAddress: null, shippingAddress: null, expectedDelivery: null, distributorGstin: d.tax_no || null,
        retailerGstin: cust ? cust.taxNumber : null, retailerAddress: cust ? [cust.street1, cust.city, cust.pincode].filter(Boolean).join(", ") : null,
      },
      lines, totals,
      deliveries: dels.map((dl) => {
        const inv = (invoiceOfDelivery.get(dl.id) || []).find((i) => i.status !== "CANCELLED");
        return { id: dl.id, date: day(dl.deliveryDate), status: dl.status, quantity: (dLinesOf.get(dl.id) || []).reduce((s, l) => s + l.quantityDelivered, 0), invoiceId: inv ? inv.id : null, invoiceNumber: inv ? inv.invoice_number : null, invoiceStatus: inv ? inv.status : null };
      }),
      stages: STAGES.map(([key, label], i) => ({ key, label, reached: !cancelled && i <= rank, current: !cancelled && i === rank })),
      events,
      sap: row.sapStatus ? { status: row.sapStatus, documentNo: row.sapDocumentNo, lastAttemptAt: sapRow ? iso(sapRow.last_attempt_at) : null, lastError: sapRow ? sapRow.last_error : null } : null,
    };
  }

  // ───────── invoices ─────────
  function invoiceRow(i) {
    const d = distributors.get(i.distributor_id);
    const cust = customers.get(i.customer_id);
    const dl = data.deliveries.find((x) => x.id === i.deliveryId);
    const ord = dl ? orderById.get(dl.orderId) : null;
    const lines = invLines.get(i.id) || [];
    const sapRow = sapOf("SALES_INVOICE", i.id);
    const applicable = SALES_STATUSES.includes(i.status);
    return {
      id: i.id, invoiceNumber: i.invoice_number, invoiceDate: day(i.invoiceDate), distributor: { id: d.id, code: d.distributor_code, name: d.name },
      retailer: { id: i.customer_id, name: cust ? cust.name : null }, territory: territoryOf(d), orderNumber: ord ? ord.order_number : null,
      productCount: lines.length, quantity: lines.reduce((a, l) => a + l.quantity, 0), invoiceValue: r2(i.totalAmount), outstanding: r2(i.outstandingAmount),
      dueDate: day(i.dueDate), paymentTerms: i.paymentTerms, status: i.status.toLowerCase(), rawStatus: i.status,
      sapStatus: applicable ? (sapRow ? sapRow.status : "PENDING") : null, sapDocumentNo: sapRow ? sapRow.sap_document_no : null, actions: invoiceActions(i.status),
    };
  }

  function listInvoices(query = {}) {
    let rows = data.invoices.map(invoiceRow);
    if (query.from) rows = rows.filter((r) => r.invoiceDate >= query.from);
    if (query.to) rows = rows.filter((r) => r.invoiceDate <= query.to);
    if (query.distributorId) rows = rows.filter((r) => r.distributor.id === Number(query.distributorId));
    if (query.retailer) rows = rows.filter((r) => lc(r.retailer.name).includes(lc(query.retailer)));
    if (query.territory) rows = rows.filter((r) => r.territory === query.territory);
    if (query.status) rows = rows.filter((r) => r.rawStatus === String(query.status).toUpperCase());
    if (query.q) {
      const s = lc(query.q);
      rows = rows.filter((r) => [r.invoiceNumber, r.distributor.name, r.distributor.code, r.retailer.name, r.orderNumber, r.sapDocumentNo].some((v) => lc(v).includes(s)));
    }
    if (query.sap) rows = rows.filter((r) => r.sapStatus === String(query.sap).toUpperCase());
    rows = sortRows(rows, query, {
      invoice_number: (r) => r.invoiceNumber, invoice_date: (r) => r.invoiceDate, distributor_name: (r) => r.distributor.name, retailer_name: (r) => r.retailer.name,
      product_count: (r) => r.productCount, quantity: (r) => r.quantity, invoice_value: (r) => r.invoiceValue, status: (r) => r.rawStatus,
    }, { key: "invoice_date", dir: "desc" }, (r) => r.id);
    return paginate(rows, query);
  }

  function getInvoice(id) {
    const i = data.invoices.find((x) => x.id === Number(id));
    if (!i) return null;
    const row = invoiceRow(i);
    const d = distributors.get(i.distributor_id);
    const cust = customers.get(i.customer_id);
    const lines = (invLines.get(i.id) || []).map((l) => {
      const p = products.get(l.productId);
      const gross = r2(l.pricePerUnit * l.quantity);
      const alloc = (outByDeliveryLine.get(l.deliveryLineId) || []).map((x) => ({ x, b: batches.get(x.batchId) })).sort((a, b) => (a.b.exp_date < b.b.exp_date ? -1 : 1));
      return {
        id: l.id, product: p.name, sku: p.material_code, hsn: hsn.get(p.hsn_id).hsn_code, unit: p.unit,
        batches: alloc.map(({ x, b }) => ({ id: b.id, batchNo: b.batch_no, mfgDate: day(b.mfg_date), expDate: day(b.exp_date), quantity: x.quantity })),
        quantity: l.quantity, mrp: null, dealerPrice: r2(l.pricePerUnit), gross, discountAmount: r2(l.discount), discountPercent: gross > 0 ? Math.round((l.discount / gross) * 10000) / 100 : 0,
        taxable: r2(l.taxableValue), cgst: r2(l.cgstAmount), sgst: r2(l.sgstAmount), igst: r2(l.igstAmount), tax: r2(l.cgstAmount + l.sgstAmount + l.igstAmount), gstRate: p.gst, net: r2(l.lineTotal),
      };
    });
    const sapRow = sapOf("SALES_INVOICE", i.id);
    return {
      invoice: {
        ...row, postedAt: i.postedAt ? iso(i.postedAt) : null,
        company: { name: d.name, code: d.distributor_code, gstin: d.tax_no, pan: d.pan, phone: d.phone_number, address: d.address },
        retailerDetails: { name: cust ? cust.name : null, gstin: cust ? cust.taxNumber : null, address: cust ? [cust.street1, cust.city, cust.pincode].filter(Boolean).join(", ") : null },
      },
      lines,
      totals: {
        grossAmount: r2(lines.reduce((a, l) => a + l.gross, 0)), discount: r2(lines.reduce((a, l) => a + l.discountAmount, 0)), taxable: r2(i.netValue),
        cgst: r2(i.cgstAmount), sgst: r2(i.sgstAmount), igst: r2(i.igstAmount), roundOff: r2(i.roundOff), grandTotal: r2(i.totalAmount),
      },
      sap: row.sapStatus ? { status: row.sapStatus, documentNo: row.sapDocumentNo, lastAttemptAt: sapRow ? iso(sapRow.last_attempt_at) : null, lastError: sapRow ? sapRow.last_error : null } : null,
    };
  }

  // ───────── secondary sales (invoice line × batch allocation) ─────────
  function secondaryRows() {
    const rows = [];
    data.invoices.filter((i) => SALES_STATUSES.includes(i.status)).forEach((i) => {
      const d = distributors.get(i.distributor_id);
      const cust = customers.get(i.customer_id);
      const dl = data.deliveries.find((x) => x.id === i.deliveryId);
      const ord = dl ? orderById.get(dl.orderId) : null;
      const sapRow = sapOf("SALES_INVOICE", i.id);
      (invLines.get(i.id) || []).forEach((l) => {
        const p = products.get(l.productId);
        const allocs = outByDeliveryLine.get(l.deliveryLineId) || [];
        const parts = allocs.length ? allocs.map((a) => ({ b: batches.get(a.batchId), qty: a.quantity })) : [{ b: null, qty: l.quantity }];
        parts.forEach(({ b, qty }) => {
          const ratio = qty / l.quantity;
          rows.push({
            _i: i, _l: l, _ratio: ratio, _hsn: hsn.get(p.hsn_id).hsn_code, _b: b, _ord: ord,
            key: `${l.id}-${b ? b.id : 0}`, lineId: l.id, invoiceId: i.id, invoiceNumber: i.invoice_number, invoiceDate: day(i.invoiceDate),
            distributor: { id: d.id, code: d.distributor_code, name: d.name }, retailer: { id: i.customer_id, name: cust ? cust.name : null }, territory: territoryOf(d),
            product: p.name, sku: p.material_code, category: categoryOf(p), batchNo: b ? b.batch_no : null, expiryDate: b ? day(b.exp_date) : null,
            quantity: qty, mrp: null, dealerPrice: r2(l.pricePerUnit), scheme: null, discountAmount: r2(l.discount * ratio),
            gst: r2((l.cgstAmount + l.sgstAmount + l.igstAmount) * ratio), netValue: r2(l.taxableValue * ratio),
            sapStatus: sapRow ? sapRow.status : "PENDING", _raw: { net: l.taxableValue * ratio, gst: (l.cgstAmount + l.sgstAmount + l.igstAmount) * ratio },
          });
        });
      });
    });
    return rows;
  }

  function filterSecondary(rows, query, { withDate = true } = {}) {
    let r = rows;
    if (withDate && query.from) r = r.filter((x) => x.invoiceDate >= query.from);
    if (withDate && query.to) r = r.filter((x) => x.invoiceDate <= query.to);
    if (query.distributorId) r = r.filter((x) => x.distributor.id === Number(query.distributorId));
    if (query.retailer) r = r.filter((x) => lc(x.retailer.name).includes(lc(query.retailer)));
    if (query.product) r = r.filter((x) => lc(x.product).includes(lc(query.product)) || lc(x.sku).includes(lc(query.product)));
    if (query.category) r = r.filter((x) => x.category === query.category);
    if (query.territory) r = r.filter((x) => x.territory === query.territory);
    if (query.batch) r = r.filter((x) => lc(x.batchNo).includes(lc(query.batch)));
    if (query.sap) r = r.filter((x) => x.sapStatus === String(query.sap).toUpperCase());
    if (query.q) {
      const s = lc(query.q);
      r = r.filter((x) => [x.invoiceNumber, x.distributor.name, x.distributor.code, x.retailer.name, x.product, x.sku, x.batchNo].some((v) => lc(v).includes(s)));
    }
    return r;
  }

  const strip = ({ _i, _l, _ratio, _hsn, _b, _ord, _raw, ...rest }) => rest;

  function listSecondary(query = {}) {
    let rows = filterSecondary(secondaryRows(), query);
    rows = sortRows(rows, query, {
      invoice_date: (r) => r.invoiceDate, invoice_number: (r) => r.invoiceNumber, distributor_name: (r) => r.distributor.name, retailer_name: (r) => r.retailer.name,
      product: (r) => r.product, quantity: (r) => r.quantity, net_value: (r) => r._raw.net, gst: (r) => r._raw.gst,
    }, { key: "invoice_date", dir: "desc" }, (r) => r.lineId * 1e6 + (r._b ? r._b.id : 0));
    const page = paginate(rows, query);
    return { ...page, items: page.items.map(strip) };
  }

  function getSecondary(key) {
    const m = /^(\d+)-(\d+)$/.exec(String(key));
    if (!m) return null;
    const r = secondaryRows().find((x) => x.key === `${Number(m[1])}-${Number(m[2])}`);
    if (!r) return null;
    const gross = r2(r._l.pricePerUnit * r._l.quantity * r._ratio);
    const sapRow = sapOf("SALES_INVOICE", r.invoiceId);
    return {
      record: {
        ...strip(r), hsn: r._hsn, mfgDate: r._b ? day(r._b.mfg_date) : null, orderNumber: r._ord ? r._ord.order_number : null, paymentTerms: r._i.paymentTerms, invoiceStatus: r._i.status.toLowerCase(),
        grossValue: gross, discountPercent: gross > 0 ? Math.round((r.discountAmount / gross) * 10000) / 100 : 0,
        cgst: r2(r._l.cgstAmount * r._ratio), sgst: r2(r._l.sgstAmount * r._ratio), igst: r2(r._l.igstAmount * r._ratio), unitNetValue: r.quantity > 0 ? r2(r.netValue / r.quantity) : 0,
      },
      sap: { status: r.sapStatus, documentNo: sapRow ? sapRow.sap_document_no : null, lastAttemptAt: sapRow ? iso(sapRow.last_attempt_at) : null, lastError: sapRow ? sapRow.last_error : null },
    };
  }

  function getSecondarySummary(query = {}) {
    const today = day(new Date(data.now).toISOString());
    const monthStart = `${today.slice(0, 7)}-01`;
    const from = query.from || monthStart;
    const to = query.to || today;
    const all = secondaryRows();
    const rows = filterSecondary(all, { ...query, from, to });
    const undated = filterSecondary(all, query, { withDate: false });
    const sumNet = (rs) => r2(rs.reduce((a, r) => a + r._raw.net, 0));
    const span = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY) + 1;
    const size = span <= 62 ? 1 : span <= 200 ? 7 : 30;
    const points = [];
    for (let i = 0; i < span; i += size) points.push({ date: new Date(Date.parse(`${from}T00:00:00Z`) + i * DAY).toISOString().slice(0, 10), raw: 0 });
    rows.forEach((r) => {
      const idx = Math.floor((Date.parse(`${r.invoiceDate}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY / size);
      if (idx >= 0 && idx < points.length) points[idx].raw += r._raw.net;
    });
    const top = (keyOf, build) => {
      const m = new Map();
      rows.forEach((r) => {
        const k = keyOf(r);
        const cur = m.get(k) || { ...build(r), raw: 0, quantity: 0 };
        cur.raw += r._raw.net;
        cur.quantity += r.quantity;
        m.set(k, cur);
      });
      return [...m.values()].sort((a, b) => b.raw - a.raw).slice(0, 10);
    };
    return {
      meta: { range: { from, to }, asOf: today, timezone: "UTC" },
      kpis: {
        totalSecondarySales: sumNet(rows),
        todaysSecondarySales: sumNet(undated.filter((r) => r.invoiceDate === today)),
        monthlySecondarySales: sumNet(undated.filter((r) => r.invoiceDate >= monthStart && r.invoiceDate <= today)),
        activeDistributors: new Set(rows.map((r) => r.distributor.id)).size,
        activeRetailers: new Set(rows.map((r) => r.retailer.id)).size,
        totalInvoices: new Set(rows.map((r) => r.invoiceId)).size,
        totalQuantity: rows.reduce((a, r) => a + r.quantity, 0),
      },
      trend: { granularityDays: size, points: points.map((p) => ({ date: p.date, value: r2(p.raw) })) },
      distributors: top((r) => r.distributor.id, (r) => ({ id: r.distributor.id, code: r.distributor.code, name: r.distributor.name })).map((x) => ({ id: x.id, code: x.code, name: x.name, value: r2(x.raw) })),
      products: top((r) => lc(r.product.trim()), (r) => ({ name: r.product })).map((x) => ({ name: x.name, quantity: x.quantity, value: r2(x.raw) })),
    };
  }

  function getFilterLookups() {
    return {
      distributors: [...data.distributors].sort((a, b) => (a.name < b.name ? -1 : 1)).map((d) => ({ id: d.id, code: d.distributor_code, name: d.name, territory: territoryOf(d) })),
      territories: [...new Set(data.distributors.map(territoryOf).filter(Boolean))].sort(),
      categories: [...new Set(data.products.map(categoryOf))].sort(),
    };
  }

  return { listOrders, getOrder, listInvoices, getInvoice, listSecondary, getSecondary, getSecondarySummary, getFilterLookups, data };
}

let shared = null;
// Built lazily, once per page load, relative to "now" so the sample always looks current.
export function getSampleApi() {
  if (!shared) shared = createSampleApi(buildSampleDataset(new Date()));
  return shared;
}
