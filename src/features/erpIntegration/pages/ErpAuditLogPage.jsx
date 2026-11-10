import { errorText } from "../erpDisplay";
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

const EMPTY = { connectionId: "", capability: "", event: "", status: "", actorId: "", from: "", to: "" };
const TONE = { OK: "success", FAILED: "error", PARTIAL: "warning", INFO: "neutral" };

/** ERP Audit Log — persistent, append-only (read-only here: there is no edit or delete). Credentials are never stored in it. */
export default function ErpAuditLogPage() {
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const conns = useAsyncData((s) => erpApi.list({}, s), []);
  const lookups = useAsyncData((s) => erpApi.lookups(s), []);
  const key = Object.values(filters).join("|");
  const list = useAsyncData((s) => erpSyncApi.audit({ ...filters, page, pageSize }, s), [key, page, pageSize]);
  const set = (k) => (v) => { setPage(1); setFilters((f) => ({ ...f, [k]: v })); };
  const active = Object.values(filters).filter(Boolean).length;
  const bad = filters.from && filters.to && filters.from > filters.to;
  const meta = (m) => { const t = Object.entries(m || {}).map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`).join(" · "); return t.length > 120 ? `${t.slice(0, 120)}…` : t; };
  return (
    <div>
      <PageHeader title="ERP Audit Log" description="Who did what with the ERP integration. Entries cannot be edited or deleted."
        actions={<IconButton icon={RefreshCw} label="Refresh audit log" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />} />
      <FilterBar className="mb-4" activeCount={active} onReset={() => { setPage(1); setFilters(EMPTY); }}>
        <SelectFilter label="ERP" allLabel="All ERPs" options={(conns.data?.items || []).map((c) => ({ value: String(c.id), label: c.name }))} value={filters.connectionId} onChange={set("connectionId")} />
        <SelectFilter label="Capability" allLabel="All capabilities" options={(lookups.data?.capabilities || []).map((c) => ({ value: c.value, label: c.label }))} value={filters.capability} onChange={set("capability")} />
        <SelectFilter label="Event" allLabel="All events" options={(list.data?.events || []).map((e) => ({ value: e, label: e }))} value={filters.event} onChange={set("event")} />
        <SelectFilter label="Status" allLabel="All statuses" options={Object.keys(TONE).map((s) => ({ value: s, label: s }))} value={filters.status} onChange={set("status")} />
        <Input label="User ID" inputMode="numeric" value={filters.actorId} onChange={(e) => set("actorId")(e.target.value.replace(/\D/g, ""))} />
        <Input type="date" label="From" value={filters.from} onChange={(e) => set("from")(e.target.value)} error={bad ? "From is after To" : undefined} />
        <Input type="date" label="To" value={filters.to} onChange={(e) => set("to")(e.target.value)} />
      </FilterBar>
      <Card>
        <DataTable bare manual rowKey="id" caption="ERP audit events" data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (errorText(list.error, "Unable to load the audit log.")) : null} onRetry={list.reload}
          page={page} pageSize={pageSize} total={list.data?.total ?? 0} onPageChange={setPage} onPageSizeChange={(n) => { setPage(1); setPageSize(n); }}
          columns={[
            { key: "at", header: "When", accessor: (r) => formatDateTime(r.at), minWidth: 150 },
            { key: "event", header: "Event", render: (_, r) => <span className="font-mono text-caption">{r.event}</span>, minWidth: 190 },
            { key: "status", header: "Status", render: (_, r) => <Badge tone={TONE[r.status] || "neutral"} size="sm">{r.status}</Badge> },
            { key: "erp", header: "ERP", accessor: (r) => r.erpCode || "—" },
            { key: "capability", header: "Capability", accessor: (r) => r.capability || "—", hideOnMobile: true },
            { key: "actor", header: "User", accessor: (r) => (r.actorAdminId ? `#${r.actorAdminId}` : "System"), hideOnMobile: true },
            { key: "entity", header: "Entity", accessor: (r) => (r.entityType ? `${r.entityType} ${r.entityId ?? ""}` : "—"), hideOnMobile: true },
            { key: "details", header: "Details", accessor: (r) => meta(r.metadata), minWidth: 220, hideOnMobile: true },
            { key: "correlationId", header: "Correlation", accessor: (r) => r.correlationId || "—", hideOnMobile: true },
          ]}
          emptyTitle={active ? "No events match the filters" : "No audit events yet"} emptyDescription={active ? "Try changing the filters." : "ERP activity will be recorded here."} />
      </Card>
    </div>
  );
}
