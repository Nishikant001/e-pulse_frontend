// ═══════════════════════════════════════════════════════════════════════════════════════════════
//  SAMPLE INVENTORY DATASET — isolated demo layer for the Inventory screens (Admin portal, "Sample data").
//
//  Nothing here is real. It is generated deterministically (seeded PRNG, no Math.random) from a small catalogue:
//  6 distributors (3 with a second warehouse) · 28 catalogue products (instantiated per distributor, as in the real data
//  model → ~70 product rows) · ~130 batches in every state (healthy, near-expiry, expired, partly non-saleable, depleted,
//  low-stock products) · a stock ledger (opening/purchase, sales, returns, adjustments, transfers, status changes) whose
//  balances reconcile exactly with the quantities shown. All names are fictitious; no personal data.
//  The shape mirrors the database (ledger rows, batches, warehouses) so the SAME data could be loaded into a test database.
// ═══════════════════════════════════════════════════════════════════════════════════════════════
import { DAY_MS } from "./rules.js";

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DISTRIBUTORS = [
  ["Sunrise Pharma Distributors", "DTC001", ["Main Warehouse", "Cold Storage"]], ["Shree Sai Drug Agencies", "DTC002", ["Main Warehouse"]],
  ["Lifeline Medico Distributors", "DTC003", ["Main Warehouse", "Godown 2"]], ["Apex Healthcare Traders", "DTC004", ["Main Warehouse"]],
  ["Vardhman Pharma Agencies", "DTC005", ["Main Warehouse", "Cold Storage"]], ["Northern Star Pharma", "DTC006", ["Main Warehouse"]],
];

// [name, category, unit, manufacturer, HSN, GST %, cost ₹, MRP ₹, reorder level]
const CATALOGUE = [
  ["Paracetamol 500mg", "Analgesics", "Strip", "Medisyn Labs", "30049099", 12, 14.2, 22, 120], ["Ibuprofen 400mg", "Analgesics", "Strip", "Medisyn Labs", "30049099", 12, 17, 26, 80],
  ["Diclofenac 50mg", "Analgesics", "Strip", "Curewell Pharma", "30049099", 12, 20, 31, 60], ["Azithromycin 500mg", "Antibiotics", "Strip", "Bioaxis Remedies", "30041090", 12, 78, 118, 60],
  ["Amoxicillin 500mg", "Antibiotics", "Strip", "Bioaxis Remedies", "30041090", 12, 59, 89, 80], ["Cefixime 200mg", "Antibiotics", "Strip", "Novacare Lifesciences", "30041090", 12, 70, 105, 50],
  ["Ciprofloxacin 500mg", "Antibiotics", "Strip", "Curewell Pharma", "30041090", 12, 49, 74, 50], ["Pantoprazole 40mg", "Gastro", "Strip", "Zenith Healthcare", "30049099", 12, 45, 68, 100],
  ["Omeprazole 20mg", "Gastro", "Strip", "Zenith Healthcare", "30049099", 12, 26, 40, 90], ["ORS Powder", "Gastro", "Sachet", "Hydra Nutri", "30049099", 5, 10.5, 18, 150],
  ["Domperidone 10mg", "Gastro", "Strip", "Curewell Pharma", "30049099", 12, 21, 33, 60], ["Metformin 500mg", "Diabetes", "Strip", "Glucora Pharma", "30049099", 12, 15.5, 25, 120],
  ["Glimepiride 2mg", "Diabetes", "Strip", "Glucora Pharma", "30049099", 12, 50, 76, 60], ["Insulin Glargine", "Diabetes", "Vial", "Glucora Pharma", "30043100", 5, 520, 690, 25],
  ["Vitamin D3 60K", "Vitamins & Supplements", "Capsule", "Nutrigen Labs", "30045090", 12, 35, 55, 100], ["Calcium + D3 Tablets", "Vitamins & Supplements", "Strip", "Nutrigen Labs", "30045090", 12, 64, 98, 80],
  ["Vitamin B Complex", "Vitamins & Supplements", "Strip", "Nutrigen Labs", "30045090", 12, 29, 46, 90], ["Iron + Folic Acid", "Vitamins & Supplements", "Strip", "Hemacure Pharma", "30045090", 12, 33, 52, 90],
  ["Atorvastatin 20mg", "Cardiac", "Strip", "Cardiova Pharma", "30049099", 12, 56, 84, 70], ["Amlodipine 5mg", "Cardiac", "Strip", "Cardiova Pharma", "30049099", 12, 18, 29, 100],
  ["Losartan 50mg", "Cardiac", "Strip", "Cardiova Pharma", "30049099", 12, 40, 62, 70], ["Clopidogrel 75mg", "Cardiac", "Strip", "Cardiova Pharma", "30049099", 12, 61, 92, 50],
  ["Cough Syrup 100ml", "Respiratory", "Bottle", "Respira Health", "30049099", 12, 52, 78, 60], ["Salbutamol Inhaler", "Respiratory", "Inhaler", "Respira Health", "30049099", 12, 92, 138, 40],
  ["Montelukast 10mg", "Respiratory", "Strip", "Respira Health", "30049099", 12, 72, 108, 60], ["Cetirizine 10mg", "Allergy", "Strip", "Curewell Pharma", "30049099", 12, 12, 20, 120],
  ["Multivitamin Syrup", "Vitamins & Supplements", "Bottle", "Nutrigen Labs", "30045090", 12, 74, 112, 50], ["Antacid Gel 170ml", "Gastro", "Bottle", "Zenith Healthcare", "30049099", 12, 65, 98, 50],
];

const REASONS = ["DAMAGED", "QUALITY_ISSUE", "RETURNED", "BLOCKED"];

/** Build the whole dataset relative to `now` (so near-expiry / expired stay near-expiry / expired whenever the demo is opened). */
export function buildDataset(now = new Date()) {
  const rand = mulberry32(20260924);
  const pick = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const at = (daysAgo, hour = 10) => new Date(now.getTime() - daysAgo * DAY_MS + (hour - 12) * 3600000);
  const isoDay = (d) => new Date(d).toISOString().slice(0, 10);

  const distributors = [];
  const warehouses = [];
  const products = [];
  const batches = [];
  const ledger = [];
  const openOrders = [];
  let whId = 0, prodId = 0, batchId = 0, ledgerId = 0, returnSeq = 100, delivSeq = 400, skuSeq = 0;

  const push = (row) => ledger.push({ id: ++ledgerId, ...row });

  DISTRIBUTORS.forEach(([name, code, whNames], di) => {
    const dist = { id: di + 1, name, code };
    distributors.push(dist);
    const myWh = whNames.map((n, i) => {
      const w = { id: ++whId, distributorId: dist.id, code: i === 0 ? "MAIN" : n.split(" ")[0].toUpperCase().slice(0, 6), name: n, isDefault: i === 0, status: "active" };
      warehouses.push(w);
      return w;
    });
    const main = myWh[0];
    const second = myWh[1] || null;

    CATALOGUE.forEach((c, ci) => {
      if ((ci * 7 + di * 3) % 5 >= 2) return; // each distributor stocks ~40% of the catalogue
      const [pname, category, unit, manufacturer, hsn, gst, cost, mrp, reorder] = c;
      const product = { id: ++prodId, distributorId: dist.id, sku: `MTC${String(++skuSeq).padStart(3, "0")}`, name: pname, category, unit, manufacturer, hsn, gst, reorder };
      products.push(product);
      const lowStock = (ci + di) % 6 === 0; // these products end up at / below their reorder level
      const nBatches = 2 + ((ci + di) % 2);

      for (let bi = 0; bi < nBatches; bi++) {
        const k = batchId + 1;
        const profile = k % 13;
        let expDays, target, ns = 0, nsReason = null, depleted = false;
        if (profile === 0) { expDays = -pick(5, 70); target = pick(8, 60); }
        else if (profile === 1 || profile === 2) { expDays = pick(8, 85); target = pick(60, 400); }
        else if (profile === 3) { expDays = pick(150, 600); target = pick(120, 500); ns = Math.max(4, Math.round(target * (0.1 + rand() * 0.2))); nsReason = REASONS[k % REASONS.length]; }
        else if (profile === 4) { expDays = pick(200, 700); target = 0; depleted = true; }
        else if (profile === 5) { expDays = pick(150, 600); target = pick(20, 120); ns = target; nsReason = REASONS[k % REASONS.length]; } // whole batch on hold
        else { expDays = pick(130, 720); target = pick(90, 700); }
        if (lowStock && !depleted && profile !== 0 && profile !== 5) target = pick(1, Math.max(2, Math.floor(reorder / (nBatches * 3))));
        if (target < ns) target = ns + 5;

        const exp = new Date(now.getTime() + expDays * DAY_MS);
        const shelfMonths = pick(24, 36);
        const mfg = new Date(exp.getTime() - shelfMonths * 30 * DAY_MS);
        const batch = {
          id: ++batchId, distributorId: dist.id, productId: product.id, batchNo: `${pname.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase()}${String(24 + (k % 3))}${String(pick(1, 12)).padStart(2, "0")}-${String(k).padStart(3, "0")}`,
          mfgDate: isoDay(mfg), expDate: isoDay(exp), mrp: Math.round(mrp * (0.97 + rand() * 0.06) * 100) / 100, unitCost: Math.round(cost * (0.96 + rand() * 0.08) * 100) / 100, active: true,
        };
        batches.push(batch);

        // ---- ledger for this batch: reconciles to `target` on hand (saleable + non-saleable) --------------------------------------
        const ret = k % 6 === 0 ? pick(2, 9) : 0;
        const adj = k % 8 === 0 ? pick(1, 6) : 0;
        const inSecond = second && !depleted && k % 3 === 0 ? Math.max(0, Math.floor(target * 0.35)) : 0;
        const sold = depleted ? pick(80, 300) : pick(20, 260);
        const purchase = target + sold + adj - ret + 0; // transfers net to zero overall
        const base = { distributorId: dist.id, productId: product.id, batchId: batch.id, state: "SALEABLE", nsReason: null, warehouseId: main.id };
        const pDay = pick(62, 78);
        push({ ...base, at: at(pDay), dir: "IN", qty: purchase, ref: k % 10 === 0 ? "OPENING" : "PURCHASE", refId: ++delivSeq, note: k % 10 === 0 ? "Opening stock" : null });
        let left = sold;
        const chunks = pick(2, 3);
        for (let s = 0; s < chunks && left > 0; s++) {
          const q = s === chunks - 1 ? left : Math.max(1, Math.floor(left / (chunks - s) * (0.7 + rand() * 0.6)));
          push({ ...base, at: at(pick(4, pDay - 5), 11 + s), dir: "OUT", qty: Math.min(q, left), ref: "SALES", refId: ++delivSeq });
          left -= Math.min(q, left);
        }
        if (ret) push({ ...base, at: at(pick(2, 12), 15), dir: "IN", qty: ret, ref: "RETURN", refId: ++returnSeq, returnNumber: `${dist.code}-SR-${String(returnSeq).padStart(4, "0")}`, note: "Sales return" });
        if (adj) push({ ...base, at: at(pick(3, 20), 16), dir: "OUT", qty: adj, ref: k % 16 === 0 ? "DAMAGE" : "BREAKAGE", note: k % 16 === 0 ? "Damaged in transit" : "Breakage in godown" });
        if (inSecond > 0) {
          const day = pick(3, 25);
          push({ ...base, at: at(day, 9), dir: "OUT", qty: inSecond, ref: "TRANSFER", refId: ++delivSeq, note: `Transfer to ${second.name}` });
          push({ ...base, warehouseId: second.id, at: at(day, 9), dir: "IN", qty: inSecond, ref: "TRANSFER", refId: delivSeq, note: `Transfer from ${main.name}` });
        }
        if (ns > 0) {
          const day = pick(1, 15);
          const wh = inSecond > ns ? main : main;
          push({ ...base, warehouseId: wh.id, at: at(day, 14), dir: "OUT", qty: ns, ref: "RECLASSIFY", note: NON_LABEL(nsReason) });
          push({ ...base, warehouseId: wh.id, at: at(day, 14), dir: "IN", qty: ns, ref: "RECLASSIFY", state: "NON_SALEABLE", nsReason, note: NON_LABEL(nsReason) });
        }
        // a few open (confirmed, undelivered) sales-order lines make the Reserved column real
        if (!depleted && profile > 4 && k % 5 === 0) openOrders.push({ distributorId: dist.id, productId: product.id, batchId: k % 10 === 0 ? batch.id : null, qty: pick(5, 40) });
      }
    });
  });

  return { now, distributors, warehouses, products, batches, ledger, openOrders };
}
const NON_LABEL = (r) => ({ DAMAGED: "Damaged stock", QUALITY_ISSUE: "Quality issue — QA hold", RETURNED: "Returned from market", BLOCKED: "Blocked pending review" }[r] || "Non-saleable");
