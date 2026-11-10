// Phase 23 browser/a11y/SEO regression script. NOT part of the app build. Needs: npm i --no-save playwright-core axe-core; set CHROME=<chromium path>; run `npm run build` first (VITE_SITE_URL=https://example.test for the sitemap check). Serves ./dist on :4173 with an nginx-style fallback.
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
import { chromium } from "playwright-core";
const DIST = path.resolve(process.env.DIST || "dist"); const OUT = path.resolve("shots"); fs.mkdirSync(OUT, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain" };
const srv = http.createServer((q, s) => {
  let p = decodeURIComponent(q.url.split("?")[0]); let f = path.join(DIST, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) f = path.join(DIST, "app-shell.html"); // nginx try_files fallback
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(s);
}).listen(4173);
const exe = process.env.CHROME;
const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const axeSrc = fs.readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const B = "http://localhost:4173"; const res = []; const rec = (n, ok, d = "") => { res.push({ n, ok, d }); console.log(ok ? "PASS" : "FAIL", n, d); };
const routes = ["/", "/features", "/modules", "/solutions", "/about", "/faq", "/contact", "/privacy", "/terms"];
const titles = new Set();
for (const w of [375, 768, 1280, 1536]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } }); const page = await ctx.newPage();
  const errs = []; let cur=""; page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errs.push(cur+" "+m.text().slice(0,60)); }); page.on("pageerror", (e) => errs.push(String(e)));
  page.on("requestfailed", (r) => { if (!/localhost:5000/.test(r.url())) errs.push("reqfail " + r.url()); });
  for (const r of routes) {
    cur=r; await page.goto(B + r, { waitUntil: "networkidle" });
    const h1 = await page.locator("h1").count(); const url = new URL(page.url()).pathname;
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    const title = await page.title(); if (w === 1280) titles.add(title);
    rec(`[${w}] ${r} renders, one h1, no redirect, no h-scroll`, h1 === 1 && url === r && !overflow, `h1=${h1} url=${url} overflow=${overflow}`);
    if (r === "/" || r === "/modules" || r === "/contact") await page.screenshot({ path: `${OUT}/${w}${r === "/" ? "-home" : r.replace("/", "-")}.png`, fullPage: true });
    if (w === 375 || w === 1280) {
      cur=r+"(axe)"; await page.evaluate(axeSrc); const a = await page.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"] })).violations.map((v) => `${v.id}(${v.nodes.length})`));
      rec(`[${w}] ${r} axe wcag2a/aa`, a.length === 0, a.join(","));
    }
  }
  rec(`[${w}] no console errors/hydration warnings on public routes`, errs.length === 0, errs.slice(0, 6).join(" | "));
  await ctx.close();
}
rec("unique <title> per public page", titles.size === routes.length, `${titles.size}`);
// access boundaries + login regression (desktop)
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
  await page.goto(B + "/dashboard", { waitUntil: "networkidle" }); rec("/dashboard without session → /login", new URL(page.url()).pathname === "/login", page.url());
  await page.goto(B + "/dashboard/inventory/current", { waitUntil: "networkidle" }); rec("deep link /dashboard/inventory/current without session → /login", new URL(page.url()).pathname === "/login");
  await page.route("**/api/admin/session", (r) => r.fulfill({ json: { authenticated: false }, headers: { "access-control-allow-origin": "http://localhost:4173", "access-control-allow-credentials": "true" } }));
  await page.goto(B + "/admin/dashboard", { waitUntil: "networkidle" }); await page.waitForTimeout(500); const ap = new URL(page.url()).pathname; rec("/admin/dashboard without session → admin login", ap === "/admin/login", ap);
  await page.goto(B + "/login", { waitUntil: "networkidle" }); await page.locator('input[name="email"]').waitFor(); rec("existing login page renders (email+password+submit)", (await page.locator('input[name="email"]').count()) === 1 && (await page.locator('input[name="password"]').count()) === 1 && (await page.locator('button').count()) >= 1);
  await page.goto(B + "/", { waitUntil: "networkidle" }); await page.getByRole("link", { name: "Sign in", exact: true }).first().click(); await page.waitForURL("**/login"); rec("home 'Sign in' → /login without reload errors", true);
  await page.goto(B + "/robots.txt"); const rb = await page.textContent("body"); rec("robots.txt served, disallows /dashboard /admin", /Disallow: \/dashboard/.test(rb) && /Disallow: \/admin/.test(rb));
  await page.goto(B + "/sitemap.xml"); const sm = await page.content(); rec("sitemap.xml has no private URLs", !/dashboard|admin|login/.test(sm) && /example\.test/.test(sm));
  await page.goto(B + "/no-such-page", { waitUntil: "networkidle" }); rec("unknown URL → public 404 page (h1 'Page not found')", (await page.locator("h1").textContent()) === "Page not found");
  // contact form
  await page.goto(B + "/contact", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Send message" }).click(); rec("contact: empty submit shows error summary + field errors", (await page.locator('[role="alert"] li').count()) === 4 && (await page.locator("#c-name").getAttribute("aria-invalid")) === "true");
  rec("contact: focus moves to error summary", await page.evaluate(() => document.activeElement?.getAttribute("role") === "alert"));
  await page.fill("#c-name", "Asha Rao"); await page.fill("#c-email", "asha@company.com"); await page.fill("#c-message", "We would like a demo for two warehouses."); await page.check("#c-consent");
  await page.getByRole("button", { name: "Send message" }).click(); await page.waitForTimeout(800); const t = await page.locator("main").innerText();
  rec("contact: no working endpoint (static server answers HTML 200) does NOT claim success", /nothing was sent|could not be sent/.test(t) && !/received/.test(t));
  // mobile menu
  const m = await browser.newContext({ viewport: { width: 375, height: 800 } }); const mp = await m.newPage(); await mp.goto(B + "/", { waitUntil: "networkidle" });
  const btn = mp.getByRole("button", { name: "Open menu" }); rec("mobile menu closed: links not focusable (inert)", await mp.evaluate(() => document.getElementById("mobile-menu").inert === true));
  await btn.click(); rec("mobile menu opens, aria-expanded=true", (await mp.getByRole("button", { name: "Close menu" }).getAttribute("aria-expanded")) === "true");
  await mp.keyboard.press("Escape"); rec("Escape closes menu and returns focus to toggle", (await mp.getByRole("button", { name: "Open menu" }).getAttribute("aria-expanded")) === "false" && await mp.evaluate(() => document.activeElement?.getAttribute("aria-controls") === "mobile-menu"));
  const tb = await mp.evaluate(() => [...document.querySelectorAll("header a, header button")].filter((e) => e.offsetParent && e.getBoundingClientRect().height < 40).length); rec("touch targets ≥ 40px tall in mobile header", tb === 0, `small=${tb}`);
  // keyboard: skip link
  const kp = await ctx.newPage(); await kp.goto(B + "/features", { waitUntil: "networkidle" }); await kp.keyboard.press("Tab"); rec("first Tab stop is the skip link", (await kp.evaluate(() => document.activeElement.textContent)) === "Skip to main content");
  // reduced motion
  const rm = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1280, height: 800 } }); const rp = await rm.newPage(); await rp.goto(B + "/modules", { waitUntil: "networkidle" });
  const hid = await rp.evaluate(() => [...document.querySelectorAll(".pub-reveal")].filter((e) => getComputedStyle(e).opacity !== "1").length); rec("reduced-motion: no content hidden by animation", hid === 0, `hidden=${hid}`);
  // no-JS content
  const nj = await browser.newContext({ javaScriptEnabled: false }); const np = await nj.newPage(); await np.goto(B + "/modules"); rec("JS disabled: prerendered content present (crawler view)", /ERP \/ SAP integration/.test(await np.locator("main").innerText()) && (await np.locator("h1").count()) === 1);
  // scroll reveal eventually shows everything
  await page.goto(B + "/", { waitUntil: "networkidle" }); await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
  await page.waitForTimeout(3500); const hid2 = await page.evaluate(() => [...document.querySelectorAll(".pub-reveal:not(.pub-reveal-in)")].length); rec("scroll reveal: everything revealed after scrolling", hid2 === 0, `left=${hid2}`);
}
await browser.close(); srv.close();
fs.writeFileSync("results.json", JSON.stringify(res, null, 1)); console.log(`\n${res.filter((r) => r.ok).length}/${res.length} passed`);
