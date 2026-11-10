import test from "node:test"; import assert from "node:assert/strict"; import fs from "node:fs"; import path from "node:path";
import { resolveApiBaseUrl, DEV_API_BASE_URL } from "./api.js";

test("dev default is the local backend; production default is same-origin /api", () => {
  assert.equal(resolveApiBaseUrl({ DEV: true }), DEV_API_BASE_URL);
  assert.equal(resolveApiBaseUrl({ DEV: false }), "/api");
  assert.equal(resolveApiBaseUrl({}), "/api");
});
test("explicit values are normalised (trailing slashes removed) and win over defaults", () => {
  assert.equal(resolveApiBaseUrl({ VITE_API_BASE_URL: "https://api.example.com/api/", DEV: true }), "https://api.example.com/api");
  assert.equal(resolveApiBaseUrl({ VITE_API_BASE_URL: " /api// " }), "/api");
});
test("malformed values are rejected, not guessed", () => {
  for (const bad of ["api.example.com", "ftp://x/api", "//evil.example/api", "https://", "javascript:alert(1)", "http://a b/api"]) assert.throws(() => resolveApiBaseUrl({ VITE_API_BASE_URL: bad }), /VITE_API_BASE_URL/, bad);
});
test("no application source hard-codes a localhost API address (only src/config/api.js may)", () => {
  const hits = []; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(jsx?|mjs)$/.test(e.name) && !/\.test\.mjs$/.test(e.name) && p !== path.join("src", "config", "api.js") && /localhost|127\.0\.0\.1/.test(fs.readFileSync(p, "utf8"))) hits.push(p); } };
  walk("src"); assert.deepEqual(hits, []);
});
test("every network call in the converted files goes through API_BASE_URL", () => {
  for (const f of ["src/components/auth/PortalLoginPage.jsx", "src/components/Distributers/credential/Signup.jsx", "src/components/Distributers/credential/ForgotPassword.jsx", "src/components/Distributers/credential/ResetPassword.jsx"]) {
    const s = fs.readFileSync(f, "utf8"); assert.match(s, /\$\{API_BASE_URL\}\//, f); assert.ok(!/fetch\(\s*["'`]https?:/.test(s), f);
  }
});
