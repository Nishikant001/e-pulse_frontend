// Post-build SEO/crawlability verification of dist/ (no browser). Usage: node scripts/verify-dist.mjs   (exit 1 on any failure)
import fs from "node:fs"; import path from "node:path"; import { loadEnv } from "vite";
Object.assign(process.env, loadEnv("production", process.cwd(), "VITE_"));
const { PUBLIC_ROUTES, SITE, PRIVATE_PREFIXES, isPrivatePath } = await import("../src/public/siteConfig.js");
const dist = path.resolve("dist"); const res = []; const rec = (n, ok, d = "") => { res.push({ n, ok }); console.log(`${ok ? "PASS" : "FAIL"} ${n}${d ? " — " + d : ""}`); };
const strip = (h) => h.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
const titles = new Set(), descs = new Set();
for (const r of PUBLIC_ROUTES) {
  const f = path.join(dist, r.path === "/" ? "index.html" : r.path.slice(1), r.path === "/" ? "" : "index.html"); const file = fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(dist, "index.html");
  const h = fs.readFileSync(file, "utf8"); const id = `[${r.path}]`;
  const title = (h.match(/<title>([\s\S]*?)<\/title>/) || [])[1]; const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1]; const robots = (h.match(/<meta name="robots" content="([^"]*)"/) || [])[1];
  rec(`${id} title/description present, single <title>, single description`, !!title && !!desc && (h.match(/<title>/g) || []).length === 1 && (h.match(/name="description"/g) || []).length === 1);
  titles.add(title); descs.add(desc);
  rec(`${id} robots = ${r.indexable ? "index,follow,max-image-preview:large" : "noindex,nofollow"}`, robots === (r.indexable ? "index,follow,max-image-preview:large" : "noindex,nofollow"), robots);
  const canon = (h.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
  if (SITE.origin && r.indexable) rec(`${id} canonical = origin + path`, canon === `${SITE.origin}${r.path}`, canon); else rec(`${id} no canonical (origin ${SITE.origin ? "set, noindex page" : "NOT configured"})`, !canon);
  rec(`${id} social metadata includes OG title/description/site + Twitter card`, ["og:title", "og:description", "og:site_name"].every((k) => h.includes(`property="${k}"`)) && h.includes('name="twitter:card"'));
  if (SITE.origin && r.indexable) rec(`${id} social preview image is configured`, h.includes(`${SITE.origin}/og/e-pulse-social.png`) && h.includes('name="twitter:image"'));
  const body = h.slice(h.indexOf('<div id="root">'));
  const heads = [...body.matchAll(/<h([1-6])[\s>][\s\S]*?<\/h\1>/g)].map((m) => Number(m[1]));
  rec(`${id} exactly one <h1>`, heads.filter((x) => x === 1).length === 1);
  rec(`${id} heading levels never skip downward (${heads.join("")})`, heads.every((x, i) => i === 0 || x <= heads[i - 1] + 1));
  rec(`${id} landmarks: header, nav, main, footer; skip link`, ["<header", "<nav", "<main", "<footer", 'class="pub-skip"'].every((t) => body.includes(t)));
  rec(`${id} every <img> has alt (${(body.match(/<img/g) || []).length} images)`, [...body.matchAll(/<img\b[^>]*>/g)].every((m) => /\salt="/.test(m[0])));
  rec(`${id} crawlable text content (> 400 chars) and no private URLs as sitemap-style hrefs to dashboards`, strip(body).length > 400 && !/href="\/dashboard/.test(body));
  const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  rec(`${id} JSON-LD valid and appropriate to page`, SITE.origin && r.indexable ? ld.some((x) => x["@type"] === "WebPage") && (r.path !== "/" || ld.some((x) => x["@type"] === "SoftwareApplication")) && (r.path !== "/faq" || ld.some((x) => x["@type"] === "FAQPage")) : ld.length === 0);
  const hrefs = [...body.matchAll(/<a [^>]*href="(\/[^"#]*)/g)].map((m) => m[1]);
  rec(`${id} internal links resolve to a public route or a known private entry point`, hrefs.every((x) => x === "" || PUBLIC_ROUTES.some((p) => p.path === x) || ["/login", "/admin/login"].includes(x)), hrefs.filter((x) => !(PUBLIC_ROUTES.some((p) => p.path === x) || ["/login", "/admin/login", ""].includes(x))).join());
}
rec("titles unique", titles.size === PUBLIC_ROUTES.length); rec("descriptions unique", descs.size === PUBLIC_ROUTES.length);
const robots = fs.readFileSync(path.join(dist, "robots.txt"), "utf8");
rec("robots.txt allows crawlers to see noindex directives and blocks API endpoints", PRIVATE_PREFIXES.every((p) => !robots.includes(`Disallow: ${p}`)) && robots.includes("Disallow: /api/"));
const smPath = path.join(dist, "sitemap.xml");
if (SITE.origin) { const sm = fs.readFileSync(smPath, "utf8"); const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  rec("sitemap.xml lists exactly the indexable public routes", locs.join() === PUBLIC_ROUTES.filter((r) => r.indexable).map((r) => `${SITE.origin}${r.path}`).join());
  rec("sitemap excludes every private prefix", !locs.some((l) => isPrivatePath(new URL(l).pathname))); rec("robots.txt references the sitemap", robots.includes(`Sitemap: ${SITE.origin}/sitemap.xml`)); }
else rec("no sitemap generated without VITE_SITE_URL (domain never invented)", !fs.existsSync(smPath));
const shell = fs.readFileSync(path.join(dist, "app-shell.html"), "utf8"); rec("app shell (private routes) is noindex,nofollow with an empty root", /noindex,nofollow/.test(shell) && shell.includes('<div id="root"></div>'));
const notFound = fs.readFileSync(path.join(dist, "404.html"), "utf8"); rec("404.html has noindex and a rendered not-found page", /noindex,nofollow/.test(notFound) && /Page not found/.test(notFound));
rec("social preview image exists", fs.existsSync(path.join(dist, "og", "e-pulse-social.png")));
const bad = res.filter((x) => !x.ok); console.log(`\n${res.length - bad.length}/${res.length} checks passed${SITE.origin ? "" : " (VITE_SITE_URL not set: canonical/JSON-LD/sitemap checks reflect the unset state)"}`); process.exit(bad.length ? 1 : 0);
