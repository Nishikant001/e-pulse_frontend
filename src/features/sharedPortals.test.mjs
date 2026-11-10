import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createLoader } from "../testing/viteLoader.mjs";

let loader, retailers, accounts, claims, Payments, Dashboard;
before(async () => {
  loader = await createLoader();
  retailers = await loader.load("/src/features/retailers/api/retailersApi.js");
  accounts = await loader.load("/src/features/accounts/api/accountsApi.js");
  claims = await loader.load("/src/features/claims/api/claimsApi.js");
  Payments = (await loader.load("/src/components/Distributers/dashboard/accounts/Payments.jsx")).default;
  Dashboard = (await loader.load("/src/components/Distributers/dashboard/pages/Dashboard.jsx")).default;
});
after(() => loader?.close());

describe("Distributor Payments (vendor UI removed, customer receipts kept)", () => {
  const html = () => renderToStaticMarkup(createElement(Payments));
  it("shows the customer receipt form", () => {
    const h = html();
    assert.match(h, /Receive from Customer/);
    assert.match(h, /Receive Payment/);
    assert.match(h, /Select Customer/);
    assert.match(h, /name="customer_id"/);
  });
  it("has no vendor tab, vendor form or vendor wording", () => {
    const h = html();
    assert.doesNotMatch(h, /vendor/i);
    assert.doesNotMatch(h, /Pay Vendor|Make Payment|Payable/);
  });
});

describe("Distributor Dashboard quick actions", () => {
  it("no longer links to Masters screens, and keeps the order chooser", () => {
    const h = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Dashboard)));
    assert.doesNotMatch(h, /\/dashboard\/(customer|stock-master|vendor)/);
    assert.match(h, /New Order/);
  });
});

describe("shared feature configs still serve both portals", () => {
  it("accounts: Admin keeps write access; Distributor config is unchanged (read-only)", () => {
    assert.deepEqual(accounts.ACCOUNT_PORTALS.admin, { base: "/admin/accounts", canWrite: true, showDistributor: true });
    assert.equal(accounts.ACCOUNT_PORTALS.distributor.canWrite, false);
  });
  it("claims: Admin can decide; Distributor config unchanged", () => {
    assert.equal(claims.CLAIM_PORTALS.admin.canDecide, true);
    assert.equal(claims.CLAIM_PORTALS.admin.base, "/admin/claims");
    assert.equal(claims.CLAIM_PORTALS.distributor.canCreate, true);
  });
  it("retailers/customers: Admin is Customer Master; Distributor calls them Customers (e-Pulse Phase 1)", () => {
    const { RETAILER_PORTALS, retailerLabels, retailersApi } = retailers;
    assert.equal(RETAILER_PORTALS.admin.base, "/admin/masters/customers");
    assert.equal(RETAILER_PORTALS.admin.canAssign, true);
    assert.equal(RETAILER_PORTALS.distributor.base, "/dashboard/customers");
    assert.equal(RETAILER_PORTALS.distributor.canAssign, false);
    assert.deepEqual(retailerLabels("admin"), { noun: "customer", Noun: "Customer", nouns: "customers", Nouns: "Customers" });
    assert.deepEqual(retailerLabels("distributor"), { noun: "customer", Noun: "Customer", nouns: "customers", Nouns: "Customers" });
    // the data API surface is unchanged: same operations, assign only for Admin
    const admin = retailersApi("admin"), dist = retailersApi("distributor");
    for (const k of ["lookups", "list", "detail", "create", "update", "setStatus"]) {
      assert.equal(typeof admin[k], "function", k);
      assert.equal(typeof dist[k], "function", k);
    }
    assert.equal(typeof admin.assign, "function");
    assert.equal(dist.assign, undefined);
  });
});
