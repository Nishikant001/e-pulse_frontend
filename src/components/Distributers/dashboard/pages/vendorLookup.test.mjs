import test from "node:test";
import assert from "node:assert/strict";
import { findVendorByCode, normalizeVendorCode, vendorCodeOf } from "./vendorLookup.js";

const list = [
  { id: 1, vendor_code: "VDR001", name: "A" },
  { id: 2, vendorCode: "VDR002", name: "B" },
  { id: 3, code: "VDR003", name: "C" },
];

test("finds by vendor_code, case-insensitively and trimmed", () => {
  assert.equal(findVendorByCode(list, "vdr001").id, 1);
  assert.equal(findVendorByCode(list, "  VDR001  ").id, 1);
});

test("tolerates the legacy vendorCode / code field shapes", () => {
  assert.equal(findVendorByCode(list, "VDR002").id, 2);
  assert.equal(findVendorByCode(list, "VDR003").id, 3);
});

test("returns null for unknown, empty, null or non-list input and never throws", () => {
  assert.equal(findVendorByCode(list, "VDR999"), null);
  assert.equal(findVendorByCode(list, ""), null);
  assert.equal(findVendorByCode(list, "   "), null);
  assert.equal(findVendorByCode(list, null), null);
  assert.equal(findVendorByCode(null, "VDR001"), null);
  assert.equal(findVendorByCode({}, "VDR001"), null);
});

test("no partial matches", () => {
  assert.equal(findVendorByCode(list, "VDR00"), null);
  assert.equal(findVendorByCode(list, "VDR0011"), null);
});

test("helpers", () => {
  assert.equal(normalizeVendorCode(" AbC "), "abc");
  assert.equal(vendorCodeOf({}), "");
});
