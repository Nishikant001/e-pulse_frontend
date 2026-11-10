// ═══════════════════════════════════════════════════════════════════════════════════════════════
//  SAMPLE SALES DATASET — isolated demo layer for the Admin Sales screens.
//
//  Nothing here is real. It is generated deterministically (seeded generator, no Math.random) from small catalogue tables:
//  16 distributors · ~40 retailers · 28 catalogue products (instantiated per distributor, as in the real data model)
//  · ~450 batches · 78 sales orders · 54 invoices · stock ledger allocations · SAP status rows.
//  All names are fictitious; no personal data. The shape mirrors the database tables so the SAME dataset can be loaded into
//  a test database and compared with the backend (see docs/PHARMA_DMS_SALES_SECONDARY_SALES.md, "Verification").
//
//  The tax arithmetic below exists ONLY to build fixture values; the running app never calculates money — live mode shows
//  backend values and sample mode shows the values stored here.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const DAY = 24 * 60 * 60 * 1000;

const DISTRIBUTORS = [
  ["Sunrise Pharma Distributors", "Mumbai", "Maharashtra"], ["Shree Sai Drug Agencies", "Pune", "Maharashtra"],
  ["Lifeline Medico Distributors", "Hyderabad", "Telangana"], ["Apex Healthcare Traders", "Bengaluru", "Karnataka"],
  ["Vardhman Pharma Agencies", "Ahmedabad", "Gujarat"], ["Om Sai Medical Distributors", "Nagpur", "Maharashtra"],
  ["Kaveri Drug Distributors", "Chennai", "Tamil Nadu"], ["Northern Star Pharma", "Delhi NCR", "Delhi"],
  ["Eastern Meds Distribution", "Kolkata", "West Bengal"], ["Konkan Health Supplies", "Panaji", "Goa"],
  ["Malwa Pharma Traders", "Indore", "Madhya Pradesh"], ["Rajputana Medico Agencies", "Jaipur", "Rajasthan"],
  ["Deccan Drug House", "Nashik", "Maharashtra"], ["Kerala Care Distributors", "Kochi", "Kerala"],
  ["Punjab Health Wholesale", "Ludhiana", "Punjab"], ["Odisha Pharma Link", "Bhubaneswar", "Odisha"],
];

const RETAILER_BASES = ["Sanjeevani Medicos", "Arogya Medical Store", "Lotus Chemist", "Green Cross Pharmacy", "Shanti Medicals", "Nirmal Pharmacy", "Jeevan Rekha Pharmacy", "Wellness Clinic Dispensary", "City Care Hospital Pharmacy", "Sunrise Nursing Home Pharmacy", "Vaidya Drug Store", "Harmony Chemists"];

// [name, category, unit, GST %, HSN, dealer price per unit ₹, purchase price ₹]
const CATALOGUE = [
  ["Paracetamol 500mg", "Analgesics", "Strip", 12, "30049099", 18.5, 14.2], ["Ibuprofen 400mg", "Analgesics", "Strip", 12, "30049099", 22, 17], ["Diclofenac 50mg", "Analgesics", "Strip", 12, "30049099", 26, 20],
  ["Azithromycin 500mg", "Antibiotics", "Strip", 12, "30041090", 96, 78], ["Amoxicillin 500mg", "Antibiotics", "Strip", 12, "30041090", 74, 59], ["Cefixime 200mg", "Antibiotics", "Strip", 12, "30041090", 88, 70], ["Ciprofloxacin 500mg", "Antibiotics", "Strip", 12, "30041090", 62, 49],
  ["Pantoprazole 40mg", "Gastro", "Strip", 12, "30049099", 58, 45], ["Omeprazole 20mg", "Gastro", "Strip", 12, "30049099", 34, 26], ["ORS Powder", "Gastro", "Sachet", 5, "30049099", 14, 10.5], ["Domperidone 10mg", "Gastro", "Strip", 12, "30049099", 28, 21],
  ["Metformin 500mg", "Diabetes", "Strip", 12, "30049099", 21, 15.5], ["Glimepiride 2mg", "Diabetes", "Strip", 12, "30049099", 64, 50], ["Insulin Glargine", "Diabetes", "Vial", 5, "30043100", 610, 520],
  ["Vitamin D3 60K", "Vitamins & Supplements", "Capsule", 12, "30045090", 46, 35], ["Calcium + D3 Tablets", "Vitamins & Supplements", "Strip", 12, "30045090", 82, 64], ["Vitamin B Complex", "Vitamins & Supplements", "Strip", 12, "30045090", 38, 29], ["Iron + Folic Acid", "Vitamins & Supplements", "Strip", 12, "30045090", 44, 33],
  ["Atorvastatin 20mg", "Cardiac", "Strip", 12, "30049099", 72, 56], ["Amlodipine 5mg", "Cardiac", "Strip", 12, "30049099", 24, 18], ["Losartan 50mg", "Cardiac", "Strip", 12, "30049099", 52, 40], ["Clopidogrel 75mg", "Cardiac", "Strip", 12, "30049099", 78, 61],
  ["Cough Syrup 100ml", "Respiratory", "Bottle", 12, "30049099", 68, 52], ["Salbutamol Inhaler", "Respiratory", "Inhaler", 12, "30049099", 118, 92], ["Montelukast 10mg", "Respiratory", "Strip", 12, "30049099", 92, 72],
  ["Cetirizine 10mg", "Other", "Strip", 12, "30049099", 16, 12], ["Multivitamin Syrup", "Other", "Bottle", 12, "30045090", 96, 74], ["Antacid Gel 170ml", "Gastro", "Bottle", 12, "30049099", 84, 65],
];

const PAYMENT_TERMS = ["Net 30", "Net 30", "Net 15", "Net 45", "Cash", "Net 60"];
const DISCOUNTS = [0, 0, 2.5, 5, 5, 7.5, 10];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (v) => Math.round(v * 100) / 100;
const dstr = (ms) => new Date(ms).toISOString().slice(0, 10);
const dtstr = (ms) => new Date(ms).toISOString().replace("T", " ").slice(0, 19);

// Mirrors services/tax.service.js computeLineTax + salesOrder buildLine, for FIXTURE generation only.
function lineAmounts(price, qty, discountPct, gst) {
  const gross = price * qty;
  const discountAmount = r2((gross * discountPct) / 100);
  const taxable = r2(gross - discountAmount);
  const half = gst / 2;
  const cgst = r2((taxable * half) / 100);
  const sgst = r2((taxable * half) / 100);
  return { gross: r2(gross), discountAmount, taxable, cgst, sgst, igst: 0, tax: r2(cgst + sgst), net: r2(taxable + cgst + sgst) };
}

/** @param {Date} now  dates are generated relative to this day (UTC) */
export function buildSampleDataset(now = new Date()) {
  const rand = rng(20260920);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const today = Date.parse(`${dstr(now.getTime())}T00:00:00Z`);

  const distributors = DISTRIBUTORS.map(([name, city, region], i) => ({
    id: i + 1, distributor_code: `DTC${String(i + 1).padStart(3, "0")}`, name, city, region,
    tax_no: `27AAAC${String(i + 11).padStart(2, "0")}${1000 + i * 37}A1Z${i % 9}`, pan: `AAAC${i + 11}${1000 + i}A`,
    address: `${10 + i}, Industrial Estate, ${city}`, street1: `${10 + i}, Industrial Estate`, street2: null, postal_code: String(400001 + i * 917), phone_number: `98${String(20000000 + i * 12345).slice(0, 8)}`,
  }));

  const customers = [];
  distributors.forEach((d, di) => {
    const n = 2 + (di % 2);
    for (let k = 0; k < n; k += 1) {
      const id = customers.length + 1;
      customers.push({
        id, distributor_id: d.id, customer_group_id: 1, customer_code: `CTR${String(id).padStart(4, "0")}`,
        name: `${RETAILER_BASES[(di * 5 + k * 3) % RETAILER_BASES.length]} – ${["Camp", "Nagar", "Road", "Market"][(di + k) % 4]}, ${d.city}`,
        taxNumber: `27AAB${String(id + 100).padStart(3, "0")}${2000 + id * 13}C1Z${id % 9}`, city: d.city, region: d.region, street1: `Shop ${id + 4}, Main Market`, pincode: String(400001 + di * 917 + k),
      });
    }
  });

  const hsnCodes = [...new Set(CATALOGUE.map((c) => c[4]))];
  const hsn = hsnCodes.map((code, i) => ({ id: i + 1, hsn_code: code, description: `HSN ${code}`, gst_rate: 12, distributor_id: 1 }));

  const products = [];
  const batches = [];
  const ledger = [];
  distributors.forEach((d, di) => {
    for (let k = 0; k < 10; k += 1) {
      const c = CATALOGUE[(di * 3 + k * 2) % CATALOGUE.length];
      if (products.some((p) => p.distributor_id === d.id && p.name === c[0])) continue;
      const pid = products.length + 1;
      products.push({
        id: pid, distributor_id: d.id, material_code: `MTC${String(pid).padStart(4, "0")}`, name: c[0], category: c[1], unit: c[2],
        hsn_id: hsn.find((h) => h.hsn_code === c[4]).id, gst: c[3], cgst: c[3] / 2, sgst: c[3] / 2, igst: c[3], reorder_level: 200, _price: c[5], _purchase: c[6],
      });
      const nb = 2 + ((pid + k) % 2);
      for (let b = 0; b < nb; b += 1) {
        const bid = batches.length + 1;
        const mfg = today - (60 + Math.floor(rand() * 300)) * DAY;
        const life = [24, 30, 36][Math.floor(rand() * 3)];
        let exp = mfg + life * 30 * DAY;
        if (bid % 23 === 0) exp = today + 20 * DAY; // some near expiry
        if (bid % 41 === 0) exp = today - 12 * DAY; // a few already expired
        batches.push({ id: bid, distributor_id: d.id, productId: pid, batch_no: `B${String(24 + (bid % 3)).padStart(2, "0")}${String(1000 + bid)}`, mfg_date: dtstr(mfg), exp_date: dtstr(exp), purchase_price: c[6], status: "active" });
        ledger.push({ id: ledger.length + 1, distributor_id: d.id, batchId: bid, productId: pid, movement_type: "IN", quantity: 3000 + Math.floor(rand() * 4000), reference_type: "PURCHASE", reference_id: 0, reference_line_id: null, createdAt: dtstr(today - 100 * DAY) });
      }
    }
  });

  const orders = [];
  const orderLines = [];
  const deliveries = [];
  const deliveryLines = [];
  const invoices = [];
  const invoiceLines = [];
  const sap = [];

  const plan = [...Array(6).fill("DRAFT"), ...Array(8).fill("CONFIRMED"), ...Array(6).fill("PARTIAL"), ...Array(2).fill("DELIVERED"), ...Array(2).fill("CANCELLED"), ...Array(54).fill("INVOICED")];
  // interleave deterministically so statuses are spread over the date range
  const order = plan.map((s, i) => [s, (i * 37) % plan.length]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);

  order.forEach((kind, idx) => {
    const d = distributors[(idx * 5 + Math.floor(idx / 16)) % distributors.length];
    const dCustomers = customers.filter((c) => c.distributor_id === d.id);
    const cust = dCustomers[idx % dCustomers.length];
    const dProducts = products.filter((p) => p.distributor_id === d.id);
    const oid = orders.length + 1;
    const ageDays = Math.floor((idx * 97) % 74) + (kind === "INVOICED" ? 1 : 0);
    const orderMs = today - ageDays * DAY;
    const nLines = 1 + (idx % 4);
    let netValue = 0, cg = 0, sg = 0;
    const lines = [];
    for (let l = 0; l < nLines; l += 1) {
      const p = dProducts[(idx * 3 + l * 2) % dProducts.length];
      if (lines.some((x) => x.productId === p.id)) continue;
      const pBatches = batches.filter((b) => b.productId === p.id);
      const chosen = l % 2 === 0 ? pBatches[(idx + l) % pBatches.length] : null;
      const qty = 20 + Math.floor(rand() * 26) * 10;
      const disc = pick(DISCOUNTS);
      const a = lineAmounts(p._price, qty, disc, p.gst);
      const line = { id: orderLines.length + 1, orderId: oid, productId: p.id, batchId: chosen && chosen.exp_date > dtstr(today) ? chosen.id : null, material_code: p.material_code, quantity: qty, pricePerUnit: p._price, discount: disc, lineNetValue: a.net, _a: a };
      orderLines.push(line);
      lines.push(line);
      netValue += a.taxable; cg += a.cgst; sg += a.sgst;
    }
    netValue = r2(netValue); cg = r2(cg); sg = r2(sg);
    const raw = { DRAFT: "DRAFT", CONFIRMED: "CONFIRMED", PARTIAL: "PARTIALLY_DELIVERED", DELIVERED: "FULLY_DELIVERED", CANCELLED: "CANCELLED", INVOICED: idx % 11 === 0 ? "CLOSED" : "FULLY_DELIVERED" }[kind];
    orders.push({
      id: oid, distributor_id: d.id, distributor_code: d.distributor_code, order_number: `${d.distributor_code}-SO-${String(oid).padStart(4, "0")}`,
      orderDate: dtstr(orderMs), customerId: cust.id, customerName: cust.name, paymentMethod: PAYMENT_TERMS[idx % PAYMENT_TERMS.length],
      description: idx % 7 === 0 ? "Urgent replenishment" : null, status: raw, netValue, cgstAmount: cg, sgstAmount: sg, igstAmount: 0,
      totalAmount: r2(netValue + cg + sg), createdAt: dtstr(orderMs + 9 * 3600000), updatedAt: dtstr(orderMs + 10 * 3600000),
    });

    if (kind === "PARTIAL" || kind === "DELIVERED" || kind === "INVOICED") {
      const did = deliveries.length + 1;
      const dMs = orderMs + 2 * DAY;
      deliveries.push({ id: did, orderId: oid, distributor_id: d.id, deliveryDate: dtstr(dMs), status: "Delivered", createdAt: dtstr(dMs) });
      const delivered = [];
      lines.forEach((line, li) => {
        if (kind === "PARTIAL" && li > 0) return;
        const qty = kind === "PARTIAL" ? Math.max(1, Math.floor(line.quantity / 2)) : line.quantity;
        const dl = { id: deliveryLines.length + 1, deliveryId: did, orderLineId: line.id, productId: line.productId, quantityDelivered: qty };
        deliveryLines.push(dl);
        delivered.push({ dl, line });
        const pBatches = batches.filter((b) => b.productId === line.productId && b.exp_date > dtstr(today));
        const b1 = line.batchId ? batches.find((b) => b.id === line.batchId) : pBatches[0];
        if (!line.batchId && pBatches.length > 1 && (dl.id % 4 === 0) && qty >= 20) {
          const first = Math.floor(qty * 0.6);
          [[b1, first], [pBatches[1], qty - first]].forEach(([bb, q]) => ledger.push({ id: ledger.length + 1, distributor_id: d.id, batchId: bb.id, productId: line.productId, movement_type: "OUT", quantity: q, reference_type: "SALES", reference_id: did, reference_line_id: dl.id, createdAt: dtstr(dMs) }));
        } else {
          ledger.push({ id: ledger.length + 1, distributor_id: d.id, batchId: b1.id, productId: line.productId, movement_type: "OUT", quantity: qty, reference_type: "SALES", reference_id: did, reference_line_id: dl.id, createdAt: dtstr(dMs) });
        }
      });

      if (kind === "INVOICED") {
        const iid = invoices.length + 1;
        const iMs = dMs + DAY;
        const st = idx % 17 === 0 ? "DRAFT" : idx % 19 === 0 ? "CANCELLED" : idx % 5 === 0 ? "PAID" : idx % 7 === 0 ? "PARTIALLY_PAID" : "POSTED";
        let inet = 0, icg = 0, isg = 0;
        delivered.forEach(({ dl, line }) => {
          const a = lineAmounts(line.pricePerUnit, dl.quantityDelivered, line.discount, products.find((p) => p.id === line.productId).gst);
          invoiceLines.push({ id: invoiceLines.length + 1, invoiceId: iid, productId: line.productId, orderLineId: line.id, deliveryLineId: dl.id, quantity: dl.quantityDelivered, pricePerUnit: line.pricePerUnit, discount: a.discountAmount, taxableValue: a.taxable, cgstAmount: a.cgst, sgstAmount: a.sgst, igstAmount: 0, lineTotal: a.net, _a: a });
          inet += a.taxable; icg += a.cgst; isg += a.sgst;
        });
        inet = r2(inet); icg = r2(icg); isg = r2(isg);
        const total = r2(inet + icg + isg);
        const terms = orders[oid - 1].paymentMethod;
        const days = Number((terms.match(/\d+/) || [0])[0]);
        invoices.push({
          id: iid, distributor_id: d.id, distributor_code: d.distributor_code, invoice_number: `${d.distributor_code}-INV-${String(iid).padStart(4, "0")}`, invoiceDate: dtstr(iMs), customer_id: cust.id,
          deliveryId: did, paymentTerms: terms, status: st, netValue: inet, cgstAmount: icg, sgstAmount: isg, igstAmount: 0, roundOff: 0, totalAmount: total,
          dueDate: dtstr(iMs + days * DAY), outstandingAmount: st === "POSTED" ? total : st === "PARTIALLY_PAID" ? r2(total / 2) : 0, postedAt: st === "DRAFT" ? null : dtstr(iMs + 3600000),
          createdAt: dtstr(iMs), updatedAt: dtstr(iMs + 3600000),
        });
        if (["POSTED", "PAID", "PARTIALLY_PAID"].includes(st)) {
          const roll = (iid * 7) % 20;
          const status = roll < 8 ? "SYNCED" : roll === 9 ? "FAILED" : roll === 11 ? "PARTIAL" : null;
          if (status) sap.push({ id: sap.length + 1, distributor_id: d.id, entity_type: "SALES_INVOICE", entity_id: iid, status, sap_document_no: status === "SYNCED" || status === "PARTIAL" ? `SAP-49${String(100000 + iid * 17)}` : null, last_attempt_at: dtstr(iMs + 5 * 3600000), last_error: status === "FAILED" ? "Customer master not found in SAP" : null });
        }
      }
    }
    if (kind === "INVOICED" && idx % 3 === 0) {
      sap.push({ id: sap.length + 1, distributor_id: d.id, entity_type: "SALES_ORDER", entity_id: oid, status: "SYNCED", sap_document_no: `SAP-45${String(200000 + oid * 11)}`, last_attempt_at: dtstr(orderMs + 3 * DAY), last_error: null });
    }
  });

  return { now: today, distributors, customers, hsn, products, batches, ledger, orders, orderLines, deliveries, deliveryLines, invoices, invoiceLines, sap };
}
