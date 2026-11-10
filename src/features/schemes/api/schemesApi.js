import { adminRequest } from "../../../utils/adminApi";

// Admin-only client (/api/admin/schemes/*). Distributors have no scheme-management UI or API; the Distributor portal only has
// the read-only /api/schemes/applicable endpoint, which this feature does not use.
const toQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};
const enc = encodeURIComponent;

export const SCHEME_BASE = "/admin/masters/schemes";

export const schemesApi = {
  lookups: (params, signal) => adminRequest(`/schemes/lookups${toQuery(params)}`, { signal }),
  list: (params, signal) => adminRequest(`/schemes${toQuery(params)}`, { signal }),
  detail: (id, signal) => adminRequest(`/schemes/${enc(id)}`, { signal }),
  create: (body) => adminRequest("/schemes", { method: "POST", body }),
  update: (id, body) => adminRequest(`/schemes/${enc(id)}`, { method: "PUT", body }),
  setStatus: (id, status) => adminRequest(`/schemes/${enc(id)}/status`, { method: "POST", body: { status } }),
};
