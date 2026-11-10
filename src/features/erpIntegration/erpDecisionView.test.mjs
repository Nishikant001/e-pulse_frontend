// Phase 20 — unit tests for the decision-register view-model. Run with:  node --test src/features/erpIntegration/erpDecisionView.test.mjs
// (The project has no frontend test runner and none was added; this file uses Node's built-in runner and imports only the pure module.)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  approvalImplemented, approvalReason, connectionOptions, countByStatus, filterItems, groupItems, panelState, providerRows, readinessRows, registerOf, statusMeta, STATUS_META,
} from "./erpDecisionView.js";

const item = (o) => ({ id: "x", area: "Stock", capability: "STOCK", question: "q", blocks: ["STOCK"], interim: "safe", mechanism: "NONE", scope: "TENANT", status: "REQUIRED", answer: null, approval: "NOT_RECORDED", persistence: "p", ...o });
const conn = (id, ownership) => ({ connectionId: id, connectionName: `C${id}`, enabled: true, ownership, direction: "ERP_TO_DMS" });
const ITEMS = [
  item({ id: "stock.owner", mechanism: "CONFIG", scope: "CONNECTION", status: "CONFIGURED", answer: ["SHARED / ERP_TO_DMS"], connections: [conn(1, "SHARED"), conn(2, null)] }),
  item({ id: "stock.batchCreation" }),
  item({ id: "invoice.owner", area: "Invoice", capability: "INVOICE", blocks: ["INVOICE", "RETURN"], mechanism: "CONFIG", scope: "CONNECTION", connections: [conn(2, null)] }),
  item({ id: "invoice.erpAuthoritative", area: "Invoice", capability: "INVOICE", blocks: ["INVOICE", "RETURN"] }),
  item({ id: "payment.autoAllocate", area: "Payment", capability: "PAYMENT", blocks: ["PAYMENT"] }),
  item({ id: "pricing.manualOwner", area: "Pricing", capability: "PRICING", blocks: ["PRICING"] }),
  item({ id: "document.storageProvider", area: "Documents", capability: "DOCUMENT", blocks: ["DOCUMENT"] }),
];
const OV = {
  decisionRegister: { items: ITEMS, summary: { REQUIRED: 6, CONFIGURED: 1 }, meta: { statuses: ["REQUIRED", "CONFIGURED"], approvalTracking: { implemented: false, reason: "No approval workflow exists." } } },
  connections: [{ id: 1, name: "Plant ERP" }, { id: 2, name: "Spare ERP" }],
  catalog: [{ capability: "STOCK", label: "Stock", blockedBecause: null, inbound: "IMPLEMENTED", outbound: "NOT_IMPLEMENTED", dependsOn: ["PRODUCT_MASTER"] }, { capability: "INVOICE", label: "Invoice", blockedBecause: { code: "X", reason: "No invoice sync exists." }, dependsOn: [] }, { capability: "DOCUMENT", label: "Document" }],
  monitoring: [{ capability: "STOCK", label: "Stock", classification: "PARTIAL", highestVerification: "MOCK_VERIFIED" }, { capability: "INVOICE", label: "Invoice", classification: "BLOCKED", highestVerification: "NOT_CONFIGURED" }, { capability: "DOCUMENT", label: "Document", classification: "BLOCKED", highestVerification: "NOT_CONFIGURED" }],
  providers: [{ key: "SAP_ODATA", label: "SAP OData", status: "IMPLEMENTED", verification: { mock: true, real: false } }, { key: "ORACLE_REST", label: "Oracle REST", status: "FOUNDATION_ONLY", verification: { mock: false, real: false } }],
};

test("REQUIRED and CONFIGURED are presented distinctly, and CONFIGURED is never presented as approval", () => {
  assert.equal(statusMeta("REQUIRED").tone, "error");
  assert.match(statusMeta("CONFIGURED").label, /not business approval/i);
  assert.doesNotMatch(statusMeta("CONFIGURED").label, /^approved|business approved/i);
  for (const meta of Object.values(STATUS_META)) assert.doesNotMatch(meta.label, /business approved/i);
});

test("BUSINESS_APPROVED is never shown as approved unless the server says approval tracking is implemented", () => {
  assert.equal(statusMeta("BUSINESS_APPROVED").label, "Unrecognised status");
  assert.equal(statusMeta("BUSINESS_APPROVED", false).tone, "neutral");
  assert.equal(statusMeta("APPROVED", true).label, "Unrecognised status");
  assert.equal(statusMeta("BUSINESS_APPROVED", true).label, "Business approved");
  assert.equal(approvalImplemented(OV), false);
  assert.match(approvalReason(OV), /No approval workflow/);
  assert.match(approvalReason({}), /not implemented/i); // missing meta → still says it is not implemented
});

test("counts come from the rows themselves; an unknown status is counted separately, never as configured or approved", () => {
  assert.deepEqual(countByStatus(ITEMS), { REQUIRED: 6, CONFIGURED: 1, OTHER: 0, total: 7 });
  assert.deepEqual(countByStatus([...ITEMS, item({ id: "z", status: "BUSINESS_APPROVED" })]), { REQUIRED: 6, CONFIGURED: 1, OTHER: 1, total: 8 });
  assert.deepEqual(countByStatus(undefined), { REQUIRED: 0, CONFIGURED: 0, OTHER: 0, total: 0 });
});

test("filters: capability (own or blocked), status, ERP connection; tenant-wide questions stay under a connection filter", () => {
  const ids = (f) => filterItems(ITEMS, f).map((i) => i.id);
  assert.deepEqual(ids({ capability: "RETURN" }), ["invoice.owner", "invoice.erpAuthoritative"]); // blocks RETURN even though capability is INVOICE
  assert.deepEqual(ids({ status: "CONFIGURED" }), ["stock.owner"]);
  assert.equal(ids({ status: "REQUIRED" }).length, 6);
  assert.ok(!ids({ connectionId: "1" }).includes("invoice.owner")); // connection 1 holds no invoice capability
  assert.ok(ids({ connectionId: "2" }).includes("invoice.owner") && ids({ connectionId: "2" }).includes("stock.owner"));
  assert.ok(ids({ connectionId: 1 }).includes("stock.batchCreation")); // tenant-wide, applies to every connection
  assert.deepEqual(ids({ capability: "STOCK", status: "CONFIGURED", connectionId: "1" }), ["stock.owner"]);
  assert.deepEqual(ids({ connectionId: "999" }).filter((i) => i.endsWith("owner") && ITEMS.find((x) => x.id === i).scope === "CONNECTION"), []);
  assert.equal(filterItems(ITEMS, {}).length, 7);
});

test("groups follow the documented order, Payment and Pricing share a group, empty groups are omitted", () => {
  const g = groupItems([...ITEMS].reverse());
  assert.deepEqual(g.map((x) => x.title), ["Stock", "Invoice", "Payment and pricing", "Documents"]);
  assert.deepEqual(g[2].items.map((i) => i.id).sort(), ["payment.autoAllocate", "pricing.manualOwner"]);
  assert.deepEqual(groupItems([]), []);
});

test("connection options come only from the server's connection list", () => {
  assert.deepEqual(connectionOptions(OV), [{ value: "1", label: "Plant ERP" }, { value: "2", label: "Spare ERP" }]);
  assert.deepEqual(connectionOptions(null), []);
});

test("readiness keeps the dimensions separate: classification, production verification, open decisions, reason", () => {
  const r = Object.fromEntries(readinessRows(OV).map((x) => [x.capability, x]));
  assert.equal(r.STOCK.classification, "PARTIAL"); assert.equal(r.STOCK.productionVerified, false); assert.equal(r.STOCK.openDecisions, 1); assert.equal(r.STOCK.configuredDecisions, 1);
  assert.equal(r.INVOICE.classification, "BLOCKED"); assert.equal(r.INVOICE.blockedBecause, "No invoice sync exists."); assert.equal(r.INVOICE.openDecisions, 2);
  assert.equal(r.DOCUMENT.classification, "BLOCKED"); assert.equal(r.DOCUMENT.openDecisions, 1);
  // a configured ownership does not change the classification
  assert.equal(readinessRows({ ...OV, decisionRegister: { ...OV.decisionRegister, items: ITEMS.map((i) => (i.id === "invoice.owner" ? { ...i, status: "CONFIGURED" } : i)) } }).find((x) => x.capability === "INVOICE").classification, "BLOCKED");
  // only an explicit PRODUCTION_VERIFIED level counts as production verified
  assert.equal(readinessRows({ ...OV, monitoring: [{ capability: "STOCK", label: "Stock", classification: "PARTIAL", highestVerification: "WRITE_VERIFIED" }] })[0].productionVerified, false);
  assert.equal(readinessRows({ ...OV, monitoring: [{ capability: "STOCK", label: "Stock", classification: "PARTIAL", highestVerification: "PRODUCTION_VERIFIED" }] })[0].productionVerified, true);
});

test("providers: SAP/REST style = mock verified only; no-adapter providers = unsupported", () => {
  const p = providerRows(OV);
  assert.match(p[0].text, /Mock verified only/); assert.equal(p[0].realVerified, false);
  assert.match(p[1].text, /Unsupported/); assert.equal(p[1].tone, "neutral");
});

test("panel states: loading, error, empty, forbidden (client permission or server 403), ready", () => {
  const ok = { status: "ready", data: OV, error: null };
  assert.equal(panelState({ status: "loading", data: null, error: null }, { view: true }), "loading");
  assert.equal(panelState({ status: "error", data: null, error: { status: 500 } }, { view: true }), "error");
  assert.equal(panelState({ status: "error", data: null, error: { status: 403 } }, { view: true }), "forbidden"); // the server's refusal wins
  assert.equal(panelState({ status: "error", data: null, error: { code: "FORBIDDEN" } }, { view: true }), "forbidden");
  assert.equal(panelState(ok, { view: false }), "forbidden");
  assert.equal(panelState({ status: "ready", data: { decisionRegister: { items: [] } }, error: null }, { view: true }), "empty");
  assert.equal(panelState({ status: "ready", data: { monitoring: [] }, error: null }, { view: true }), "empty");
  assert.equal(panelState(ok, { view: true }), "ready");
  assert.equal(panelState({ status: "loading", data: OV, error: null }, { view: true }), "ready"); // a reload keeps showing the last data
  assert.equal(registerOf(null), null);
});

test("the view-model offers no way to approve or save a decision", async () => {
  const mod = await import("./erpDecisionView.js");
  assert.deepEqual(Object.keys(mod).filter((k) => /approve|save|propose|submit|update|set[A-Z]/.test(k)), []);
});
