import { adminRequest } from "../../../utils/adminApi";

// Live Sales API client (GET/POST /api/admin/sales/*). Filtering, searching, sorting and pagination all happen on the
// server: the browser only ever receives one page of rows. Empty filter values are never sent.
export const toQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const liveSalesApi = {
  mode: "live",
  filters: (signal) => adminRequest("/sales/lookups/filters", { signal }),
  retailers: (params, signal) => adminRequest(`/sales/lookups/retailers${toQuery(params)}`, { signal }).then((r) => r.items),
  products: (params, signal) => adminRequest(`/sales/lookups/products${toQuery(params)}`, { signal }).then((r) => r.items),
  batches: (params, signal) => adminRequest(`/sales/lookups/batches${toQuery(params)}`, { signal }).then((r) => r.items),

  listOrders: (params, signal) => adminRequest(`/sales/orders${toQuery(params)}`, { signal }),
  getOrder: (id, signal) => adminRequest(`/sales/orders/${id}`, { signal }),
  previewOrder: (body, signal) => adminRequest("/sales/orders/preview", { method: "POST", body, signal }),
  createOrder: (body) => adminRequest("/sales/orders", { method: "POST", body }),
  updateOrder: (id, body) => adminRequest(`/sales/orders/${id}`, { method: "PUT", body }),
  confirmOrder: (id) => adminRequest(`/sales/orders/${id}/confirm`, { method: "POST" }),
  cancelOrder: (id) => adminRequest(`/sales/orders/${id}/cancel`, { method: "POST" }),
  createInvoice: (id, body = {}) => adminRequest(`/sales/orders/${id}/create-invoice`, { method: "POST", body }),

  listInvoices: (params, signal) => adminRequest(`/sales/invoices${toQuery(params)}`, { signal }),
  getInvoice: (id, signal) => adminRequest(`/sales/invoices/${id}`, { signal }),
  postInvoice: (id) => adminRequest(`/sales/invoices/${id}/post`, { method: "POST" }),
  cancelInvoice: (id) => adminRequest(`/sales/invoices/${id}/cancel`, { method: "POST" }),

  secondarySummary: (params, signal) => adminRequest(`/sales/secondary/summary${toQuery(params)}`, { signal }),
  listSecondary: (params, signal) => adminRequest(`/sales/secondary${toQuery(params)}`, { signal }),
  getSecondary: (key, signal) => adminRequest(`/sales/secondary/${key}`, { signal }),
};
