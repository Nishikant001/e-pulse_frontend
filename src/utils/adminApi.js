import { API_BASE_URL } from "./authFetch";

/**
 * Client for the Admin portal API (/api/admin/*).
 *
 * Deliberately NOT authFetch: authFetch belongs to the Distributor session (it refreshes Distributor tokens and
 * redirects to the Distributor /login). The Admin session is a separate httpOnly cookie; on 401 we only report it.
 * No token, password or identity is ever stored in the browser by this client.
 */
export class AdminApiError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = extra.code; // machine-readable (e.g. INVALID_TRANSITION, CREDIT_LIMIT_EXCEEDED, VALIDATION_FAILED)
    this.details = extra.details; // e.g. per-line validation errors from the order preview
    this.correlationId = extra.correlationId || null; // Phase 17: quote this to support — it finds the server log, job and audit rows of the failed request
  }
}

export async function adminRequest(path, { method = "GET", body, signal } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE_URL}/admin${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") throw err;
    throw new AdminApiError(0, "Unable to reach the server");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    // Phase 17 standard envelope { success:false, error:{ code, message, correlationId } }; the flat keys remain for older responses.
    const e = data?.error && typeof data.error === "object" ? data.error : {};
    const correlationId = e.correlationId || data?.correlationId || (typeof res.headers?.get === "function" ? res.headers.get("x-correlation-id") : null) || null;
    throw new AdminApiError(res.status, e.message || data?.message || `Request failed (${res.status})`, { code: e.code || data?.code, details: e.details || data?.details, correlationId });
  }
  return data;
}
