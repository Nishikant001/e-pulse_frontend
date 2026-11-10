import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, createRoutesFromChildren, matchRoutes } from "react-router-dom";
import { createLoader } from "../testing/viteLoader.mjs";

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let loader, routes, AdminNotFound, DistributorNotFound, adminNav, nav;

// PrivateApp() returns <Suspense><Routes>…</Routes></Suspense>; pull the real <Route> tree out of it (no rendering, no network).
function routeTree(PrivateApp) {
  const suspense = PrivateApp();
  const routesEl = suspense.props.children;
  return createRoutesFromChildren(routesEl.props.children);
}
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const leaf = (p) => {
  const m = matchRoutes(routes, p);
  return m ? m[m.length - 1].route : null;
};
const isNotFound = (p, Comp) => {
  const r = leaf(p);
  return Boolean(r) && r.path === "*" && r.element?.type === Comp;
};
const resolves = (p) => {
  const r = leaf(p);
  return Boolean(r) && r.path !== "*";
};

before(async () => {
  loader = await createLoader();
  const app = await loader.load("/src/PrivateApp.jsx");
  nav = await loader.load("/src/config/navigation.js");
  adminNav = await loader.load("/src/config/adminNavigation.js");
  AdminNotFound = (await loader.load("/src/features/adminAuth/AdminNotFound.jsx")).default;
  DistributorNotFound = (await loader.load("/src/components/Distributers/dashboard/DistributorNotFound.jsx")).default;
  routes = routeTree(app.default);
});
after(() => loader?.close());

describe("Admin: removed routes render AdminNotFound (no redirect)", () => {
  const blocked = [
    "/admin/retailers", "/admin/retailers/new", "/admin/retailers/12", "/admin/retailers/12/edit",
    "/admin/sales/orders/new", "/admin/sales/orders/5/edit",
    "/admin/sales/secondary",
    "/admin/sap", "/admin/sap/dashboard", "/admin/sap/connections", "/admin/sap/sync-history", "/admin/sap/errors", "/admin/sap/audit", "/admin/sap/anything-else",
  ];
  for (const p of blocked) it(`${p}`, () => assert.ok(isNotFound(p, AdminNotFound), `${p} must fall through to AdminNotFound`));
});

describe("Admin: approved routes are preserved", () => {
  const kept = [
    "/admin/dashboard", "/admin/super-admin", "/admin/sales/orders", "/admin/sales/invoices",
    "/admin/inventory/current", "/admin/inventory/batch", "/admin/inventory/ledger", "/admin/inventory/fefo", "/admin/inventory/near-expiry", "/admin/inventory/expired",
    "/admin/masters/products", "/admin/masters/products/3", "/admin/masters/batches", "/admin/masters/batches/3", "/admin/masters/pricing", "/admin/masters/taxes", "/admin/masters/customer-groups",
    "/admin/masters/schemes", "/admin/masters/schemes/new", "/admin/masters/schemes/4", "/admin/masters/schemes/4/edit",
    "/admin/distributors", "/admin/distributors/new", "/admin/distributors/9", "/admin/distributors/9/edit",
    "/admin/claims", "/admin/claims/7",
    "/admin/accounts", "/admin/accounts/outstanding", "/admin/accounts/ageing", "/admin/accounts/ledger", "/admin/accounts/payments", "/admin/accounts/credit",
    // Customer Master (the former retailer pages)
    "/admin/masters/customers", "/admin/masters/customers/new", "/admin/masters/customers/12", "/admin/masters/customers/12/edit",
  ];
  for (const p of kept) it(`${p}`, () => assert.ok(resolves(p), `${p} must still resolve to a real page`));
  it("an unknown Admin path is still AdminNotFound", () => assert.ok(isNotFound("/admin/does/not/exist", AdminNotFound)));
});

describe("Distributor: removed routes render DistributorNotFound (no redirect)", () => {
  const blocked = [
    "/dashboard/inventory/fefo",
    // Masters
    "/dashboard/material-master", "/dashboard/stock-master", "/dashboard/customer", "/dashboard/customerGroup", "/dashboard/vendor", "/dashboard/vendorsGroup",
    "/dashboard/itemsGroup", "/dashboard/hsn-master", "/dashboard/pricing",
    // Schemes & Claims
    "/dashboard/claims", "/dashboard/claims/new", "/dashboard/claims/8", "/dashboard/claims/8/edit",
    // Financial View
    "/dashboard/finance", "/dashboard/finance/outstanding", "/dashboard/finance/ageing", "/dashboard/finance/ledger", "/dashboard/finance/payments", "/dashboard/finance/credit",
    // Vendor ledger
    "/dashboard/accounts/VendorLedger",
  ];
  for (const p of blocked) it(`${p}`, () => assert.ok(isNotFound(p, DistributorNotFound), `${p} must fall through to DistributorNotFound`));
});

describe("Distributor: approved routes are preserved", () => {
  const kept = [
    "/dashboard", "/dashboard/salesorder-master", "/dashboard/delivery", "/dashboard/invoice/creation", "/dashboard/invoice/view",
    "/dashboard/sales/delivery", "/dashboard/sales/invoice", "/dashboard/sales/credit", "/dashboard/sales/debit", "/dashboard/sales/return",
    "/dashboard/purchase/po", "/dashboard/purchase/delivery", "/dashboard/purchase/invoice", "/dashboard/purchase/return", "/dashboard/purchase/debit",
    "/dashboard/inventory/current", "/dashboard/inventory/batch", "/dashboard/inventory/ledger", "/dashboard/inventory/near-expiry", "/dashboard/inventory/expired",
    "/dashboard/retailers", "/dashboard/retailers/new", "/dashboard/retailers/5", "/dashboard/retailers/5/edit",
    "/dashboard/accounts/GLMaster", "/dashboard/accounts/CustomerLedger", "/dashboard/accounts/BalanceSheet", "/dashboard/accounts/TrialBalance", "/dashboard/accounts/Payments",
    "/dashboard/logout",
  ];
  for (const p of kept) it(`${p}`, () => assert.ok(resolves(p), `${p} must still resolve to a real page`));
});

describe("no dead links / stale imports", () => {
  it("every live item in both portals' navigation resolves to a real (non-fallback) route", () => {
    for (const navigation of [nav.distributorNavigation, adminNav.adminNavigation]) {
      for (const n of nav.flattenLive(navigation)) assert.ok(resolves(n.to), `dead nav link: ${n.to}`);
    }
  });
  it("every lazy()/import in PrivateApp.jsx points to a file that exists, and every lazy component is used", () => {
    const src = fs.readFileSync(path.join(srcDir, "PrivateApp.jsx"), "utf8");
    const re = /(?:const (\w+) = lazy\(\(\) => import\("([^"]+)"\)\)|import (\w+) from "([^"]+)")/g;
    let m, count = 0;
    while ((m = re.exec(src))) {
      const [, lazyName, lazyPath, impName, impPath] = m;
      const rel = lazyPath || impPath;
      const name = lazyName || impName;
      if (!rel.startsWith(".")) continue;
      const base = path.resolve(srcDir, rel);
      assert.ok([".jsx", ".js", ""].some((ext) => fs.existsSync(base + ext) && fs.statSync(base + ext).isFile()), `missing module: ${rel}`);
      if (lazyName) assert.ok(new RegExp(`<${name}[\\s/>]`).test(src), `unused lazy component: ${name}`);
      count++;
    }
    assert.ok(count > 40);
  });
  it("PrivateApp no longer imports removed Admin/ERP/Masters pages", () => {
    const src = stripComments(fs.readFileSync(path.join(srcDir, "PrivateApp.jsx"), "utf8"));
    for (const gone of ["CreateSalesOrderPage", "SecondarySalesPage", "ErpAccessGate", "ErpConnectionsPage", "ErpAuditLogPage", "pages/MaterialMaster", "pages/StockMaster", "pages/Customer\"", "pages/Vendor\"", "PricingMaster", "HSNMaster", "VendorLedger", "FefoMonitor\"", "ClaimFormPage"]) {
      assert.ok(!src.includes(gone), `PrivateApp still references ${gone}`);
    }
  });
  it("Admin sales order screens expose no create/edit entry points", () => {
    for (const f of ["features/adminSales/orders/SalesOrdersPage.jsx", "features/adminSales/orders/OrderDrawer.jsx"]) {
      const src = fs.readFileSync(path.join(srcDir, f), "utf8");
      assert.ok(!/orders\/new|\/edit`|can\("edit"\)|"edit"|New order/.test(stripComments(src)), `${f} still has a create/edit entry`);
    }
  });
});

describe("not-found views render", () => {
  it("AdminNotFound and DistributorNotFound show a message, not another working page", () => {
    for (const [Comp, home] of [[AdminNotFound, "/admin/dashboard"], [DistributorNotFound, "/dashboard"]]) {
      const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Comp)));
      assert.match(html, /This page is not available/);
      assert.ok(html.includes(`href="${home}"`));
    }
  });
});
