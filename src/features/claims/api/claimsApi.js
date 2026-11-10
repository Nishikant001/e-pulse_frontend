import { adminRequest } from "../../../utils/adminApi";
import { authFetch } from "../../../utils/authFetch";

/**
 * One UI, two portals. The portal decides WHICH backend and WHICH session is used:
 *   admin       → /api/admin/claims/*  (Admin cookie, requireAdmin) — can review / approve / reject / return
 *   distributor → /api/claims/*        (existing Distributor session) — own claims only; no decision endpoints exist
 * The backend derives ownership from the session; nothing here is trusted for authorization.
 */
export const CLAIM_PORTALS = {
  admin: { base: "/admin/claims", canDecide: true, canCreate: false, showDistributor: true },
  distributor: { base: "/dashboard/claims", canDecide: false, canCreate: true, showDistributor: false },
};

const toQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};
const enc = encodeURIComponent;

export function claimsApi(portal) {
  const request = (path, { method = "GET", body, signal } = {}) =>
    portal === "admin"
      ? adminRequest(`/claims${path}`, { method, body, signal })
      : authFetch(`/claims${path}`, { method, body: body ? JSON.stringify(body) : undefined, signal });

  const api = {
    lookups: (signal) => request("/lookups", { signal }),
    list: (params, signal) => request(toQuery(params), { signal }),
    detail: (id, signal) => request(`/${enc(id)}`, { signal }),
  };
  if (portal === "admin") {
    api.review = (id, body) => request(`/${enc(id)}/review`, { method: "POST", body: body || {} });
    api.approve = (id, body) => request(`/${enc(id)}/approve`, { method: "POST", body: body || {} });
    api.reject = (id, body) => request(`/${enc(id)}/reject`, { method: "POST", body });
    api.settle = (id) => request(`/${enc(id)}/settle`, { method: "POST", body: {} }); // Phase 12: only for claims approved before accounting existed
    api.needsCorrection = (id, body) => request(`/${enc(id)}/needs-correction`, { method: "POST", body });
  } else {
    api.invoiceLines = (invoiceId, schemeId, signal) => request(`/invoices/${enc(invoiceId)}/lines${toQuery({ schemeId })}`, { signal });
    api.create = (body) => request("", { method: "POST", body });
    api.update = (id, body) => request(`/${enc(id)}`, { method: "PUT", body });
    api.submit = (id) => request(`/${enc(id)}/submit`, { method: "POST", body: {} });
    api.resubmit = (id) => request(`/${enc(id)}/resubmit`, { method: "POST", body: {} });
  }
  return api;
}
