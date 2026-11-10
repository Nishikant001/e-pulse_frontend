import { adminRequest } from "../../../utils/adminApi";

// Empty filter values are never sent. Filtering, search, sort and pagination all happen on the server.
const toQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

/** Admin Distributor Management client (/api/admin/distributors/*). Admin session cookie only — see utils/adminApi.js. */
export const distributorsApi = {
  lookups: (signal) => adminRequest("/distributors/lookups", { signal }),
  list: (params, signal) => adminRequest(`/distributors${toQuery(params)}`, { signal }),
  detail: (id, signal) => adminRequest(`/distributors/${encodeURIComponent(id)}`, { signal }),
  retailers: (id, params, signal) => adminRequest(`/distributors/${encodeURIComponent(id)}/retailers${toQuery(params)}`, { signal }),
  create: (body) => adminRequest("/distributors", { method: "POST", body }),
  update: (id, body) => adminRequest(`/distributors/${encodeURIComponent(id)}`, { method: "PUT", body }),
  setStatus: (id, body) => adminRequest(`/distributors/${encodeURIComponent(id)}/status`, { method: "POST", body }),
};
