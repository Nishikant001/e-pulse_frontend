// Batch Master (Distributor) — pure helpers. The page manages batch IDENTITY only, through the existing /stock API:
//   GET /stock · POST /stock · PUT /stock/:id · DELETE /stock/:id        (identity: batch_no, product, MFG/EXP, purchase price, MRP, status)
//   GET /product                                                         (product picker)
//   GET /stockLedger/batch                                               (READ-ONLY, ledger-derived balance per batch)
// There is NO /batch endpoint and NO quantity field: stock on hand is derived from the stock ledger and is never written here.
export const ENDPOINTS = {
  list: "/stock", create: "/stock", update: (id) => `/stock/${id}`, remove: (id) => `/stock/${id}`,
  products: "/product", balances: "/stockLedger/batch",
};
export const STATUS_OPTIONS = [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }];
export const EMPTY_FORM = { batch_no: "", productId: "", mfg_date: "", exp_date: "", purchase_price: "", mrp: "", status: "active" };

export const dateInput = (v) => (v ? String(v).slice(0, 10) : "");
export const formFromBatch = (b) => ({ batch_no: b.batch_no || "", productId: String(b.productId ?? ""), mfg_date: dateInput(b.mfg_date), exp_date: dateInput(b.exp_date), purchase_price: b.purchase_price ?? "", mrp: b.mrp ?? "", status: b.status === "inactive" ? "inactive" : "active" });

/** Joins identity rows with the ledger-derived balances. A batch with any ledger row has movements (the API refuses to delete it). */
export function mergeBalances(batches, ledgerRows) {
  const byBatch = new Map((Array.isArray(ledgerRows) ? ledgerRows : []).map((r) => [Number(r.batchId), Number(r.quantity) || 0]));
  return (Array.isArray(batches) ? batches : []).map((b) => ({ ...b, hasMovements: byBatch.has(Number(b.id)), stockOnHand: byBatch.get(Number(b.id)) ?? 0 }));
}

/** Client-side mirror of the server rules (the server stays authoritative). */
export function validateForm(f, { editing = false, today = new Date() } = {}) {
  const e = {};
  if (!String(f.batch_no).trim()) e.batch_no = "Batch number is required"; else if (String(f.batch_no).trim().length > 50) e.batch_no = "Batch number is too long (max 50)";
  if (!editing && !f.productId) e.productId = "Product is required";
  const mfg = f.mfg_date ? new Date(f.mfg_date) : null; const exp = f.exp_date ? new Date(f.exp_date) : null;
  if (mfg && Number.isNaN(mfg.getTime())) e.mfg_date = "Invalid date"; if (exp && Number.isNaN(exp.getTime())) e.exp_date = "Invalid date";
  if (!e.mfg_date && mfg && mfg > today) e.mfg_date = "Manufacturing date cannot be in the future";
  if (!e.mfg_date && !e.exp_date && mfg && exp && exp <= mfg) e.exp_date = "Expiry date must be after the manufacturing date";
  for (const k of ["purchase_price", "mrp"]) if (f[k] !== "" && f[k] !== null && (!Number.isFinite(Number(f[k])) || Number(f[k]) < 0)) e[k] = "Enter a non-negative amount";
  return e;
}

/** Request body. Never contains quantity; never contains productId on update (a batch cannot change product); batch_no omitted on update when locked. */
export function buildPayload(f, { editing = false, lockIdentity = false } = {}) {
  const body = { mfg_date: f.mfg_date || null, exp_date: f.exp_date || null, purchase_price: f.purchase_price === "" ? 0 : Number(f.purchase_price), mrp: f.mrp === "" ? null : Number(f.mrp), status: f.status };
  if (!editing) { body.batch_no = String(f.batch_no).trim(); body.productId = Number(f.productId); }
  else if (!lockIdentity) body.batch_no = String(f.batch_no).trim();
  return body;
}
