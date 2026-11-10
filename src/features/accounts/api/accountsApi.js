import { adminRequest } from "../../../utils/adminApi";
import { authFetch } from "../../../utils/authFetch";

/**
 * One UI, two portals (same pattern as claimsApi):
 *   admin       → /api/admin/accounts/*  (Admin cookie, requireAdmin) — full read, can record payments and set credit limits
 *   distributor → /api/accounts/*        (existing Distributor session) — READ-ONLY, own data; the backend has no write endpoint for it
 * The backend derives the tenant from the session; nothing here is trusted for authorization.
 */
export const ACCOUNT_PORTALS = {
  admin: { base: "/admin/accounts", canWrite: true, showDistributor: true },
  distributor: { base: "/dashboard/finance", canWrite: false, showDistributor: false },
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

export function accountsApi(portal) {
  const request = (path, { method = "GET", body, signal } = {}) =>
    portal === "admin"
      ? adminRequest(`/accounts${path}`, { method, body, signal })
      : authFetch(`/accounts${path}`, { method, body: body ? JSON.stringify(body) : undefined, signal });

  const api = {
    lookups: (params, signal) => request(`/lookups${toQuery(params)}`, { signal }),
    summary: (signal) => request("/summary", { signal }),
    outstanding: (params, signal) => request(`/outstanding${toQuery(params)}`, { signal }),
    ageing: (params, signal) => request(`/ageing${toQuery(params)}`, { signal }),
    ledger: (params, signal) => request(`/ledger${toQuery(params)}`, { signal }),
    credit: (params, signal) => request(`/credit${toQuery(params)}`, { signal }),
    payments: (params, signal) => request(`/payments${toQuery(params)}`, { signal }),
  };
  if (portal === "admin") {
    api.openInvoices = (retailerId, signal) => request(`/open-invoices${toQuery({ retailerId })}`, { signal });
    api.createPayment = (body) => request("/payments", { method: "POST", body });
    api.updateCredit = (entityId, body) => request(`/credit/${enc(entityId)}`, { method: "PUT", body });
  }
  return api;
}

// Display metadata shared by the screens
export const BUCKET_LABEL = { NOT_DUE: "Current / Not due", D1_30: "1–30 days", D31_60: "31–60 days", D61_90: "61–90 days", D91_180: "91–180 days", D180_PLUS: "180+ days" };
export const BUCKET_TONE = { NOT_DUE: "bg-success-50 text-success-700", D1_30: "bg-warning-50 text-warning-700", D31_60: "bg-warning-50 text-warning-700", D61_90: "bg-error-50 text-error-700", D91_180: "bg-error-50 text-error-700", D180_PLUS: "bg-error-100 text-error-700" };
export const MODE_LABEL = { CASH: "Cash", BANK_TRANSFER: "Bank transfer", UPI: "UPI", CHEQUE: "Cheque", OTHER: "Other" };
