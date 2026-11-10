import { adminRequest } from "../../../utils/adminApi";

// Empty filter values are never sent. All filtering, searching, sorting and pagination happen on the server —
// same convention as features/inventory/api/inventoryApi.js and features/adminSales/api/*.
const toQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

const get = (path, params, signal) => adminRequest(`${path}${toQuery(params)}`, { signal });
const post = (path, body) => adminRequest(path, { method: "POST", body });
const put = (path, body) => adminRequest(path, { method: "PUT", body });

/**
 * Admin Masters client (/api/admin/masters/*): Product, Batch, Pricing and Tax (HSN) masters, cross-distributor.
 * Reads are always allowed; writes act on the distributor named at create time, or the record's own owning
 * distributor for edits/status changes (resolved server-side — see admin.masters.controller.js).
 */
export const mastersApi = {
  lookups: (distributorId, signal) => get("/masters/lookups", { distributorId }, signal),

  products: {
    list: (params, signal) => get("/masters/products", params, signal),
    detail: (id, signal) => get(`/masters/products/${encodeURIComponent(id)}`, {}, signal),
    create: (body) => post("/masters/products", body),
    update: (id, body) => put(`/masters/products/${encodeURIComponent(id)}`, body),
    deactivate: (id) => post(`/masters/products/${encodeURIComponent(id)}/deactivate`),
    reactivate: (id) => post(`/masters/products/${encodeURIComponent(id)}/reactivate`),
  },

  batches: {
    list: (params, signal) => get("/masters/batches", params, signal),
    detail: (id, signal) => get(`/masters/batches/${encodeURIComponent(id)}`, {}, signal),
    create: (body) => post("/masters/batches", body),
    update: (id, body) => put(`/masters/batches/${encodeURIComponent(id)}`, body),
    deactivate: (id) => post(`/masters/batches/${encodeURIComponent(id)}/deactivate`),
    reactivate: (id) => post(`/masters/batches/${encodeURIComponent(id)}/reactivate`),
  },

  pricing: {
    list: (params, signal) => get("/masters/pricing", params, signal),
    detail: (id, signal) => get(`/masters/pricing/${encodeURIComponent(id)}`, {}, signal),
    create: (body) => post("/masters/pricing", body),
    update: (id, body) => put(`/masters/pricing/${encodeURIComponent(id)}`, body),
    deactivate: (id) => post(`/masters/pricing/${encodeURIComponent(id)}/deactivate`),
  },

  customerGroups: {
    list: (params, signal) => get("/masters/customer-groups", params, signal),
    detail: (id, signal) => get(`/masters/customer-groups/${encodeURIComponent(id)}`, {}, signal),
    create: (body) => post("/masters/customer-groups", body),
    update: (id, body) => put(`/masters/customer-groups/${encodeURIComponent(id)}`, body),
  },

  taxes: {
    list: (params, signal) => get("/masters/taxes", params, signal),
    detail: (id, signal) => get(`/masters/taxes/${encodeURIComponent(id)}`, {}, signal),
    create: (body) => post("/masters/taxes", body),
    update: (id, body) => put(`/masters/taxes/${encodeURIComponent(id)}`, body),
  },
};
