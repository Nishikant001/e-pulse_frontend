// API base URL is configured centrally in src/config/api.js (VITE_API_BASE_URL). Re-exported for existing imports.
import { API_BASE_URL } from "../config/api";
export { API_BASE_URL };

/**
 * authFetch
 * - access token expire → refresh token
 * - original request retry (only once)
 */
export async function authFetch(endpoint, options = {}, retry = true) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include", // 🍪 cookie
      headers: {
        ...(options.isFormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      },
    });

    // 🔁 Access token expired
    if (response.status === 401 && retry) {
      console.warn("Access token expired → refreshing...");

      const refreshResponse = await fetch(
        `${API_BASE_URL}/refresh-token`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      // ❌ Refresh failed → logout
      if (!refreshResponse.ok) {
        console.error("Refresh token invalid");
         alert("⚠️ Your session has expired. Please login again.");
         // clear frontend data
      localStorage.removeItem("user");
        window.location.href = "/login";
        throw new Error("Session expired");
      }

      // 🔁 Retry original request ONCE
      return authFetch(endpoint, options, false);
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      // Backend error payloads use either `message` or `error` depending on
      // which controller/phase wrote them — check both rather than
      // silently falling through to a generic "HTTP 400" and losing the
      // actual business error (e.g. "Only 40 units remain to be delivered").
      const description = err.message || err.error || `HTTP ${response.status}`;
      const httpError = new Error(description);
      httpError.status = response.status;
      httpError.details = err.details;
      throw httpError;
    }

    return response.json();
  } catch (err) {
    console.error("authFetch error:", err);
    throw err;
  }
}
