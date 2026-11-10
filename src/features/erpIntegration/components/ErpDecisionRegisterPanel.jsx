import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, RefreshCw, ShieldAlert } from "lucide-react";
import Alert from "../../../components/ui/Alert";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import IconButton from "../../../components/ui/IconButton";
import KpiCard from "../../../components/ui/KpiCard";
import LoadingState from "../../../components/ui/LoadingState";
import Select from "../../../components/ui/Select";
import { useAsyncData } from "../../inventory/hooks/useAsyncData";
import { erpBusinessApi } from "../api/erpApi";
import { errorText } from "../erpDisplay";
import { NO_ACCESS_HINT, useErpPermissions } from "../erpPermissions";
import {
  approvalImplemented, approvalReason, capabilityLabel, capabilityOptions, connectionOptions, countByStatus, filterItems, groupItems, panelState,
  providerRows, readinessRows, registerOf, statusMeta, STATUS_META,
} from "../erpDecisionView";

const NO_ITEMS = [];
const OWN_LABEL = { ERP_OWNED: "ERP owns it", DMS_OWNED: "DMS owns it", SHARED: "Shared" };
const DIR_LABEL = { ERP_TO_DMS: "ERP → DMS", DMS_TO_ERP: "DMS → ERP", BIDIRECTIONAL: "Both ways", DISABLED: "Disabled" };

function DecisionRow({ item, overview, open, onToggle, canManage, approvalOn }) {
  const m = statusMeta(item.status, approvalOn);
  const Chevron = open ? ChevronDown : ChevronRight;
  const panelId = `decision-${item.id}`;
  return (
    <li className="p-3 sm:p-4">
      <button type="button" className="flex w-full items-start gap-2 text-left" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        <Chevron className="mt-0.5 size-4 shrink-0 text-ink-subtle" aria-hidden />
        <span className="min-w-0 flex-1 text-body font-medium text-ink">{item.question}</span>
        <Badge tone={m.tone} size="sm" className="ml-2 self-start">{m.label}</Badge>
      </button>
      <div className="ml-6 mt-1 flex flex-wrap items-center gap-1.5 text-caption text-ink-subtle">
        <span>Blocks:</span>
        {item.blocks.map((b) => <Badge key={b} size="sm" tone="neutral">{capabilityLabel(overview, b)}</Badge>)}
        <span aria-hidden>·</span>
        <span>{item.scope === "CONNECTION" ? "Set per ERP connection" : "Applies to all connections"}</span>
      </div>
      {open ? (
        <div id={panelId} className="ml-6 mt-3 space-y-3 text-body text-ink-muted">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wide text-ink-subtle">Current safe behaviour</p>
            <p>{item.interim}</p>
          </div>
          <div>
            <p className="text-caption font-semibold uppercase tracking-wide text-ink-subtle">Impact while unresolved</p>
            <p>These stay blocked or partial: {item.blocks.map((b) => capabilityLabel(overview, b)).join(", ")}. Answering this question does not implement them.</p>
          </div>
          <div>
            <p className="text-caption font-semibold uppercase tracking-wide text-ink-subtle">How it is recorded</p>
            <p>{item.persistence}</p>
            <p className="mt-1 text-caption text-ink-subtle">{m.help}</p>
          </div>
          {item.scope === "CONNECTION" ? (
            <div>
              <p className="text-caption font-semibold uppercase tracking-wide text-ink-subtle">Configured on your ERP connections</p>
              {item.connections && item.connections.length ? (
                <div className="mt-1 overflow-x-auto">
                  <table className="w-full min-w-[460px] text-left text-body">
                    <thead className="text-caption text-ink-subtle"><tr><th className="py-1 pr-3">Connection</th><th className="pr-3">Ownership</th><th className="pr-3">Direction</th><th>Enabled</th></tr></thead>
                    <tbody>
                      {item.connections.map((c) => (
                        <tr key={c.connectionId} className="border-t border-line">
                          <td className="py-1.5 pr-3 text-ink">{c.connectionName || `Connection ${c.connectionId}`}</td>
                          <td className="pr-3">{c.ownership ? <span>{OWN_LABEL[c.ownership] || c.ownership}</span> : <Badge size="sm" tone="error">Not set</Badge>}</td>
                          <td className="pr-3">{DIR_LABEL[c.direction] || c.direction || "—"}</td>
                          <td>{c.enabled ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p>No ERP connection has this capability configured.</p>}
              <div className="mt-2">
                {canManage
                  ? <Button size="sm" variant="secondary" as={Link} to="/admin/sap/connections">Change ownership on ERP Connections</Button>
                  : <Button size="sm" variant="secondary" disabled title={NO_ACCESS_HINT}>Change ownership on ERP Connections</Button>}
                <p className="mt-1 text-caption text-ink-subtle">Ownership is saved there, with its own checks and audit entry. Nothing is saved from this screen.</p>
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-line bg-neutral-50 p-2 text-caption">There is no place in the system to record an answer to this question yet, so it cannot be changed from here.</p>
          )}
        </div>
      ) : null}
    </li>
  );
}

/** Phase 20 — Business Decision Register. READ-ONLY: it displays what the server returned in `decisionRegister` and never pretends that a configuration is a business approval.
 *  No decision is saved from here (the system has no approval storage); the one persisted decision, ownership, is changed on ERP Connections. */
export default function ErpDecisionRegisterPanel() {
  const q = useAsyncData((s) => erpBusinessApi.overview(s), []);
  const perm = useErpPermissions();
  const [filters, setFilters] = useState({ capability: "", status: "", connectionId: "" });
  const [open, setOpen] = useState(() => new Set());
  const d = q.data;
  const state = panelState(q, perm);
  const reg = registerOf(d);
  const approvalOn = approvalImplemented(d);
  const items = reg ? reg.items : NO_ITEMS;
  const counts = useMemo(() => countByStatus(items), [items]);
  const filtered = useMemo(() => filterItems(items, filters), [items, filters]);
  const groups = useMemo(() => groupItems(filtered), [filtered]);
  const readiness = useMemo(() => readinessRows(d), [d]);
  const providers = useMemo(() => providerRows(d), [d]);
  const toggle = (id) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const filtering = Boolean(filters.capability || filters.status || filters.connectionId);

  return (
    <Card className="mb-6 p-5" aria-label="Business decision register">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-section font-semibold text-ink">Business decision register</h2>
          <p className="text-caption text-ink-subtle">The questions the business must answer before blocked or partial ERP flows can be completed. Shown exactly as the server reports them.</p>
        </div>
        <IconButton icon={RefreshCw} label="Refresh decision register" variant="outline" onClick={q.reload} disabled={q.status === "loading"} />
      </div>

      {state === "forbidden" ? <EmptyState compact icon={ShieldAlert} title="You don't have access to the decision register" description="Your account is not allowed to view ERP business decisions. Ask an administrator if you need access." /> : null}
      {state === "loading" ? <LoadingState compact label="Loading the decision register…" /> : null}
      {state === "error" ? <ErrorState compact title="Unable to load the decision register" message={errorText(q.error, "Please try again.")} onRetry={q.reload} /> : null}
      {state === "empty" ? <EmptyState compact title="No decisions to show" description="The server returned an empty decision register." /> : null}

      {state === "ready" ? (
        <>
          <div className="mt-4 space-y-2">
            <Alert tone="info" title="Recording a decision does not build the capability">
              Invoice, Return and Document synchronisation stay <strong>blocked</strong> until the decisions below are answered <em>and</em> the missing code exists; Stock and Sales stay <strong>partial</strong>. A configured ownership never switches a blocked sync on.
            </Alert>
            {approvalOn ? null : <Alert tone="warning" title="Approval tracking is not implemented">{approvalReason(d)}</Alert>}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard title="Decision required" value={counts.REQUIRED} status="error" />
            <KpiCard title="Configured, not approved" value={counts.CONFIGURED} status="warning" />
            <KpiCard title="Business approved" value={approvalOn ? 0 : "Not tracked"} status="neutral" footer={approvalOn ? undefined : "No approval workflow exists"} />
            <KpiCard title="All questions" value={counts.total} status="brand" />
          </div>
          {counts.OTHER ? <Alert tone="warning" className="mt-3">{counts.OTHER} question(s) have a status this screen does not recognise. They are listed but never shown as approved.</Alert> : null}

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3" role="group" aria-label="Decision filters">
            <Select label="Capability" value={filters.capability} onChange={set("capability")} placeholder="All capabilities" options={capabilityOptions(d)} />
            <Select label="Status" value={filters.status} onChange={set("status")} placeholder="All statuses" options={Object.keys(STATUS_META).map((k) => ({ value: k, label: STATUS_META[k].label }))} />
            <Select label="ERP connection" value={filters.connectionId} onChange={set("connectionId")} placeholder="All connections" options={connectionOptions(d)} hint={filters.connectionId ? "Questions that apply to all connections stay listed." : undefined} />
          </div>
          <div className="mt-2 flex items-center justify-between text-caption text-ink-subtle">
            <span aria-live="polite">Showing {filtered.length} of {items.length} questions.</span>
            {filtering ? <Button size="sm" variant="ghost" onClick={() => setFilters({ capability: "", status: "", connectionId: "" })}>Clear filters</Button> : null}
          </div>

          {groups.length === 0 ? <EmptyState compact title="No questions match these filters" description="Clear a filter to see more." /> : groups.map((g) => (
            <section key={g.title} className="mt-4" aria-label={`${g.title} decisions`}>
              <h3 className="text-body font-semibold text-ink">{g.title} <span className="font-normal text-ink-subtle">({g.items.length})</span></h3>
              <ul className="mt-2 divide-y divide-line rounded-md border border-line">
                {g.items.map((item) => <DecisionRow key={item.id} item={item} overview={d} open={open.has(item.id)} onToggle={() => toggle(item.id)} canManage={perm.manage} approvalOn={approvalOn} />)}
              </ul>
            </section>
          ))}

          <section className="mt-6" aria-label="Capability readiness">
            <h3 className="text-body font-semibold text-ink">Capability readiness</h3>
            <p className="text-caption text-ink-subtle">Separate facts, not one score: what the DMS can do, whether it has been verified against a real ERP, and how many decisions are still open.</p>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-body">
                <thead className="text-caption text-ink-subtle"><tr><th className="py-2 pr-3">Capability</th><th className="pr-3">In the DMS</th><th className="pr-3">Production verification</th><th className="pr-3">Decisions open</th><th>Why it is limited</th></tr></thead>
                <tbody>
                  {readiness.map((r) => (
                    <tr key={r.capability} className="border-t border-line align-top">
                      <td className="py-2 pr-3 font-medium text-ink">{r.label}</td>
                      <td className="pr-3"><Badge size="sm" tone={r.tone}>{r.classificationLabel}</Badge></td>
                      <td className="pr-3">{r.productionVerified ? <Badge size="sm" tone="success">Production verified</Badge> : <Badge size="sm" tone="neutral">Not production-verified</Badge>}</td>
                      <td className="pr-3">{r.openDecisions ? <Badge size="sm" tone="error">{r.openDecisions} open</Badge> : <span className="text-ink-muted">0</span>}{r.configuredDecisions ? <span className="ml-1 text-caption text-ink-subtle">· {r.configuredDecisions} configured</span> : null}</td>
                      <td className="text-ink-muted"><span className="line-clamp-3" title={r.blockedBecause || undefined}>{r.blockedBecause || (r.classification === "PARTIAL" ? "Works only within documented limits; see its open decisions." : "—")}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h4 className="mt-4 text-body font-semibold text-ink">ERP providers</h4>
            <ul className="mt-1 divide-y divide-line rounded-md border border-line">
              {providers.map((p) => <li key={p.key} className="flex flex-wrap items-center gap-2 p-3"><span className="font-medium text-ink">{p.label}</span><Badge size="sm" tone={p.tone}>{p.text}</Badge></li>)}
            </ul>
          </section>
        </>
      ) : null}
    </Card>
  );
}
