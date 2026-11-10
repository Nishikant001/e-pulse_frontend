import { authFetch } from "../../../utils/authFetch";

/** e-Pulse Phase 1 — Distributor Reports. READ ONLY: this client only ever issues GET (backend: GET /api/reports/:section, scoped by the session). */
export const REPORT_SECTIONS = [
  { id: "sales", label: "Sales" },
  { id: "stock", label: "Stock" },
  { id: "expiry", label: "Expiry" },
  { id: "distributor", label: "Distributor" },
  { id: "customers", label: "Customers" },
  { id: "scheme", label: "Scheme" },
  { id: "returns", label: "Returns" },
  { id: "outstanding", label: "Outstanding" },
  { id: "sap-sync", label: "SAP Sync" },
];

// Per-section filters shown above the table (all optional, all sent as query params).
export const REPORT_FILTERS = {
  sales: ["from", "to", "status"],
  returns: ["from", "to"],
  customers: ["q", "status"],
  scheme: ["status"],
  "sap-sync": ["status"],
  stock: ["q"],
  expiry: ["q"],
};
export const STATUS_OPTIONS = {
  sales: ["DRAFT", "POSTED", "PARTIALLY_PAID", "PAID", "CANCELLED"],
  customers: ["active", "inactive", "pending"],
  scheme: ["active", "inactive"],
  "sap-sync": ["PENDING", "SYNCED", "FAILED"],
};

const toQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const reportsApi = {
  run: (section, params, signal) => authFetch(`/reports/${encodeURIComponent(section)}${toQuery(params)}`, { signal }),
};
