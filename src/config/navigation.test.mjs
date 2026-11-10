import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createLoader } from "../testing/viteLoader.mjs";

let loader, nav, adminNav, portals;
before(async () => {
  loader = await createLoader();
  nav = await loader.load("/src/config/navigation.js");
  adminNav = await loader.load("/src/config/adminNavigation.js");
  portals = await loader.load("/src/config/portals.js");
});
after(() => loader?.close());

// Every node (group or item) as { id, label, to, status, group }.
const walk = (navigation) => navigation.flatMap((g) => [{ ...g, group: null }, ...(g.items || []).map((i) => ({ ...i, group: g.id }))]);
const ids = (navigation) => walk(navigation).map((n) => n.id);
const live = (navigation) => walk(navigation).filter((n) => n.to && n.status !== "planned");
const labels = (navigation) => walk(navigation).map((n) => n.label);

describe("Admin navigation (Phase 2)", () => {
  const removed = [
    "retailer-management", "retailer-list", "retailer-pharmacy", "retailer-hospital", "retailer-clinic", "retailer-compliance",
    "distributor-master", "retailer-master", "distributor-performance", "distributor-credit", "distributor-outstanding",
    "active-schemes", "scheme-calculation", "claim-settlement", "claim-credit-notes",
    "notifications", "audit-logs", "secondary-sales", "rpt-secondary", "rpt-distributor", "rpt-retailer", "rpt-sap",
    "sap", "sap-dashboard", "sap-connections", "sap-sync-history", "sap-errors", "sap-audit",
  ];
  it("contains none of the removed entries (by id)", () => {
    const have = new Set(ids(adminNav.adminNavigation));
    for (const id of removed) assert.equal(have.has(id), false, `unexpected admin nav id: ${id}`);
  });
  it("has no ERP / SAP / Secondary / Retailer labels or links", () => {
    for (const n of walk(adminNav.adminNavigation)) {
      assert.doesNotMatch(`${n.label} ${n.to || ""}`, /\b(erp|sap|secondary|retailer)/i, `${n.id}: ${n.label} ${n.to}`);
    }
  });
  it("has no sales-creation entry", () => {
    for (const n of live(adminNav.adminNavigation)) assert.doesNotMatch(n.to, /\/orders\/(new|.+\/edit)/);
    assert.deepEqual(adminNav.adminNavigation.find((g) => g.id === "sales").items.map((i) => i.id), ["sales-orders", "sales-invoices", "sales-returns", "credit-notes"]);
  });
  it("keeps Customer Master live at /admin/masters/customers", () => {
    const item = adminNav.adminNavigation.find((g) => g.id === "masters").items.find((i) => i.id === "customer-master");
    assert.equal(item.label, "Customer Master");
    assert.equal(item.to, "/admin/masters/customers");
    assert.equal(item.status, undefined);
    assert.equal(item.detailCrumbs, true);
  });
  it("keeps approved live Admin modules and their paths", () => {
    const expected = [
      "/admin/dashboard", "/admin/super-admin", "/admin/purchase-orders", "/admin/sales/orders", "/admin/sales/invoices",
      "/admin/inventory/current", "/admin/inventory/batch", "/admin/inventory/ledger", "/admin/inventory/near-expiry", "/admin/inventory/expired", "/admin/inventory/fefo",
      "/admin/masters/products", "/admin/masters/batches", "/admin/masters/customers", "/admin/masters/pricing", "/admin/masters/schemes", "/admin/masters/taxes", "/admin/masters/customer-groups",
      "/admin/distributors", "/admin/claims",
      "/admin/accounts", "/admin/accounts/outstanding", "/admin/accounts/ageing", "/admin/accounts/ledger", "/admin/accounts/payments", "/admin/accounts/credit",
    ];
    assert.deepEqual(live(adminNav.adminNavigation).map((n) => n.to).sort(), expected.sort());
  });
  it("keeps Sales Returns and the Sales Credit Notes placeholder as planned (never shown as working)", () => {
    const sales = adminNav.adminNavigation.find((g) => g.id === "sales").items;
    for (const id of ["sales-returns", "credit-notes"]) {
      const it = sales.find((i) => i.id === id);
      assert.equal(it.status, "planned");
      assert.equal(it.to, undefined);
    }
  });
  it("keeps Schemes & Claims with Claims only", () => {
    assert.deepEqual(adminNav.adminNavigation.find((g) => g.id === "schemes-claims").items.map((i) => i.id), ["claims"]);
  });
  it("Distributor Management keeps Distributor List live and only the Ledger placeholder", () => {
    assert.deepEqual(adminNav.adminNavigation.find((g) => g.id === "distributor-management").items.map((i) => [i.id, i.status || "live"]), [["distributor-list", "live"], ["distributor-ledger", "planned"]]);
  });
  it("has no duplicate ids and no duplicate live paths", () => {
    const all = ids(adminNav.adminNavigation);
    // item ids may legitimately repeat across the two portals but never inside one portal
    assert.equal(new Set(all).size, all.length, "duplicate ids");
    const paths = live(adminNav.adminNavigation).map((n) => n.to);
    assert.equal(new Set(paths).size, paths.length, "duplicate paths");
  });
  it("is independent of the Distributor model", () => {
    // adminNavigation must not change when the Distributor model changes (no derivation): same Admin ids exist that Distributor lacks.
    assert.ok(ids(adminNav.adminNavigation).includes("fefo-monitor"));
    assert.ok(!ids(nav.distributorNavigation).includes("fefo-monitor"));
  });
});

describe("Distributor navigation (Phase 2)", () => {
  const removed = [
    "fefo-monitor", "masters", "product-master", "batch-master", "customer-master", "vendor-master", "pricing-master", "tax-master", "customer-groups", "vendor-groups", "item-groups",
    "distributor-master", "retailer-master", "scheme-master",
    "schemes-claims", "claims", "active-schemes", "scheme-calculation", "claim-settlement", "claim-credit-notes",
    "finance", "finance-overview", "finance-outstanding", "finance-ageing", "finance-ledger", "finance-payments", "finance-credit",
    "vendor-ledger", "secondary-sales", "rpt-secondary", "notifications", "audit-logs",
  ];
  it("excludes FEFO Monitor, Masters, Schemes & Claims, Financial View, vendor options, Secondary Sales, Notifications and Audit Logs", () => {
    const have = new Set(ids(nav.distributorNavigation));
    for (const id of removed) assert.equal(have.has(id), false, `unexpected distributor nav id: ${id}`);
    for (const n of walk(nav.distributorNavigation)) {
      assert.doesNotMatch(`${n.label} ${n.to || ""}`, /fefo|vendor|financial view|secondary|\/finance|\/claims|schemes & claims/i, `${n.id}: ${n.label}`);
      assert.doesNotMatch(n.label, /^(masters|product master|batch master|customer master|pricing master|tax master|scheme master)/i, n.label);
      assert.doesNotMatch(n.to || "", /\/(material-master|stock-master|customer(?!s)|customerGroup|vendor|vendorsGroup|itemsGroup|hsn-master|pricing)$/);
    }
  });
  it("the portal exposes exactly the model (no hidden filtering needed)", () => {
    assert.equal(portals.distributorPortal.navigation, nav.distributorNavigation);
  });
  it("keeps Sales, Purchase, Inventory and customer-facing account navigation intact", () => {
    const expected = [
      "/dashboard",
      "/dashboard/salesorder-master", "/dashboard/sales/delivery", "/dashboard/sales/invoice", "/dashboard/sales/return", "/dashboard/sales/credit", "/dashboard/sales/debit",
      "/dashboard/purchase/po", "/dashboard/purchase/delivery", "/dashboard/purchase/invoice", "/dashboard/purchase/return", "/dashboard/purchase/debit",
      "/dashboard/inventory/current", "/dashboard/inventory/batch", "/dashboard/inventory/ledger", "/dashboard/inventory/near-expiry", "/dashboard/inventory/expired",
      "/dashboard/customers",
      // e-Pulse Phase 1: all nine Reports sections (view only) and Settings are live
      "/dashboard/reports/sales", "/dashboard/reports/stock", "/dashboard/reports/expiry", "/dashboard/reports/distributor", "/dashboard/reports/customers",
      "/dashboard/reports/scheme", "/dashboard/reports/returns", "/dashboard/reports/outstanding", "/dashboard/reports/sap-sync", "/dashboard/settings",
      "/dashboard/accounts/CustomerLedger", "/dashboard/accounts/Payments", "/dashboard/accounts/GLMaster", "/dashboard/accounts/TrialBalance", "/dashboard/accounts/BalanceSheet",
    ];
    assert.deepEqual(live(nav.distributorNavigation).map((n) => n.to).sort(), expected.sort());
  });
  it("does not relabel Customer Ledger as My Ledger or add a fake ledger", () => {
    assert.ok(labels(nav.distributorNavigation).includes("Customer Ledger"));
    assert.ok(!labels(nav.distributorNavigation).some((l) => /my ledger/i.test(l)));
  });
  it("has no duplicate ids and no duplicate live paths", () => {
    const all = ids(nav.distributorNavigation);
    // ids repeat legitimately only for the "sales-returns"-style names across groups; here none should repeat
    assert.equal(new Set(all).size, all.length, "duplicate ids");
    const paths = live(nav.distributorNavigation).map((n) => n.to);
    assert.equal(new Set(paths).size, paths.length, "duplicate paths");
  });
});

describe("planned-module toggle cannot restore removed entries (both portals)", () => {
  const removedLabels = /secondary|notification|audit log|erp|sap|retailer|distributor master|performance|claim settlement|scheme calculation|active schemes/i;
  it("Distributor: visibleNavigation(showPlanned=true) contains nothing removed", () => {
    const shown = nav.visibleNavigation(nav.distributorNavigation, true);
    for (const n of walk(shown)) assert.doesNotMatch(n.label, /fefo|^(masters|product master|batch master|customer master|vendor master|pricing master|tax master|scheme master)|schemes & claims|financial view|vendor|secondary|notification|audit log/i, n.label);
  });
  it("Admin: visibleNavigation(showPlanned=true) contains no removed entries", () => {
    const shown = nav.visibleNavigation(adminNav.adminNavigation, true);
    for (const n of walk(shown)) {
      assert.doesNotMatch(n.label, removedLabels, n.label);
    }
  });
  it("global search (flattenLive) never offers removed pages", () => {
    for (const nv of [nav.distributorNavigation, adminNav.adminNavigation]) {
      for (const e of nav.flattenLive(nv)) assert.doesNotMatch(e.to, /\/admin\/(sap|retailers|sales\/secondary)|\/dashboard\/(finance|claims|customer(?!s)|vendor|pricing|hsn-master|material-master|stock-master|inventory\/fefo)/);
    }
  });
});

describe("breadcrumbs and Admin permission filter", () => {
  it("Customer Master detail pages resolve to the Masters > Customer Master trail", () => {
    const hit = nav.findNavTrail(adminNav.adminNavigation, "/admin/masters/customers/12/edit");
    assert.equal(hit.group.id, "masters");
    assert.equal(hit.item.id, "customer-master");
  });
  it("filterAdminNavigation keeps every non-ERP module untouched and honours requiresRole", () => {
    const asAdmin = adminNav.filterAdminNavigation(adminNav.adminNavigation, { role: "ADMIN", erpPermissions: [] });
    assert.ok(!asAdmin.some((g) => g.id === "super-admin"));
    assert.equal(asAdmin.length, adminNav.adminNavigation.length - 1);
    const asSuper = adminNav.filterAdminNavigation(adminNav.adminNavigation, { role: "SUPER_ADMIN", erpPermissions: [] });
    assert.equal(asSuper.length, adminNav.adminNavigation.length);
  });
  it("the Admin portal no longer defines an ERP/SAP header status; the Distributor portal is unchanged", () => {
    assert.equal(portals.adminPortal.sapStatus, undefined);
    assert.equal(portals.distributorPortal.sapStatus, "not_configured");
  });
});
