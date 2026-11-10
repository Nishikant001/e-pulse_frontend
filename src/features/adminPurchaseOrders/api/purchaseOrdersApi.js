import { adminRequest } from "../../../utils/adminApi";

/** Admin (tenant admin) side of distributors' purchase orders: read (GET /api/admin/purchase-orders[/:id|/lookups]) and fulfil — deliver (posts the distributor's stock-in) and invoice. */
const toQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const adminPurchaseOrdersApi = {
  lookups: (signal) => adminRequest("/purchase-orders/lookups", { signal }),
  list: (params, signal) => adminRequest(`/purchase-orders${toQuery(params)}`, { signal }),
  get: (id, signal) => adminRequest(`/purchase-orders/${encodeURIComponent(id)}`, { signal }),
  deliver: (id, body) => adminRequest(`/purchase-orders/${encodeURIComponent(id)}/deliveries`, { method: "POST", body }),
  invoice: (id, deliveryId, body = {}) => adminRequest(`/purchase-orders/${encodeURIComponent(id)}/deliveries/${encodeURIComponent(deliveryId)}/invoice`, { method: "POST", body }),
};
