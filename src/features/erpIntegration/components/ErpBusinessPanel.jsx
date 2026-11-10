import { useState } from "react";
import { RefreshCw } from "lucide-react";
import Alert from "../../../components/ui/Alert";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import { formatDateTime } from "../../../utils/format";
import { useAsyncData } from "../../inventory/hooks/useAsyncData";
import { erpBusinessApi } from "../api/erpApi";
import { errorText } from "../erpDisplay";
import { CLASSIFICATION_META, DECISION_META, RECON_META, RECONCILABLE, STATE_META, VERIFICATION_LABEL, blockerTitle } from "../erpBusinessDisplay";
import { NO_ACCESS_HINT, useErpPermissions } from "../erpPermissions";
import ErpReconcileModal from "./ErpReconcileModal";

const when = (x) => (x ? formatDateTime(x.at) : "—");

/** Business-transaction capabilities (stock, sales, invoice, return, payment, document …): real status, blockers, ownership, mapping, verification and reconciliation. Numbers come from the server; nothing is estimated. */
export default function ErpBusinessPanel() {
  const q = useAsyncData((s) => erpBusinessApi.overview(s), []);
  const perm = useErpPermissions();
  const [open, setOpen] = useState(null);
  const [rec, setRec] = useState(null); // { connection, capability }
  const d = q.data;
  const connections = d?.connections || [];
  return (
    <Card className="mb-6 p-5" aria-label="Business capabilities">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-section font-semibold text-ink">Business capabilities</h2>
          <p className="text-caption text-ink-subtle">What each business flow can do right now, what blocks it, and how far it has been verified. A configured flow is never shown as production ready.</p>
        </div>
        <IconButton icon={RefreshCw} label="Refresh business capabilities" variant="outline" onClick={q.reload} disabled={q.status === "loading"} />
      </div>
      {q.status === "error" ? <Alert tone="error" className="mt-3">{errorText(q.error, "Unable to load the business capabilities.")}</Alert> : null}
      {q.status === "loading" && !d ? <p className="mt-3 text-body text-ink-muted">Loading…</p> : null}
      {d ? (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-body">
              <thead className="text-caption text-ink-subtle"><tr><th className="py-2 pr-3">Capability</th><th className="pr-3">In the DMS</th><th className="pr-3">Status</th><th className="pr-3">Last success</th><th className="pr-3">Last failure</th><th className="pr-3">Processed / failed</th><th className="pr-3">Decisions pending</th><th className="pr-3">Differences</th><th>Verified</th></tr></thead>
              <tbody>
                {d.monitoring.map((m) => {
                  const c = CLASSIFICATION_META[m.classification] || CLASSIFICATION_META.UNSUPPORTED; const s = STATE_META[m.status] || STATE_META.NOT_CONFIGURED;
                  return (
                    <tr key={m.capability} className="border-t border-line">
                      <td className="py-2 pr-3 font-medium text-ink">{m.label}</td>
                      <td className="pr-3"><Badge tone={c.tone} size="sm">{c.label}</Badge></td>
                      <td className="pr-3"><Badge tone={s.tone} size="sm" dot>{s.label}</Badge></td>
                      <td className="pr-3 text-ink-muted">{when(m.lastSuccess)}</td>
                      <td className="pr-3 text-ink-muted">{when(m.lastFailure)}</td>
                      <td className="pr-3 text-ink-muted">{m.recordsProcessed} / {m.recordsFailed}</td>
                      <td className="pr-3">{m.pendingDecisions ? <Badge tone="error" size="sm">{m.pendingDecisions}</Badge> : <span className="text-ink-muted">0</span>}</td>
                      <td className="pr-3">{m.reconciliationMismatches ? <Badge tone="warning" size="sm">{m.reconciliationMismatches}</Badge> : <span className="text-ink-muted">0</span>}</td>
                      <td className="text-ink-muted">{VERIFICATION_LABEL[m.highestVerification] || m.highestVerification}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-caption text-ink-subtle">Providers: {d.providers.map((p) => `${p.label} — ${p.status === "IMPLEMENTED" ? "mock verified, real ERP not verified" : p.status === "FOUNDATION_ONLY" ? "not implemented" : "not available"}`).join(" · ")}.</p>

          {connections.length === 0 ? <p className="mt-4 text-body text-ink-muted">No ERP connection is configured yet.</p> : connections.map((c) => (
            <div key={c.id} className="mt-5">
              <h3 className="text-body font-semibold text-ink">{c.name} <span className="font-normal text-ink-subtle">({c.provider ? c.provider.label : "no provider"})</span></h3>
              <ul className="mt-2 divide-y divide-line rounded-md border border-line">
                {c.capabilities.map((x) => {
                  const s = STATE_META[x.state] || STATE_META.READY; const key = `${c.id}:${x.capability}`; const isOpen = open === key;
                  const canCompare = RECONCILABLE.includes(x.capability) && x.enabled;
                  return (
                    <li key={key} className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className="font-medium text-ink underline-offset-2 hover:underline" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : key)}>{x.label}</button>
                        <Badge tone={s.tone} size="sm" dot>{s.label}</Badge>
                        <span className="text-caption text-ink-subtle">{x.ownership ? x.ownership.replace("_", " ").toLowerCase() : x.ownershipRequired ? "ownership not decided" : "ownership implied by direction"}</span>
                        <span className="text-caption text-ink-subtle">· {VERIFICATION_LABEL[x.verification.level]}</span>
                        {canCompare ? <Button size="sm" variant="secondary" className="ml-auto" disabled={!perm.sync} title={perm.sync ? undefined : NO_ACCESS_HINT} onClick={() => setRec({ connection: c, capability: x.capability })}>Compare</Button> : null}
                      </div>
                      {x.blockers.length ? <div className="mt-2 space-y-1.5">{x.blockers.map((b, i) => <Alert key={i} tone={b.code === "BUSINESS_DECISION_REQUIRED" ? "warning" : "error"} title={blockerTitle(b)}>{b.message}</Alert>)}</div> : null}
                      {isOpen ? (
                        <div className="mt-3 space-y-2 text-body text-ink-muted">
                          {x.warnings.map((w, i) => <Alert key={i} tone="info">{w.message}</Alert>)}
                          <p>Mapping: {x.mapping.total} field(s){x.mapping.keyMapped ? ", ERP id mapped" : ", ERP id NOT mapped"}.</p>
                          {x.lastCounts ? <p>Last run: {x.lastCounts.processed} processed · {x.lastCounts.created} created · {x.lastCounts.updated} updated · {x.lastCounts.skipped} skipped · {x.lastCounts.failed} failed.</p> : <p>No sync has completed yet.</p>}
                          {x.outbound ? <p>Sent to the ERP: {x.outbound.sent} sent · {x.outbound.failed} failed · {x.outbound.blocked} blocked.</p> : null}
                          {x.reconciliation ? <p>Last comparison: {Object.entries(RECON_META).filter(([k]) => x.reconciliation[k]).map(([k, m]) => `${m.label} ${x.reconciliation[k]}`).join(" · ") || "none yet"}.</p> : null}
                          <p>{x.verification.notes[0]}</p>
                          {x.decisions ? (
                            <ul className="space-y-1">{x.decisions.map((dec) => { const m = DECISION_META[dec.status]; return <li key={dec.id} className="flex items-start gap-2"><Badge tone={m.tone} size="sm" className="mt-0.5 shrink-0">{m.label}</Badge><span>{dec.question}</span></li>; })}</ul>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {d.documentStore && !d.documentStore.ready ? <Alert tone="warning" className="mt-4" title="Document synchronisation is blocked">No secure, tenant-isolated document store has been approved. Still missing: {d.documentStore.checks.filter((c) => c.status !== "READY").map((c) => c.label).join("; ")}.</Alert> : null}
        </>
      ) : null}
      <ErpReconcileModal open={Boolean(rec)} onClose={() => setRec(null)} connection={rec?.connection} capability={rec?.capability} />
    </Card>
  );
}
