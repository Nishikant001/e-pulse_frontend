import { useEffect, useState } from "react";
import { Eye, RefreshCw, RotateCw } from "lucide-react";
import Alert from "../../../components/ui/Alert";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Drawer from "../../../components/ui/Drawer";
import FilterBar from "../../../components/ui/FilterBar";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingState from "../../../components/ui/LoadingState";
import { SelectFilter } from "../../../components/forms";
import DataTable from "../../../components/tables/DataTable";
import { useToast } from "../../../components/feedback";
import { formatDateTime } from "../../../utils/format";
import { useAsyncData } from "../../inventory/hooks/useAsyncData";
import { erpApi, erpSyncApi } from "../api/erpApi";
import { ERP_TYPE_LABEL, JOB_STATUS_META, TRIGGER_LABEL, errorText, isJobActive } from "../erpDisplay";
import { useErpPermissions } from "../erpPermissions";

const EMPTY = { connectionId: "", status: "", trigger: "" };
const statusBadge = (s) => { const m = JOB_STATUS_META[s] || { label: s, tone: "neutral" }; return <Badge tone={m.tone} size="sm" dot>{m.label}</Badge>; };
const dur = (ms) => (ms == null ? "—" : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

function JobDrawer({ jobId, onClose, onChanged }) {
  const toast = useToast();
  const perm = useErpPermissions();
  const [retrying, setRetrying] = useState(false);
  const job = useAsyncData((s) => (jobId ? erpSyncApi.job(jobId, s) : Promise.resolve(null)), [jobId]);
  const errors = useAsyncData((s) => (jobId ? erpSyncApi.jobErrors(jobId, { pageSize: 100 }, s) : Promise.resolve(null)), [jobId]);
  const j = job.data;
  const active = isJobActive(j);
  useEffect(() => { // follow a running job
    if (!active) return undefined;
    const t = setInterval(() => { job.reload(); errors.reload(); onChanged?.(); }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  async function retry() {
    setRetrying(true);
    try { await erpSyncApi.retry(jobId); toast.success("Retry started as a new job"); onChanged?.(); onClose(); }
    catch (e) { toast.error(errorText(e, "Unable to retry"), { title: "Retry failed" }); }
    finally { setRetrying(false); }
  }
  const c = j?.counts;
  return (
    <Drawer open={Boolean(jobId)} onClose={onClose} size="lg" title={j ? `Sync job #${j.id}` : "Sync job"} description={j ? `${j.connection.name} · ${j.capabilityLabel}` : undefined}>
      {job.status === "loading" && !j ? <LoadingState label="Loading job…" /> : null}
      {job.status === "error" ? <Alert tone="error">{errorText(job.error, "Unable to load the job.")}</Alert> : null}
      {j ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge(j.status)}<Badge size="sm">{TRIGGER_LABEL[j.trigger] || j.trigger}</Badge>
            <Badge size="sm" tone="info">{j.provider.label}</Badge><span className="text-caption text-ink-subtle">attempt {j.attempt} of {j.maxAttempts} · {j.retryCount} retr{j.retryCount === 1 ? "y" : "ies"}{j.lastRetryAt ? ` · last retried ${formatDateTime(j.lastRetryAt)}` : ""}</span>
            {j.error ? <Badge size="sm" tone={j.retryable ? "warning" : "error"}>{j.retryable ? "Retryable error" : "Not retryable"}</Badge> : null}
            {j.canRetry && perm.retry ? <Button size="sm" className="ml-auto" leftIcon={RotateCw} loading={retrying} onClick={retry}>Retry</Button> : null}
          </div>
          {j.error ? <Alert tone="error" title={j.error.code}>{j.error.message}</Alert> : null}
          {active ? <Alert tone="info">This sync is still running; the page refreshes automatically.</Alert> : null}
          <dl className="grid grid-cols-2 gap-3 text-body sm:grid-cols-4">
            {[["Total", c.total], ["Processed", c.processed], ["Created", c.created], ["Updated", c.updated], ["Skipped (unchanged)", c.skipped], ["Failed", c.failed]].map(([k, v]) => (
              <div key={k} className="rounded-card border border-line p-3"><dt className="text-caption text-ink-subtle">{k}</dt><dd className="text-section font-semibold text-ink">{v}</dd></div>
            ))}
          </dl>
          <dl className="grid grid-cols-3 gap-2 text-body">
            <dt className="text-ink-subtle">ERP</dt><dd className="col-span-2">{ERP_TYPE_LABEL[j.connection.erpType] || j.connection.erpType}</dd>
            <dt className="text-ink-subtle">Started</dt><dd className="col-span-2">{j.startedAt ? formatDateTime(j.startedAt) : "—"}</dd>
            <dt className="text-ink-subtle">Finished</dt><dd className="col-span-2">{j.completedAt ? formatDateTime(j.completedAt) : "—"} ({dur(j.durationMs)})</dd>
            <dt className="text-ink-subtle">Correlation id</dt><dd className="col-span-2 break-all text-caption">{j.correlationId}</dd>
          </dl>
          <div>
            <h3 className="mb-2 text-body font-semibold text-ink">Errors {errors.data ? `(${errors.data.total})` : ""}</h3>
            <DataTable bare rowKey="id" caption="Sync errors" loading={errors.status === "loading" && !errors.data} data={errors.data?.items || []}
              columns={[
                { key: "recordIndex", header: "#", accessor: (r) => (r.recordIndex == null ? "Run" : r.recordIndex + 1) },
                { key: "externalId", header: "ERP id", accessor: (r) => r.externalId || "—" },
                { key: "code", header: "Category", render: (_, r) => <Badge tone="error" size="sm">{r.code}</Badge> },
                { key: "message", header: "Message", minWidth: 220 },
                { key: "retryable", header: "Retryable", accessor: (r) => (r.retryable ? "Yes" : "No") },
              ]}
              emptyTitle="No errors" emptyDescription="No record or run errors were recorded for this job." />
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}

/** ERP Sync History — every sync across ALL of the tenant's ERP connections (real jobs only). */
export default function ErpSyncHistoryPage() {
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [openId, setOpenId] = useState(null);
  const conns = useAsyncData((s) => erpApi.list({}, s), []);
  const list = useAsyncData((s) => erpSyncApi.jobs({ ...filters, page, pageSize }, s), [filters.connectionId, filters.status, filters.trigger, page, pageSize]);
  const set = (k) => (v) => { setPage(1); setFilters((f) => ({ ...f, [k]: v })); };
  const active = Object.values(filters).filter(Boolean).length;

  return (
    <div>
      <PageHeader title="ERP Sync History" description="Every synchronisation run across all configured ERP connections, with its counts and errors."
        actions={<IconButton icon={RefreshCw} label="Refresh history" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />} />
      <FilterBar className="mb-4" activeCount={active} onReset={() => { setPage(1); setFilters(EMPTY); }}>
        <SelectFilter label="ERP connection" allLabel="All connections" options={(conns.data?.items || []).map((c) => ({ value: String(c.id), label: c.name }))} value={filters.connectionId} onChange={set("connectionId")} />
        <SelectFilter label="Status" allLabel="All statuses" options={Object.entries(JOB_STATUS_META).map(([value, m]) => ({ value, label: m.label }))} value={filters.status} onChange={set("status")} />
        <SelectFilter label="Trigger" allLabel="All triggers" options={Object.entries(TRIGGER_LABEL).map(([value, label]) => ({ value, label }))} value={filters.trigger} onChange={set("trigger")} />
      </FilterBar>
      <Card>
        <DataTable bare manual rowKey="id" caption="ERP sync jobs" data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? errorText(list.error, "Unable to load sync history.") : null} onRetry={list.reload}
          page={page} pageSize={pageSize} total={list.data?.total ?? 0} onPageChange={setPage} onPageSizeChange={(n) => { setPage(1); setPageSize(n); }}
          onRowClick={(r) => setOpenId(r.id)}
          columns={[
            { key: "id", header: "Job", accessor: (r) => `#${r.id}` },
            { key: "connection", header: "ERP connection", accessor: (r) => r.connection.name, minWidth: 160 },
            { key: "capability", header: "Capability", accessor: (r) => r.capabilityLabel },
            { key: "provider", header: "Provider", accessor: (r) => r.provider.label, hideOnMobile: true },
            { key: "trigger", header: "Trigger", accessor: (r) => TRIGGER_LABEL[r.trigger] || r.trigger, hideOnMobile: true },
            { key: "status", header: "Status", render: (_, r) => statusBadge(r.status) },
            { key: "counts", header: "Created / Updated / Skipped / Failed", accessor: (r) => `${r.counts.created} / ${r.counts.updated} / ${r.counts.skipped} / ${r.counts.failed}`, minWidth: 190 },
            { key: "startedAt", header: "Started", accessor: (r) => (r.startedAt ? formatDateTime(r.startedAt) : "—"), minWidth: 150 },
            { key: "durationMs", header: "Duration", accessor: (r) => dur(r.durationMs), hideOnMobile: true },
          ]}
          rowActions={(row) => [{ key: "view", label: "View details", icon: Eye, onClick: () => setOpenId(row.id) }]}
          emptyTitle={active ? "No jobs match the filters" : "No sync activity yet"} emptyDescription={active ? "Try changing the filters." : "Start a sync from an ERP connection to see it here."} />
      </Card>
      <JobDrawer jobId={openId} onClose={() => setOpenId(null)} onChanged={list.reload} />
    </div>
  );
}
