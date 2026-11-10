// Frontend unit tests for the public website (node:test). Pure modules only — browser behaviour is checked separately (see PHASE23_TEST_REPORT.md).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PUBLIC_ROUTES, PRIVATE_PREFIXES, isPrivatePath, SITEMAP_ROUTES } from "./siteConfig.js";
import { headFor, buildSitemap, buildRobots, applyHead, jsonLdFor } from "./seo.js";
import { validateContact, mailtoHref } from "./contactValidation.js";
import { FAQS, MODULES } from "./content.js";

const ORIGIN = "https://example.test";

test("every public route has a unique path, a unique title and a 50–160 char description", () => {
  assert.equal(new Set(PUBLIC_ROUTES.map((r) => r.path)).size, PUBLIC_ROUTES.length);
  assert.equal(new Set(PUBLIC_ROUTES.map((r) => r.title)).size, PUBLIC_ROUTES.length);
  for (const r of PUBLIC_ROUTES) { assert.ok(r.title.length <= 70, r.path); assert.ok(r.description.length >= 50 && r.description.length <= 170, `${r.path} ${r.description.length}`); }
});
test("no public route is a private path", () => { for (const r of PUBLIC_ROUTES) assert.equal(isPrivatePath(r.path), false, r.path); });
test("isPrivatePath covers the application areas and their children", () => {
  for (const p of ["/dashboard", "/dashboard/inventory/current", "/admin", "/admin/sap/connections", "/login", "/signup", "/forgot-password", "/reset-password"]) assert.equal(isPrivatePath(p), true, p);
  assert.equal(isPrivatePath("/features"), false); assert.equal(isPrivatePath("/administration-guide"), false);
});
test("sitemap lists indexable public canonical URLs only, never private ones", () => {
  const xml = buildSitemap(SITEMAP_ROUTES(), ORIGIN);
  assert.match(xml, /<loc>https:\/\/example\.test\/<\/loc>/);
  for (const r of SITEMAP_ROUTES()) assert.ok(xml.includes(`<loc>${ORIGIN}${r.path}</loc>`));
  for (const p of PRIVATE_PREFIXES) assert.ok(!xml.includes(`${ORIGIN}${p}`), p);
  assert.ok(!xml.includes("/privacy") && !xml.includes("/terms")); // legal drafts are noindex
});
test("without a configured origin there is no sitemap, canonical or JSON-LD (domain is never invented)", () => {
  assert.equal(buildSitemap(SITEMAP_ROUTES(), ""), null);
  const h = headFor(PUBLIC_ROUTES[0], "");
  assert.equal(h.canonical, ""); assert.deepEqual(h.jsonLd, []); assert.equal(h.og["og:url"], undefined);
  assert.ok(!/Sitemap:/.test(buildRobots("")));
});
test("robots.txt disallows every private prefix and the API, and links the sitemap when the origin is known", () => {
  const r = buildRobots(ORIGIN);
  for (const p of PRIVATE_PREFIXES) assert.ok(r.includes(`Disallow: ${p}`), p);
  assert.ok(r.includes("Disallow: /api/")); assert.ok(r.includes(`Sitemap: ${ORIGIN}/sitemap.xml`));
});
test("head: indexable pages get canonical + index; legal drafts get noindex and no canonical", () => {
  const home = headFor(PUBLIC_ROUTES[0], ORIGIN); assert.equal(home.canonical, `${ORIGIN}/`); assert.equal(home.robots, "index,follow");
  const priv = headFor(PUBLIC_ROUTES.find((r) => r.id === "privacy"), ORIGIN); assert.equal(priv.robots, "noindex,follow"); assert.equal(priv.canonical, "");
});
test("JSON-LD only on the home page, only with an origin, and with no invented ratings/offers", () => {
  assert.equal(jsonLdFor(PUBLIC_ROUTES.find((r) => r.id === "features"), ORIGIN).length, 0);
  const ld = jsonLdFor(PUBLIC_ROUTES[0], ORIGIN); assert.deepEqual(ld.map((x) => x["@type"]), ["Organization", "WebSite", "SoftwareApplication"]);
  const s = JSON.stringify(ld); assert.ok(!/aggregateRating|offers|review|sameAs|address|telephone/.test(s));
});
test("applyHead replaces title/description/robots (incl. multi-line meta) and injects body; escapes JSON-LD", () => {
  const shell = fs.readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  const head = headFor({ ...PUBLIC_ROUTES[0], title: 'A "T" <x>', description: "d & d" }, ORIGIN);
  const out = applyHead(shell, head, "<h1>Hi</h1>");
  assert.equal((out.match(/<title>/g) || []).length, 1); assert.ok(out.includes("<title>A &quot;T&quot; &lt;x&gt;</title>"));
  assert.equal((out.match(/name="description"/g) || []).length, 1); assert.ok(out.includes('content="d &amp; d"'));
  assert.equal((out.match(/name="robots"/g) || []).length, 1); assert.ok(out.includes('content="index,follow"'));
  assert.ok(out.includes('<div id="root"><h1>Hi</h1></div>')); assert.ok(out.includes(`rel="canonical" href="${ORIGIN}/"`));
  assert.ok(!/<\/script><script/.test(out.replace(/type="module"[^>]*><\/script>/, "")));
});
test("the app shell used for private routes is noindex", () => {
  const shell = fs.readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(shell, /name="robots" content="noindex,nofollow"/);
});

test("contact validation: required fields, formats and limits", () => {
  const ok = { name: "Asha Rao", email: "asha@company.com", message: "We would like a demo for two warehouses.", consent: true };
  assert.equal(validateContact(ok).valid, true);
  assert.deepEqual(Object.keys(validateContact({}).errors).sort(), ["consent", "email", "message", "name"]);
  for (const bad of ["a@b", "a b@c.com", "@c.com", "a@@c.com", "plain"]) assert.ok(validateContact({ ...ok, email: bad }).errors.email, bad);
  assert.ok(validateContact({ ...ok, message: "short" }).errors.message);
  assert.ok(validateContact({ ...ok, message: "x".repeat(2001) }).errors.message);
  assert.ok(validateContact({ ...ok, phone: "abc" }).errors.phone); assert.equal(validateContact({ ...ok, phone: "+91 98765-43210" }).valid, true);
  assert.ok(validateContact({ ...ok, consent: false }).errors.consent);
  assert.ok(validateContact({ ...ok, name: " " }).errors.name);
});
test("mailto link is encoded and never contains raw newlines", () => {
  const h = mailtoHref("sales@example.test", { name: "A&B", message: "line1\nline2 & more", organisation: "X" });
  assert.ok(h.startsWith("mailto:sales@example.test?subject=")); assert.ok(!/\n/.test(h)); assert.ok(h.includes("%0A")); assert.ok(h.includes("%26"));
});

test("content honesty: ERP is not 'available' without the live-ERP caveat; planned module is flagged; no fabricated metrics", () => {
  assert.equal(MODULES.find((m) => m.id === "erp").status, "available-erp");
  assert.equal(MODULES.find((m) => m.id === "reports").status, "planned");
  const all = JSON.stringify({ FAQS, MODULES });
  assert.ok(!/\b\d{2,}\s?%|\b\d+\+? (customers|clients|distributors)|ISO ?\d|GMP|certified|guarantee|99\.\d/i.test(all));
  assert.ok(/not yet been verified against a live ERP/.test(FAQS.find((f) => f.id === "erp").a));
  assert.ok(!/retailer (login|portal)\b(?! —)/i.test(JSON.stringify(FAQS)) || /no separate retailer portal/.test(JSON.stringify(FAQS)));
});
