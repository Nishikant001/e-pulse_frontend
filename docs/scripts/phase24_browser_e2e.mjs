import { chromium } from "playwright-core"; import { spawn } from "node:child_process"; import fs from "node:fs";
const srv = spawn("node", ["/home/claude/p24/serve.mjs"], { env: { ...process.env, DIST: "/home/claude/p24/fe/dist" }, stdio: "ignore" }); await new Promise((r) => setTimeout(r, 1200));
const B = "http://localhost:4173"; const res = []; const rec = (n, ok, d = "") => { res.push({ n, ok, d }); console.log(ok ? "PASS" : "FAIL", n, d); };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage();
page.on("dialog", (d) => d.accept()); const errs = []; page.on("pageerror", (e) => errs.push(String(e))); const bad = []; page.on("request", (r) => { if (/localhost:5000|127\.0\.0\.1:5000/.test(r.url())) bad.push(r.url()); });
const email = `ui${Date.now()}@example.com`; const pw = "Passw0rd!x1";
// signup through the real API (UI signup form has many required fields), then the REAL UI login
let r = await page.request.post(B + "/api/signup", { data: { name: "UI Dist", email, password: pw, city: "Pune", country: "IN", phone_number: "9999999999", tax_no: "22AAAAA0000A1Z5", pan: "AAAAA0000A" } }); rec("signup via same-origin /api proxy", r.status() === 201, String(r.status()));
await page.goto(B + "/login", { waitUntil: "networkidle" });
await page.fill('input[name="email"]', email); await page.fill('input[name="password"]', "wrong-password"); await page.locator("button.bg-teal-500, button.bg-gray-400").first().click(); await page.waitForTimeout(800);
rec("UI login with wrong password stays on /login and shows an error", new URL(page.url()).pathname === "/login" && /fail|invalid|incorrect|credential|password/i.test(await page.locator("body").innerText()));
await page.fill('input[name="password"]', pw); await page.locator("button.bg-teal-500, button.bg-gray-400").first().click(); await page.waitForURL("**/dashboard", { timeout: 8000 }).catch(() => {});
rec("UI login success → /dashboard", new URL(page.url()).pathname === "/dashboard", page.url());
rec("login request went to same-origin /api (no localhost:5000)", bad.length === 0, bad.join(","));
// protected API via the browser session
r = await page.request.get(B + "/api/stock"); rec("protected API with session cookie → 200", r.status() === 200);
// product + Batch Master UI
r = await page.request.post(B + "/api/hsn", { data: { hsn_code: "3004", description: "Medicaments", gst_rate: 12 } }); const hsn = r.ok() ? (await r.json()) : null; const hsnId = hsn?.id || hsn?.hsn?.id || hsn?.data?.id;
r = await page.request.post(B + "/api/product", { data: { name: "Paracetamol 500", material_code: "MAT1", unit: "PCS", hsn_id: hsnId } }); const prodJson = await r.json().catch(() => ({})); const productId = prodJson.id || prodJson.product?.id; rec("product created for the test (existing API)", r.ok() && !!productId, `${r.status()} ${JSON.stringify(prodJson).slice(0, 120)}`);
await page.goto(B + "/dashboard/stock-master", { waitUntil: "networkidle" });
rec("Batch Master page loads (no /batch call)", (await page.locator("h1").first().innerText()) === "Batch Master");
await page.getByRole("button", { name: "New batch" }).click();
await page.getByRole("button", { name: "Create batch" }).click(); rec("create with empty form shows validation errors", (await page.locator('[role="alert"]').count()) >= 2);
await page.selectOption("#bm-product", String(productId)); await page.fill("#bm-batch", "UI-B1"); await page.fill("#bm-mfg", "2026-01-01"); await page.fill("#bm-exp", "2028-01-01"); await page.fill("#bm-pp", "10"); await page.fill("#bm-mrp", "15");
await page.getByRole("button", { name: "Create batch" }).click(); await page.waitForSelector("text=UI-B1");
rec("batch created through /stock and listed", (await page.locator("tbody tr").count()) === 1);
// duplicate → server message shown
await page.getByRole("button", { name: "New batch" }).click(); await page.selectOption("#bm-product", String(productId)); await page.fill("#bm-batch", "UI-B1");
await page.getByRole("button", { name: "Create batch" }).click(); await page.waitForTimeout(800);
rec("duplicate batch → server error shown in dialog", /already exists/i.test(await page.locator('[role="dialog"]').innerText()));
await page.getByRole("button", { name: "Cancel" }).click();
// ledger stock then balance + locked delete
const list = await (await page.request.get(B + "/api/stock")).json(); const bid = list[0].id;
r = await page.request.post(B + "/api/stockLedger/in", { data: { productId, batchId: bid, quantity: 100 } }); await page.request.post(B + "/api/stockLedger/out", { data: { productId, batchId: bid, quantity: 30 } });
await page.getByRole("button", { name: "Refresh" }).click(); await page.waitForTimeout(800);
const row = page.locator("tbody tr").first(); rec("stock on hand = 70 (ledger derived)", /\b70\b/.test(await row.innerText()));
rec("Delete disabled for a batch with movements", await row.getByRole("button", { name: /Delete batch/ }).isDisabled());
await row.getByRole("button", { name: /Edit batch/ }).click(); rec("edit: product and batch number locked, no quantity field", (await page.locator("#bm-product").isDisabled()) && (await page.locator("#bm-batch").isDisabled()) && (await page.locator('input[name="quantity"]').count()) === 0);
await page.fill("#bm-mrp", "20"); await page.getByRole("button", { name: "Save changes" }).click(); await page.waitForTimeout(900);
rec("edit saved (MRP 20.00 shown)", /20\.00/.test(await page.locator("tbody tr").first().innerText()));
// second batch without movements is deletable
await page.getByRole("button", { name: "New batch" }).click(); await page.selectOption("#bm-product", String(productId)); await page.fill("#bm-batch", "UI-B2"); await page.getByRole("button", { name: "Create batch" }).click(); await page.waitForSelector("text=UI-B2");
await page.locator("tr", { hasText: "UI-B2" }).getByRole("button", { name: /Delete batch/ }).click(); await page.getByRole("button", { name: "Delete", exact: true }).last().click(); await page.waitForTimeout(900);
rec("batch without movements deleted", (await page.locator("tr", { hasText: "UI-B2" }).count()) === 0);
// token refresh: drop the access cookie, protected call must succeed through authFetch → /refresh-token
await ctx.clearCookies({ name: "access_token" }); await page.getByRole("button", { name: "Refresh" }).click(); await page.waitForTimeout(1500);
rec("expired access cookie → silent /refresh-token → page data still loads", (await page.locator("tbody tr").count()) >= 1 && !(await page.locator("text=session has expired").count()));
rec("no uncaught page errors", errs.length === 0, errs.slice(0, 2).join("|"));
// cross-tenant: second user cannot see first user's batch through the UI session
const ctx2 = await b.newContext(); const p2 = await ctx2.newPage(); const email2 = `ui2${Date.now()}@example.com`;
await p2.request.post(B + "/api/signup", { data: { name: "UI Dist 2", email: email2, password: pw, city: "Pune", country: "IN", phone_number: "9999999998", tax_no: "22AAAAA0000A1Z6", pan: "AAAAA0000B" } });
await p2.request.post(B + "/api/login", { data: { email: email2, password: pw } }); rec("second distributor sees none of the first's batches", (await (await p2.request.get(B + "/api/stock")).json()).length === 0);
rec("second distributor cannot read first's batch by id", (await p2.request.get(B + `/api/stock/${bid}`)).status() === 404);
await page.goto(B + "/dashboard/logout", { waitUntil: "load" }).catch(() => {}); await page.waitForTimeout(2500); rec("logout then /dashboard → /login", await (async () => { await page.goto(B + "/dashboard", { waitUntil: "networkidle" }); return new URL(page.url()).pathname === "/login"; })());
await b.close(); srv.kill(); fs.writeFileSync("e2e-results.json", JSON.stringify(res, null, 1)); console.log(`${res.filter((x) => x.ok).length}/${res.length} passed`);
