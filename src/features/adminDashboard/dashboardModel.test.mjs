// Phase 21 — unit tests for the ERP card view-model. Run with:  node --test src/features/adminDashboard/dashboardModel.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { erpCardModel, normalizeDashboard } from "./dashboardModel.js";

const base = { access: "OK", configured: true, connections: 2, activeConnections: 1, failedSyncsLast7Days: 3, partialSyncsLast7Days: 0, runningSyncs: 0, queuedSyncs: 1, openAlerts: 2, health: "HEALTHY", lastSuccessfulSync: null };

test("no ERP connected is a normal standalone state, not an error", () => {
  const m = erpCardModel({ access: "OK", configured: false, connections: 0, activeConnections: 0 });
  assert.equal(m.tone, "neutral"); assert.match(m.label, /No ERP connected/); assert.match(m.message, /standalone/); assert.deepEqual(m.rows, []);
});
test("restricted and unavailable states disclose no figures", () => {
  for (const erp of [{ access: "RESTRICTED" }, { access: "UNAVAILABLE" }, null, undefined]) { const m = erpCardModel(erp); assert.deepEqual(m.rows, []); assert.equal(m.tone, "neutral"); }
});
test("connections that exist but are all inactive are shown as standalone, with real counts", () => {
  const m = erpCardModel({ ...base, activeConnections: 0, health: null });
  assert.match(m.label, /inactive/); assert.equal(m.rows.find((r) => r.label === "Active connections").value, "0 of 2");
});
test("health maps to honest tones and never claims reachability", () => {
  assert.equal(erpCardModel({ ...base, health: "HEALTHY" }).tone, "success");
  assert.equal(erpCardModel({ ...base, health: "WARNING" }).tone, "warning");
  assert.equal(erpCardModel({ ...base, health: "ERROR" }).tone, "error");
  assert.equal(erpCardModel({ ...base, health: "UNKNOWN" }).tone, "neutral");
  assert.equal(erpCardModel({ ...base, health: "SOMETHING_NEW" }).tone, "neutral");
  assert.match(erpCardModel({ ...base, health: "HEALTHY" }).message, /not a live connection test/);
  for (const h of ["HEALTHY", "WARNING", "ERROR", "UNKNOWN"]) assert.doesNotMatch(erpCardModel({ ...base, health: h }).label, /connected|reachable/i);
});
test("rows carry the real counts from the backend", () => {
  const rows = Object.fromEntries(erpCardModel(base).rows.map((r) => [r.label, r.value]));
  assert.equal(rows["Failed syncs (7 days)"], 3); assert.equal(rows["Running / queued"], "0 / 1"); assert.equal(rows["Open alerts"], 2);
});
test("normalizeDashboard passes the live erp block through and still defaults to not_configured", () => {
  const shell = { kpis: {}, meta: { range: {}, previousRange: {} } };
  const withErp = normalizeDashboard({ ...shell, sap: { status: "configured", erp: base } }, { source: "live" });
  assert.equal(withErp.sap.erp.connections, 2);
  const none = normalizeDashboard(shell, { source: "live" });
  assert.equal(none.sap.status, "not_configured"); assert.equal(none.sap.erp, null);
});
