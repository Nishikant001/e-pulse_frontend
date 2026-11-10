// Single source of truth for the backend API base URL (Phase 24).
//   VITE_API_BASE_URL  absolute (https://api.example.com/api) or same-origin path (/api). Baked in at BUILD time — it is public, never put a secret in it.
//   development        unset → http://localhost:5000/api (local backend, as before)
//   production         unset → "/api" (same origin, behind the reverse proxy). A localhost value is refused at build time (vite.config.js).
// No mock/fallback responses live here: this only decides WHERE requests go.
export const DEV_API_BASE_URL = "http://localhost:5000/api";

/** Pure (testable). env = { VITE_API_BASE_URL?, DEV?: boolean }. Throws on a malformed value. */
export function resolveApiBaseUrl(env = {}) {
  const raw = typeof env.VITE_API_BASE_URL === "string" ? env.VITE_API_BASE_URL.trim() : "";
  if (!raw) return env.DEV ? DEV_API_BASE_URL : "/api";
  const v = raw.replace(/\/+$/, "");
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  if (/^https?:\/\/[^\s/]+(\/[^\s]*)?$/i.test(v)) return v;
  throw new Error(`VITE_API_BASE_URL must be an http(s) URL or a path starting with "/" (got a different shape)`);
}

const E = import.meta.env || {}; // import.meta.env is undefined under plain Node (unit tests)
export const API_BASE_URL = resolveApiBaseUrl({ VITE_API_BASE_URL: E.VITE_API_BASE_URL, DEV: E.DEV });
