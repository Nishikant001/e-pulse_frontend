import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, createRoutesFromChildren, matchRoutes } from "react-router-dom";
import { createLoader } from "../../testing/viteLoader.mjs";

let loader, saNav, nav, adminNav, portals, isSuperAdmin, PrivateApp, FeedbackProvider;
const pages = {};
const PAGES = {
  home: ["SuperAdminHomePage", /Platform Dashboard/],
  roles: ["RolesPermissionsPage", /Roles &amp; Permissions/],
  distributors: ["NetworkDistributorsPage", /All Distributors/],
  onboarding: ["OnboardingRequestsPage", /Onboarding Requests/],
  billing: ["PlansBillingPage", /Plans &amp; Billing/],
  audit: ["AuditLogsPage", /Audit Logs/],
  announcements: ["AnnouncementsPage", /Announcements/],
  settings: ["PlatformSettingsPage", /Platform Settings/],
};

before(async () => {
  loader = await createLoader();
  saNav = await loader.load("/src/config/superAdminNavigation.js");
  nav = await loader.load("/src/config/navigation.js");
  adminNav = await loader.load("/src/config/adminNavigation.js");
  portals = await loader.load("/src/config/portals.js");
  isSuperAdmin = (await loader.load("/src/features/superAdmin/isSuperAdmin.js")).isSuperAdmin;
  PrivateApp = (await loader.load("/src/PrivateApp.jsx")).default;
  FeedbackProvider = (await loader.load("/src/components/feedback/index.js")).FeedbackProvider;
  for (const [k, [file]] of Object.entries(PAGES)) pages[k] = (await loader.load(`/src/features/superAdmin/pages/${file}.jsx`)).default;
});
after(() => loader?.close());

const render = (C) => renderToStaticMarkup(createElement(FeedbackProvider, null, createElement(MemoryRouter, null, createElement(C))));

describe("Super Admin navigation", () => {
  it("contains only platform-level entries — none of the day-to-day admin modules", () => {
    const ids = saNav.superAdminNavigation.map((g) => g.id);
    assert.deepEqual(ids, ["dashboard", "admin-management", "distributor-network", "billing", "audit-logs", "announcements", "platform-settings"]);
    for (const hidden of ["sales", "inventory", "masters", "schemes-claims", "accounts", "reports", "distributor-management"]) assert.ok(!ids.includes(hidden), hidden);
  });
  it("every entry is live and routed under /admin", () => {
    const live = nav.flattenLive(saNav.superAdminNavigation);
    assert.equal(live.length, 9);
    for (const e of live) assert.match(e.to, /^\/admin\/(dashboard|super-admin)/);
    const planned = [...saNav.superAdminNavigation, ...saNav.superAdminNavigation.flatMap((g) => g.items || [])].filter((n) => n.status === "planned");
    assert.equal(planned.length, 0);
  });
  it("Admins & Users only highlights on its own path (end: true)", () => {
    const item = saNav.superAdminNavigation.find((g) => g.id === "admin-management").items.find((i) => i.id === "admins-users");
    assert.equal(item.end, true);
    assert.equal(nav.findNavTrail(saNav.superAdminNavigation, "/admin/super-admin/roles").item.id, "roles-permissions");
  });
  it("the regular Admin navigation is unchanged and still has no day-to-day modules removed", () => {
    for (const id of ["sales", "inventory", "masters", "accounts"]) assert.ok(adminNav.adminNavigation.some((g) => g.id === id), id);
  });
  it("superAdminPortal reuses the admin portal shell with its own menu", () => {
    assert.equal(portals.superAdminPortal.id, "admin");
    assert.equal(portals.superAdminPortal.label, "Super Admin Portal");
    assert.equal(portals.superAdminPortal.navigation, saNav.superAdminNavigation);
    assert.equal(portals.adminPortal.navigation, adminNav.adminNavigation);
  });
});

describe("Super Admin role helper", () => {
  it("matches SUPER_ADMIN only", () => {
    assert.equal(isSuperAdmin({ role: "SUPER_ADMIN" }), true);
    assert.equal(isSuperAdmin({ role: "super_admin" }), true);
    assert.equal(isSuperAdmin({ role: "ADMIN" }), false);
    assert.equal(isSuperAdmin(null), false);
  });
});

describe("Super Admin routes", () => {
  it("every sidebar link resolves to a real page inside the RequireSuperAdmin layout route", () => {
    const suspense = PrivateApp();
    const routes = createRoutesFromChildren(suspense.props.children.props.children);
    for (const e of nav.flattenLive(saNav.superAdminNavigation)) {
      const m = matchRoutes(routes, e.to);
      assert.ok(m, `${e.to} must match a route`);
      const leaf = m[m.length - 1].route;
      assert.notEqual(leaf.path, "*", `${e.to} must not fall through to not-found`);
    }
    const m = matchRoutes(routes, "/admin/super-admin/roles");
    assert.ok(m.some((x) => x.route.path === "super-admin" && x.route.element), "gated by the super-admin layout route");
  });
});

describe("Super Admin pages render sample data with the demo notice", () => {
  for (const [k, [file, title]] of Object.entries(PAGES)) {
    it(file, () => {
      const html = render(pages[k]);
      assert.match(html, title);
      assert.match(html, /Design preview/);
    });
  }
});
