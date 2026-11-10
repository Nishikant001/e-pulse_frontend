import { adminRequest } from "../../../utils/adminApi";
import { authFetch } from "../../../utils/authFetch";

/**
 * One UI, two portals. The portal decides WHICH backend and WHICH session is used:
 *   admin       → /api/admin/retailers/*  (Admin cookie, requireAdmin)
 *   distributor → /api/retailers/*        (existing Distributor session, authMiddleware)
 * The backend derives ownership from the session; nothing here is trusted for authorization.
 * Note there is intentionally no `assign` for the distributor portal — that endpoint does not exist for it.
 */
export const RETAILER_PORTALS = {
  // Phase 2: the Admin UI for these records is "Customer Master" (/admin/masters/customers). Same Customer table, same /api/admin/retailers API;
  // only the route and the visible wording changed. /admin/retailers* is no longer routed.
  admin: { base: "/admin/masters/customers", homeLabel: "Customers", noun: "customer", canAssign: true, showDistributor: true },
  // e-Pulse Phase 1: the Distributor portal calls these records "Customers" too (/dashboard/customers). The backend API (/api/retailers) and table are unchanged.
  distributor: { base: "/dashboard/customers", homeLabel: "Customers", noun: "customer", canAssign: false, showDistributor: false },
};

const toQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
/** Visible wording for a portal: { noun: "customer", Noun: "Customer", nouns: "customers", Nouns: "Customers" }. */
export function retailerLabels(portal) {
  const noun = (RETAILER_PORTALS[portal] || RETAILER_PORTALS.distributor).noun;
  return { noun, Noun: cap(noun), nouns: `${noun}s`, Nouns: `${cap(noun)}s` };
}

export function retailersApi(portal) {
  const request = (path, { method = "GET", body, signal } = {}) =>
    portal === "admin"
      ? adminRequest(`/retailers${path}`, { method, body, signal })
      : authFetch(`/retailers${path}`, { method, body: body ? JSON.stringify(body) : undefined, signal });

  const api = {
    lookups: (signal) => request("/lookups", { signal }),
    list: (params, signal) => request(toQuery(params), { signal }),
    detail: (id, signal) => request(`/${encodeURIComponent(id)}`, { signal }),
    create: (body) => request("", { method: "POST", body }),
    update: (id, body) => request(`/${encodeURIComponent(id)}`, { method: "PUT", body }),
    setStatus: (id, body) => request(`/${encodeURIComponent(id)}/status`, { method: "POST", body }),
  };
  api.noun = retailerLabels(portal).noun; // lets shared dialogs use the portal's wording
  if (portal === "admin") api.assign = (id, body) => request(`/${encodeURIComponent(id)}/assign`, { method: "POST", body });
  return api;
}
