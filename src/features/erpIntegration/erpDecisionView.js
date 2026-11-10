// Phase 20 — pure view-model for the Business Decision Register panel. No React, no imports, no I/O: it only reshapes what
// GET /api/admin/erp-sync/business/overview returned, so it can be unit-tested with `node --test` (see erpDecisionView.test.mjs).
//
// Honesty rules enforced here (and pinned by the tests):
//   • CONFIGURED is labelled "Configured — not business approval". "Approved" is never produced from a status string.
//   • An unknown status (e.g. a future BUSINESS_APPROVED) is shown as "Unrecognised status" unless the server states that approval tracking is implemented.
//   • Capability readiness is several SEPARATE dimensions (what the DMS can do · production verification · decisions open · why blocked); they are never merged.
//   • Nothing here changes a decision. There is no approve / propose helper.

export const STATUS_META = {
  REQUIRED: { label: "Decision required", tone: "error", short: "Required", help: "The business has not answered this and the system has no way to record an answer yet." },
  CONFIGURED: { label: "Configured — not business approval", tone: "warning", short: "Configured", help: "An administrator set an ownership or direction on an ERP connection. The system cannot confirm the business approved it, and it does not by itself enable anything." },
};
export const UNRECOGNISED_META = { label: "Unrecognised status", tone: "neutral", short: "Unknown", help: "The server returned a status this screen does not know. It is not shown as approved." };

/** Tone + label for a status code. Never returns an "approved" label unless the server says approval tracking is implemented AND the status is exactly BUSINESS_APPROVED. */
export function statusMeta(status, approvalImplemented = false) {
  if (STATUS_META[status]) return STATUS_META[status];
  if (status === "BUSINESS_APPROVED" && approvalImplemented === true) return { label: "Business approved", tone: "success", short: "Approved", help: "Approval evidence is recorded by the system." };
  return UNRECOGNISED_META;
}

export const AREA_ORDER = ["Stock", "Sales", "Invoice", "Return", "Payment", "Pricing", "Documents"];
export const AREA_TITLE = { Stock: "Stock", Sales: "Sales", Invoice: "Invoice", Return: "Return", Payment: "Payment", Pricing: "Pricing", Documents: "Documents" };
export const AREA_GROUP_TITLE = { Payment: "Payment and pricing", Pricing: "Payment and pricing" };

export const CLASSIFICATION_LABEL = { COMPLETE: "Complete (code and mock tests only)", PARTIAL: "Partial", BLOCKED: "Blocked", UNSUPPORTED: "Unsupported" };
export const CLASSIFICATION_TONE = { COMPLETE: "success", PARTIAL: "warning", BLOCKED: "error", UNSUPPORTED: "neutral" };
const LEVELS = ["NOT_CONFIGURED", "CONFIGURED", "MOCK_VERIFIED", "CONNECTION_TESTED", "READ_VERIFIED", "WRITE_VERIFIED", "PRODUCTION_VERIFIED"];

const arr = (x) => (Array.isArray(x) ? x : []);

/** The register object of an overview payload, or null when the payload does not carry a usable one. */
export function registerOf(overview) {
  const r = overview && overview.decisionRegister;
  return r && Array.isArray(r.items) ? r : null;
}
export const approvalImplemented = (overview) => Boolean(registerOf(overview)?.meta?.approvalTracking?.implemented === true);
export const approvalReason = (overview) => registerOf(overview)?.meta?.approvalTracking?.reason
  || "Approval tracking is not implemented: the system cannot record or verify who approved a decision.";

/** Counts by status — computed from the items (not trusted from `summary`), so the numbers on screen always match the rows. */
export function countByStatus(items) {
  const out = { REQUIRED: 0, CONFIGURED: 0, OTHER: 0, total: 0 };
  for (const i of arr(items)) { out.total += 1; if (i.status === "REQUIRED") out.REQUIRED += 1; else if (i.status === "CONFIGURED") out.CONFIGURED += 1; else out.OTHER += 1; }
  return out;
}

/** Filters: capability (matches the question's own capability or any capability it blocks), status, and ERP connection.
 *  A connection filter keeps ownership questions held by that connection AND every tenant-wide question (those apply to all connections and say so). */
export function filterItems(items, { capability = "", status = "", connectionId = "" } = {}) {
  const cid = connectionId === "" || connectionId === null || connectionId === undefined ? null : String(connectionId);
  return arr(items).filter((i) => {
    if (capability && i.capability !== capability && !arr(i.blocks).includes(capability)) return false;
    if (status && i.status !== status) return false;
    if (cid !== null && i.scope === "CONNECTION" && !arr(i.connections).some((c) => String(c.connectionId) === cid)) return false;
    return true;
  });
}

/** Items grouped by area in the documented order; Payment and Pricing share one group. Empty groups are omitted. */
export function groupItems(items) {
  const groups = [];
  const seen = new Map();
  const rank = (a) => { const n = AREA_ORDER.indexOf(a); return n < 0 ? AREA_ORDER.length : n; };
  const sorted = [...arr(items)].sort((a, b) => rank(a.area) - rank(b.area));
  for (const i of sorted) {
    const title = AREA_GROUP_TITLE[i.area] || AREA_TITLE[i.area] || i.area;
    if (!seen.has(title)) { const g = { title, items: [] }; seen.set(title, g); groups.push(g); }
    seen.get(title).items.push(i);
  }
  return groups;
}

/** ERP connection filter options — only connections the server returned for this tenant. */
export function connectionOptions(overview) {
  return arr(overview && overview.connections).map((c) => ({ value: String(c.id), label: c.name || `Connection ${c.id}` }));
}
export function capabilityOptions(overview) {
  return arr(overview && overview.catalog).map((c) => ({ value: c.capability, label: c.label || c.capability }));
}
export function capabilityLabel(overview, capability) {
  const c = arr(overview && overview.catalog).find((x) => x.capability === capability);
  return c ? c.label : String(capability || "").replace(/_/g, " ").toLowerCase();
}

/** One row per capability with INDEPENDENT dimensions. `openDecisions` counts REQUIRED register questions that block the capability. */
export function readinessRows(overview) {
  const items = arr(registerOf(overview)?.items);
  return arr(overview && overview.monitoring).map((m) => {
    const cat = arr(overview.catalog).find((c) => c.capability === m.capability) || {};
    const level = m.highestVerification || "NOT_CONFIGURED";
    return {
      capability: m.capability, label: m.label,
      classification: m.classification, classificationLabel: CLASSIFICATION_LABEL[m.classification] || m.classification, tone: CLASSIFICATION_TONE[m.classification] || "neutral",
      productionVerified: LEVELS.indexOf(level) >= LEVELS.indexOf("PRODUCTION_VERIFIED"), verificationLevel: level,
      openDecisions: items.filter((i) => i.status === "REQUIRED" && arr(i.blocks).includes(m.capability)).length,
      configuredDecisions: items.filter((i) => i.status === "CONFIGURED" && arr(i.blocks).includes(m.capability)).length,
      blockedBecause: cat.blockedBecause ? cat.blockedBecause.reason : null,
      inbound: cat.inbound || null, outbound: cat.outbound || null, dependsOn: arr(cat.dependsOn),
    };
  });
}

/** Provider rows: mock-verified vs real-verified vs unsupported, stated plainly. */
export function providerRows(overview) {
  return arr(overview && overview.providers).map((p) => {
    const implemented = p.status === "IMPLEMENTED";
    const real = Boolean(p.verification && p.verification.real);
    return {
      key: p.key || p.label, label: p.label, implemented, realVerified: real,
      text: !implemented ? "Unsupported — no adapter exists" : real ? "Verified against a real ERP" : "Mock verified only — no real ERP has been reached",
      tone: !implemented ? "neutral" : real ? "success" : "warning",
    };
  });
}

/** The single state the panel renders. `perm` = { view:boolean }. A 403 from the server wins over everything (the server is the control; the UI only reflects it). */
export function panelState(query, perm) {
  const q = query || {};
  if (q.error && (q.error.status === 403 || q.error.code === "FORBIDDEN")) return "forbidden";
  if (perm && perm.view === false) return "forbidden";
  if (q.status === "loading" && !q.data) return "loading";
  if (q.status === "error" || q.error) return "error";
  if (!registerOf(q.data)) return q.data ? "empty" : "loading";
  return registerOf(q.data).items.length === 0 ? "empty" : "ready";
}
