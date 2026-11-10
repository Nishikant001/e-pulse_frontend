import { adminRequest } from "../../../utils/adminApi";
import { authFetch } from "../../../utils/authFetch";

// Empty filter values are never sent. All filtering, searching, sorting and pagination happen on the server.
export const toQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

const reads = (get) => ({
  lookups: (signal) => get("/inventory/lookups", signal),
  summary: (params, signal) => get(`/inventory/summary${toQuery(params)}`, signal),
  current: (params, signal) => get(`/inventory/current${toQuery(params)}`, signal),
  batches: (params, signal) => get(`/inventory/batches${toQuery(params)}`, signal),
  batchDetail: (id, signal) => get(`/inventory/batches/${encodeURIComponent(id)}`, signal),
  ledger: (params, signal) => get(`/inventory/ledger${toQuery(params)}`, signal),
  movement: (params, signal) => get(`/inventory/movement${toQuery(params)}`, signal),
  transfers: (params, signal) => get(`/inventory/transfers${toQuery(params)}`, signal),
  // Phase 6 — FEFO & Expiry Management
  expirySummary: (params, signal) => get(`/inventory/expiry-summary${toQuery(params)}`, signal),
  fefoPreview: (params, signal) => get(`/inventory/fefo-preview${toQuery(params)}`, signal),
});

/** Admin portal client (/api/admin/inventory/*): read-only, across distributors, Admin cookie session. */
export const adminInventoryApi = {
  mode: "live",
  canWrite: false,
  ...reads((path, signal) => adminRequest(path, { signal })),
  changeSaleability: () => Promise.reject(new Error("Stock changes are made from the Distributor portal.")),
  createTransfer: () => Promise.reject(new Error("Stock transfers are made from the Distributor portal.")),
};

/** Distributor portal client (/api/inventory/*): the server scopes every call to the signed-in distributor. */
export const distributorInventoryApi = {
  mode: "live",
  canWrite: true,
  ...reads((path, signal) => authFetch(path, { signal })),
  changeSaleability: (body) => authFetch("/inventory/non-saleable", { method: "POST", body: JSON.stringify(body) }),
  // Phase 6 — foundation transfer endpoint built in Phase 5; this is its first UI (a single immediate transfer, no
  // approval / in-transit workflow — see docs, known limitations).
  createTransfer: (body) => authFetch("/inventory/transfers", { method: "POST", body: JSON.stringify(body) }),
};
