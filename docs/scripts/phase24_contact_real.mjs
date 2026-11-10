import { chromium } from "playwright-core"; import { spawn } from "node:child_process";
const srv = spawn("node", ["/home/claude/p24/serve.mjs"], { env: { ...process.env, DIST: "/home/claude/p24/fe/dist" }, stdio: "ignore" }); await new Promise(r=>setTimeout(r,1200));
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] }); const page = await b.newPage();
let st=[]; page.on("response",r=>{ if(r.url().includes("/api/public/contact")) st.push(r.status()); });
await page.goto("http://localhost:4173/contact",{waitUntil:"networkidle"});
await page.fill("#c-name","Asha Rao"); await page.fill("#c-email","asha@company.com"); await page.fill("#c-message","We would like a demo for two warehouses."); await page.check("#c-consent");
await page.getByRole("button",{name:"Send message"}).click(); await page.waitForTimeout(1000);
const t = await page.locator("main").innerText(); console.log("status",st, "nothing-sent:", /nothing was sent/.test(t), "claims received:", /received/.test(t)); await b.close(); srv.kill();
