import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs";
import { ENDPOINTS, buildPayload, validateForm, mergeBalances, formFromBatch, EMPTY_FORM } from "./batchMaster.js";

const ok = { ...EMPTY_FORM, batch_no: " B-1 ", productId: "7", mfg_date: "2026-01-01", exp_date: "2028-01-01", purchase_price: "10.5", mrp: "15" };

test("the page only talks to the verified /stock, /product and /stockLedger/batch contracts — never /batch", () => {
  const all = [ENDPOINTS.list, ENDPOINTS.create, ENDPOINTS.update(3), ENDPOINTS.remove(3), ENDPOINTS.products, ENDPOINTS.balances];
  assert.deepEqual(all, ["/stock", "/stock", "/stock/3", "/stock/3", "/product", "/stockLedger/batch"]);
  const src = fs.readFileSync(new URL("./StockMaster.jsx", import.meta.url), "utf8");
  assert.ok(!/["'`]\/batch/.test(src), "StockMaster.jsx must not call /batch");
  assert.ok(!/\.quantity|quantity:|name="quantity"/.test(src.replace(/Quantity is not a batch field[^<]*/, "")), "no quantity field/edit");
});
test("create payload: identity fields only, trimmed, numeric product, no quantity", () => {
  const p = buildPayload(ok); assert.deepEqual(Object.keys(p).sort(), ["batch_no", "exp_date", "mfg_date", "mrp", "productId", "purchase_price", "status"]);
  assert.equal(p.batch_no, "B-1"); assert.equal(p.productId, 7); assert.equal(p.purchase_price, 10.5); assert.ok(!("quantity" in p));
});
test("update payload never carries productId or quantity; batch_no omitted when the batch has stock movements", () => {
  const free = buildPayload(ok, { editing: true }); assert.ok(!("productId" in free) && !("quantity" in free)); assert.equal(free.batch_no, "B-1");
  const locked = buildPayload(ok, { editing: true, lockIdentity: true }); assert.ok(!("batch_no" in locked) && !("productId" in locked));
});
test("empty optional money/dates map to null/0 as the API expects", () => {
  const p = buildPayload({ ...ok, mfg_date: "", exp_date: "", purchase_price: "", mrp: "" }); assert.equal(p.mfg_date, null); assert.equal(p.exp_date, null); assert.equal(p.purchase_price, 0); assert.equal(p.mrp, null);
});
test("validation mirrors the server rules", () => {
  assert.deepEqual(validateForm(ok), {});
  assert.ok(validateForm({ ...ok, batch_no: " " }).batch_no); assert.ok(validateForm({ ...ok, productId: "" }).productId); assert.equal(validateForm({ ...ok, productId: "" }, { editing: true }).productId, undefined);
  assert.ok(validateForm({ ...ok, exp_date: "2025-12-31" }).exp_date); assert.ok(validateForm({ ...ok, mfg_date: "2999-01-01", exp_date: "" }).mfg_date);
  assert.ok(validateForm({ ...ok, mrp: "-1" }).mrp); assert.ok(validateForm({ ...ok, purchase_price: "abc" }).purchase_price); assert.ok(validateForm({ ...ok, batch_no: "x".repeat(51) }).batch_no);
});
test("balances are joined from the ledger rows; batches without ledger rows show 0 and are deletable", () => {
  const rows = mergeBalances([{ id: 1 }, { id: 2 }, { id: 3 }], [{ batchId: 1, quantity: 70 }, { batchId: 3, quantity: 0 }]);
  assert.deepEqual(rows.map((r) => [r.stockOnHand, r.hasMovements]), [[70, true], [0, false], [0, true]]);
  assert.deepEqual(mergeBalances(null, null), []);
});
test("editing a legacy batch with null dates/prices produces a clean form", () => {
  const f = formFromBatch({ batch_no: "L1", productId: 4, mfg_date: null, exp_date: "2027-05-06T00:00:00.000Z", purchase_price: null, mrp: null, status: "active" });
  assert.equal(f.mfg_date, ""); assert.equal(f.exp_date, "2027-05-06"); assert.equal(f.productId, "4"); assert.equal(f.purchase_price, "");
});
