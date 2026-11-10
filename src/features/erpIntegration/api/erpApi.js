import { adminRequest } from "../../../utils/adminApi";

// Admin-only client (/api/admin/erp-integrations/* and /api/admin/erp-sync/*). No credential, token or header value is ever
// sent to or read from here: a connection only carries a credential REFERENCE name; the secret itself lives on the server.
// The tenant is resolved server-side from the admin session — it is never sent from the browser.
const enc = encodeURIComponent;
const toQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && v !== "" && sp.set(k, String(v)));
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const erpApi = {
  readiness: (signal) => adminRequest("/erp-integrations/health/readiness", { signal }),
  lookups: (signal) => adminRequest("/erp-integrations/lookups", { signal }),
  list: (params, signal) => adminRequest(`/erp-integrations${toQuery(params)}`, { signal }),
  detail: (id, signal) => adminRequest(`/erp-integrations/${enc(id)}`, { signal }),
  create: (body) => adminRequest("/erp-integrations", { method: "POST", body }),
  update: (id, body) => adminRequest(`/erp-integrations/${enc(id)}`, { method: "PUT", body }),
  setStatus: (id, status, clearDefault = false) => adminRequest(`/erp-integrations/${enc(id)}/status`, { method: "PATCH", body: { status, clearDefault } }),
  setDefault: (id) => adminRequest(`/erp-integrations/${enc(id)}/default`, { method: "PATCH", body: {} }),
  test: (id) => adminRequest(`/erp-integrations/${enc(id)}/test`, { method: "POST", body: {} }),
  // mappings (per connection + capability)
  getMappings: (id, capability, signal) => adminRequest(`/erp-integrations/${enc(id)}/mappings/${enc(capability)}`, { signal }),
  // schedules (Phase 15): one per connection + capability; PUT creates / updates / disables (enabled:false)
  saveSchedule: (id, capability, body) => adminRequest(`/erp-integrations/${enc(id)}/schedules/${enc(capability)}`, { method: "PUT", body }),
  // code mappings (Phase 16): ERP code → DMS value, per connection
  codeMappings: (id, params, signal) => adminRequest(`/erp-integrations/${enc(id)}/code-mappings${toQuery(params)}`, { signal }),
  saveCodeMapping: (id, body) => adminRequest(`/erp-integrations/${enc(id)}/code-mappings`, { method: "PUT", body }),
  deleteCodeMapping: (id, mappingId) => adminRequest(`/erp-integrations/${enc(id)}/code-mappings/${enc(mappingId)}`, { method: "DELETE" }),
  saveMappings: (id, capability, mappings) => adminRequest(`/erp-integrations/${enc(id)}/mappings/${enc(capability)}`, { method: "PUT", body: { mappings } }),
};

export const erpSyncApi = {
  summary: (signal) => adminRequest("/erp-sync/summary", { signal }),
  jobs: (params, signal) => adminRequest(`/erp-sync/jobs${toQuery(params)}`, { signal }),
  job: (id, signal) => adminRequest(`/erp-sync/jobs/${enc(id)}`, { signal }),
  jobErrors: (id, params, signal) => adminRequest(`/erp-sync/jobs/${enc(id)}/errors${toQuery(params)}`, { signal }),
  start: (body) => adminRequest("/erp-sync/jobs", { method: "POST", body }),
  errors: (params, signal) => adminRequest(`/erp-sync/errors${toQuery(params)}`, { signal }),
  schedules: (params, signal) => adminRequest(`/erp-sync/schedules${toQuery(params)}`, { signal }),
  runSchedule: (id) => adminRequest(`/erp-sync/schedules/${enc(id)}/run`, { method: "POST", body: {} }),
  audit: (params, signal) => adminRequest(`/erp-sync/audit${toQuery(params)}`, { signal }),
  alerts: (signal) => adminRequest("/erp-sync/alerts", { signal }),
  outbound: (params, signal) => adminRequest(`/erp-sync/outbound${toQuery(params)}`, { signal }),
  sendOutbound: (body) => adminRequest("/erp-sync/outbound", { method: "POST", body }),
  retry: (id) => adminRequest(`/erp-sync/jobs/${enc(id)}/retry`, { method: "POST", body: {} }),
};

// Phase 18 — business-capability overview / monitoring and reconciliation. Comparing is READ-ONLY: no DMS record, stock movement or accounting entry is changed.
export const erpBusinessApi = {
  overview: (signal) => adminRequest("/erp-sync/business/overview", { signal }),
  reconciliations: (params, signal) => adminRequest(`/erp-sync/reconciliation${toQuery(params)}`, { signal }),
  reconcile: (body) => adminRequest("/erp-sync/reconciliation", { method: "POST", body }),
};
