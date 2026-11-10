import { useState } from "react";
import { RefreshCw } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Card from "../../../components/ui/Card";
import FilterBar from "../../../components/ui/FilterBar";
import IconButton from "../../../components/ui/IconButton";
import Input from "../../../components/ui/Input";
import PageHeader from "../../../components/ui/PageHeader";
import { SelectFilter } from "../../../components/forms";
import DataTable from "../../../components/tables/DataTable";
import { formatDateTime } from "../../../utils/format";
import { useAsyncData } from "../../inventory/hooks/useAsyncData";
import { erpApi, erpSyncApi } from "../api/erpApi";
import { ERROR_CODE_OPTIONS, JOB_STATUS_META, errorText } from "../erpDisplay";

const EMPTY = { connectionId: "", capability: "", errorCode: "", status: "", retryable: "", from: "", to: "" };

/** ERP Error Monitor — every run-level and record-level sync error of the tenant, filterable. Real rows only; messages never contain credentials. */
export default function ErpErrorMonitorPage() {
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const conns = useAsyncData((s) => erpApi.list({}, s), []);
  const lookups = useAsyncData((s) => erpApi.lookups(s), []);
  const key = Object.values(filters).join("|");
  const list = useAsyncData((s) => erpSyncApi.errors({ ...filters, page, pageSize }, s), [key, page, pageSize]);
  const set = (k) => (v) => { setPage(1); setFilters((f) => ({ ...f, [k]: v })); };
  const active = Object.values(filters).filter(Boolean).length;
  const dateRangeBad = filters.from && filters.to && filters.from > filters.to;

  return (
    <div>
      <PageHeader title="ERP Error Monitor" description="Errors from all synchronisation runs. Run errors affect a whole sync; record errors affect one ERP record."
        actions={<IconButton icon={RefreshCw} label="Refresh errors" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />} />
      <FilterBar className="mb-4" activeCount={active} onReset={() => { setPage(1); setFilters(EMPTY); }}>
        <SelectFilter label="ERP" allLabel="All ERPs" options={(conns.data?.items || []).map((c) => ({ value: String(c.id), label: c.name }))} value={filters.connectionId} onChange={set("connectionId")} />
        <SelectFilter label="Capability" allLabel="All capabilities" options={(lookups.data?.capabilities || []).filter((c) => c.syncSupported).map((c) => ({ value: c.value, label: c.label }))} value={filters.capability} onChange={set("capability")} />
        <SelectFilter label="Error code" allLabel="All error codes" options={ERROR_CODE_OPTIONS.map((c) => ({ value: c, label: c }))} value={filters.errorCode} onChange={set("errorCode")} />
        <SelectFilter label="Job status" allLabel="All statuses" options={Object.entries(JOB_STATUS_META).map(([value, m]) => ({ value, label: m.label }))} value={filters.status} onChange={set("status")} />
        <SelectFilter label="Retryable" allLabel="Any" options={[{ value: "true", label: "Yes" }, { value: "false", label: "No" }]} value={filters.retryable} onChange={set("retryable")} />
        <Input type="date" aria-label="From date" label="From" value={filters.from} onChange={(e) => set("from")(e.target.value)} error={dateRangeBad ? "From is after To" : undefined} />
        <Input type="date" aria-label="To date" label="To" value={filters.to} onChange={(e) => set("to")(e.target.value)} />
      </FilterBar>
      {list.data?.byCode?.length ? (
        <div className="mb-4 flex flex-wrap gap-2" aria-label="Errors by category">
          {list.data.byCode.map((c) => <Badge key={c.code} tone={c.retryable ? "warning" : "error"} size="sm">{c.code}: {c.count}</Badge>)}
        </div>
      ) : null}
      <Card>
        <DataTable bare manual rowKey="id" caption="ERP sync errors" data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (errorText(list.error, "Unable to load errors.")) : null} onRetry={list.reload}
          page={page} pageSize={pageSize} total={list.data?.total ?? 0} onPageChange={setPage} onPageSizeChange={(n) => { setPage(1); setPageSize(n); }}
          columns={[
            { key: "createdAt", header: "When", accessor: (r) => formatDateTime(r.createdAt), minWidth: 150 },
            { key: "connection", header: "ERP", accessor: (r) => r.connection.name || `#${r.connection.id}`, minWidth: 140 },
            { key: "capability", header: "Capability", accessor: (r) => r.capabilityLabel },
            { key: "code", header: "Error", render: (_, r) => <Badge tone="error" size="sm">{r.code}</Badge> },
            { key: "scope", header: "Level", accessor: (r) => (r.scope === "RUN" ? "Whole run" : `Record ${r.externalId || (r.recordIndex != null ? `#${r.recordIndex + 1}` : "")}`), hideOnMobile: true },
            { key: "message", header: "Message", minWidth: 240 },
            { key: "retryable", header: "Retryable", accessor: (r) => (r.retryable ? "Yes" : "No") },
            { key: "job", header: "Job", render: (_, r) => (r.job ? <span className="text-caption">#{r.jobId} · {(JOB_STATUS_META[r.job.status] || {}).label} · retries {r.job.retryCount}{r.job.lastRetryAt ? ` (last ${formatDateTime(r.job.lastRetryAt)})` : ""}</span> : `#${r.jobId}`), hideOnMobile: true, minWidth: 200 },
          ]}
          emptyTitle={active ? "No errors match the filters" : "No errors recorded"} emptyDescription={active ? "Try changing the filters." : "Sync errors will appear here when a run or record fails."} />
      </Card>
    </div>
  );
}
