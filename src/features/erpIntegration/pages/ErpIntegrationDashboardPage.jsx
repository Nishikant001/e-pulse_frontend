import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, CheckCircle2, CircleSlash, Loader2, Plug, PlugZap, RefreshCw, Activity, XCircle } from "lucide-react";
import Alert from "../../../components/ui/Alert";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import KpiCard from "../../../components/ui/KpiCard";
import PageHeader from "../../../components/ui/PageHeader";
import { formatDateTime } from "../../../utils/format";
import { useAsyncData } from "../../inventory/hooks/useAsyncData";
import { erpSyncApi } from "../api/erpApi";
import ErpReadinessPanel from "../components/ErpReadinessPanel";
import ErpBusinessPanel from "../components/ErpBusinessPanel";
import ErpDecisionRegisterPanel from "../components/ErpDecisionRegisterPanel";
import { ERP_TYPE_LABEL, JOB_STATUS_META, SYNC_HEALTH_META, errorText } from "../erpDisplay";

const jobBadge = (s) => { const m = JOB_STATUS_META[s] || { label: s, tone: "neutral" }; return <Badge tone={m.tone} size="sm" dot>{m.label}</Badge>; };

function ErpStatsCard({ e }) {
  const h = SYNC_HEALTH_META[e.health.status] || SYNC_HEALTH_META.UNKNOWN;
  return (
    <Card className="p-5" aria-label={`${e.name} synchronisation statistics`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-section font-semibold text-ink">{e.name}</h3>
          <p className="text-caption text-ink-subtle">{ERP_TYPE_LABEL[e.erpType] || e.erpType}{e.provider ? ` · ${e.provider.label}` : ""}{e.status === "INACTIVE" ? " · inactive" : ""}</p>
        </div>
        <Badge tone={h.tone} dot title={e.health.reason}>{h.label}</Badge>
      </div>
      <p className="mt-1 text-caption text-ink-muted">{e.health.reason}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-body">
        <div><dt className="text-caption text-ink-subtle">Last sync</dt><dd>{e.lastSync ? <span className="flex flex-wrap items-center gap-1.5">{jobBadge(e.lastSync.status)}<span className="text-caption text-ink-muted">{formatDateTime(e.lastSync.at)} · {e.lastSync.capabilityLabel}</span></span> : "None yet"}</dd></div>
        <div><dt className="text-caption text-ink-subtle">Last successful sync</dt><dd>{e.lastSuccessfulSync ? formatDateTime(e.lastSuccessfulSync.at) : "None yet"}</dd></div>
        <div><dt className="text-caption text-ink-subtle">Last 7 days</dt><dd>{e.last7Days.success} success · {e.last7Days.partial} partial · {e.last7Days.failed} failed</dd></div>
        <div><dt className="text-caption text-ink-subtle">Next sync</dt><dd>{e.nextSync ? `${formatDateTime(e.nextSync.at)} · ${e.nextSync.capabilityLabel}${e.nextSync.isRetry ? " (retry)" : ""}` : "Not scheduled"}</dd></div>
      </dl>
      {e.health.capabilities.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">{e.health.capabilities.map((c) => { const m = SYNC_HEALTH_META[c.status]; return <Badge key={c.capability} size="sm" tone={m.tone} title={c.reason}>{c.capabilityLabel}: {m.label}</Badge>; })}</div>
      ) : null}
    </Card>
  );
}

/** ERP Integration dashboard — real numbers from the sync tables only; no activity means "No sync activity yet". Health is computed by the server from job history. */
export default function ErpIntegrationDashboardPage() {
  const q = useAsyncData((s) => erpSyncApi.summary(s), []);
  const d = q.data;
  const loading = q.status === "loading" && !d;
  const failed = q.status === "error";
  const kpi = { loading, error: failed };
  return (
    <div>
      <PageHeader title="ERP Integration" description="Connections, synchronisation status and health across all configured ERPs."
        actions={<><IconButton icon={RefreshCw} label="Refresh dashboard" variant="outline" onClick={q.reload} disabled={q.status === "loading"} /><Button variant="secondary" as={Link} to="/admin/sap/connections">ERP Connections</Button><Button variant="secondary" as={Link} to="/admin/sap/errors">Error Monitor</Button><Button as={Link} to="/admin/sap/sync-history">Sync History</Button></>} />
      <ErpReadinessPanel />
      <ErpBusinessPanel />
      <ErpDecisionRegisterPanel />
      {failed ? <Alert tone="error" className="mb-4">{errorText(q.error, "Unable to load the integration summary.")} <button type="button" className="underline" onClick={q.reload}>Retry</button></Alert> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total ERP connections" value={d?.connections} icon={Plug} {...kpi} />
        <KpiCard title="Active connections" value={d?.activeConnections} icon={PlugZap} status="success" {...kpi} />
        <KpiCard title="Syncs running" value={d?.runningSyncs} icon={Loader2} status="info" {...kpi} />
        <KpiCard title="Syncs today" value={d?.syncsToday.total} icon={Activity} {...kpi} />
        <KpiCard title="Successful today" value={d?.syncsToday.success} icon={CheckCircle2} status="success" {...kpi} />
        <KpiCard title="Partial today" value={d?.syncsToday.partial} icon={AlertTriangle} status={d?.syncsToday.partial ? "warning" : "neutral"} {...kpi} />
        <KpiCard title="Failed today" value={d?.syncsToday.failed} icon={XCircle} status={d?.syncsToday.failed ? "error" : "neutral"} {...kpi} />
        <KpiCard title="Success rate (7 days)" value={d ? (d.successRateLast7Days === null ? "—" : `${d.successRateLast7Days}%`) : undefined} icon={CheckCircle2} status="success" {...kpi} />
        <KpiCard title="Failure rate (7 days)" value={d ? (d.failureRateLast7Days === null ? "—" : `${d.failureRateLast7Days}%`) : undefined} icon={XCircle} status={d?.failureRateLast7Days ? "error" : "neutral"} {...kpi} />
        <KpiCard title="Partial syncs (7 days)" value={d?.partialSyncsLast7Days} icon={AlertTriangle} status={d?.partialSyncsLast7Days ? "warning" : "neutral"} {...kpi} />
        <KpiCard title="Queued syncs" value={d?.queuedSyncs} icon={Loader2} {...kpi} />
        <KpiCard title="Scheduled jobs" value={d?.scheduledJobs} icon={CalendarClock} {...kpi} />
        <KpiCard title="Connections in error" value={d?.errorConnections} icon={CircleSlash} status={d?.errorConnections ? "error" : "neutral"} {...kpi} />
      </div>
      {d?.alerts?.length ? (
        <Card className="mt-4 p-5" aria-label="Alerts">
          <h2 className="mb-2 flex items-center gap-2 text-section font-semibold text-ink"><AlertTriangle className="size-5 text-warning-600" aria-hidden /> Alerts ({d.alerts.length})</h2>
          <ul className="space-y-1.5">{d.alerts.map((a, i) => <li key={`${a.code}-${i}`} className="flex items-start gap-2 text-body"><Badge size="sm" tone={a.severity === "CRITICAL" ? "error" : a.severity === "WARNING" ? "warning" : "neutral"}>{a.severity}</Badge><span>{a.message}</span></li>)}</ul>
          <p className="mt-2 text-caption text-ink-subtle">Alerts are shown here only; no e-mail or message is sent.</p>
        </Card>
      ) : null}
      {d?.worker ? <p className="mt-3 text-caption text-ink-subtle">Sync worker: database-backed, up to {d.worker.maxConcurrent} at a time; not an external queue.</p> : null}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-2 flex items-center gap-2 text-section font-semibold text-ink"><CheckCircle2 className="size-5 text-success-600" aria-hidden /> Last successful sync</h2>
          {d && !d.hasSyncActivity ? <p className="text-body text-ink-subtle">No sync activity yet.</p> : null}
          {d?.hasSyncActivity && !d.lastSuccessfulSync ? <p className="text-body text-ink-subtle">No sync has completed successfully yet.</p> : null}
          {d?.lastSuccessfulSync ? <p className="text-body text-ink">{d.lastSuccessfulSync.connectionName || "ERP"} · {d.lastSuccessfulSync.capability.replace(/_/g, " ").toLowerCase()} · {formatDateTime(d.lastSuccessfulSync.at)} · <Link className="text-brand-700 underline" to="/admin/sap/sync-history">view history</Link></p> : null}
        </Card>
        <Card className="p-5">
          <h2 className="mb-2 flex items-center gap-2 text-section font-semibold text-ink"><CalendarClock className="size-5 text-brand-600" aria-hidden /> Next scheduled sync</h2>
          {d && !d.nextScheduledSync ? <p className="text-body text-ink-subtle">No schedule is enabled. Add one from an ERP connection.</p> : null}
          {d?.nextScheduledSync ? <p className="text-body text-ink">{d.nextScheduledSync.connectionName} · {d.nextScheduledSync.capabilityLabel} · {formatDateTime(d.nextScheduledSync.at)}{d.nextScheduledSync.isRetry ? " (automatic retry)" : ""} · {d.enabledSchedules} schedule{d.enabledSchedules === 1 ? "" : "s"} enabled</p> : null}
        </Card>
      </div>
      <h2 className="mb-3 mt-6 text-section font-semibold text-ink">Per-ERP statistics</h2>
      {d && d.perConnection.length === 0 ? <Card className="p-5"><p className="text-body text-ink-subtle">No ERP connections yet. <Link className="text-brand-700 underline" to="/admin/sap/connections">Add one</Link>.</p></Card> : null}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{(d?.perConnection || []).map((e) => <ErpStatsCard key={e.id} e={e} />)}</div>
    </div>
  );
}
