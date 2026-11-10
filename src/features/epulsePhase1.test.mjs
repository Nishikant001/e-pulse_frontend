// e-Pulse Phase 1 — navigation + client contracts for Customers, Reports (view only), Settings, vendor-free PO and the Admin PO view.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { createLoader } from "../testing/viteLoader.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (rel) => fs.readFileSync(path.join(here, "..", rel), "utf8");
let loader, nav, adminNav, reports, adminPo, retailers;
before(async () => {
  loader = await createLoader();
  nav = await loader.load("/src/config/navigation.js");
  adminNav = await loader.load("/src/config/adminNavigation.js");
  reports = await loader.load("/src/features/reports/api/reportsApi.js");
  adminPo = await loader.load("/src/features/adminPurchaseOrders/api/purchaseOrdersApi.js");
  retailers = await loader.load("/src/features/retailers/api/retailersApi.js");
});
after(() => loader?.close());

describe("Distributor navigation", () => {
  it("shows Customers (not Retailer Management) and no retailer wording anywhere in the menu", () => {
    const labels = [];
    const walk = (n) => { labels.push(n.label); (n.items || []).forEach(walk); };
    nav.distributorNavigation.forEach(walk);
    assert.ok(labels.includes("Customers"));
    assert.ok(!labels.some((l) => /retailer/i.test(l)), labels.join(", "));
  });
  it("every Reports section and Settings are live links (nothing planned)", () => {
    const rep = nav.distributorNavigation.find((g) => g.id === "reports");
    assert.equal(rep.items.length, 9);
    rep.items.forEach((i) => { assert.ok(i.to && i.status !== "planned", i.id); assert.match(i.to, /^\/dashboard\/reports\//); });
    const settings = nav.distributorNavigation.find((g) => g.id === "settings");
    assert.equal(settings.to, "/dashboard/settings");
    assert.notEqual(settings.status, "planned");
  });
  it("every nav report section exists in the report client and vice-versa", () => {
    const fromNav = nav.distributorNavigation.find((g) => g.id === "reports").items.map((i) => i.to.split("/").pop()).sort();
    assert.deepEqual(fromNav, reports.REPORT_SECTIONS.map((s) => s.id).sort());
  });
  it("Customers pages get New / Edit / Details breadcrumbs", () => {
    assert.equal(nav.findNavTrail(nav.distributorNavigation, "/dashboard/customers/5/edit").group.id, "customers");
  });
});

describe("Admin navigation", () => {
  it("has a live Purchase Orders entry", () => {
    const po = adminNav.adminNavigation.find((g) => g.id === "purchase-orders");
    assert.equal(po.to, "/admin/purchase-orders");
  });
});

describe("Client contracts", () => {
  it("Distributor customers live at /dashboard/customers and use the customer noun", () => {
    assert.equal(retailers.RETAILER_PORTALS.distributor.base, "/dashboard/customers");
    assert.equal(retailers.RETAILER_PORTALS.distributor.noun, "customer");
  });
  it("the Reports client can only read (GET); the Admin PO client reads and fulfils (deliver + invoice) but never edits or deletes", () => {
    assert.doesNotMatch(read("features/reports/api/reportsApi.js"), /method:\s*["'](POST|PUT|PATCH|DELETE)["']/i);
    assert.doesNotMatch(read("features/adminPurchaseOrders/api/purchaseOrdersApi.js"), /method:\s*["'](PUT|PATCH|DELETE)["']/i);
    assert.deepEqual(Object.keys(reports.reportsApi), ["run"]);
    assert.deepEqual(Object.keys(adminPo.adminPurchaseOrdersApi).sort(), ["deliver", "get", "invoice", "list", "lookups"]);
  });
  it("the report page renders no action buttons and no forms (view only)", () => {
    const src = read("features/reports/pages/DistributorReportPage.jsx");
    assert.doesNotMatch(src, /<form|<Button|onSubmit|method:/);
  });
  it("the PO form no longer asks for a vendor and never requires one", () => {
    const src = read("components/Distributers/dashboard/pages/Po.jsx");
    assert.doesNotMatch(src, /label="Vendor code"/);
    assert.doesNotMatch(src, /Vendor is required/);
    assert.match(src, /goes to your administrator automatically/);
  });
  it("old /dashboard/retailers links redirect to /dashboard/customers", () => {
    const src = read("PrivateApp.jsx");
    assert.match(src, /path="retailers\/\*" element=\{<RetailersRedirect \/>\}/);
    assert.match(src, /path="customers\/:id\/edit"/);
  });
});
