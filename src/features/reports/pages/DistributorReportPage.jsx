import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import Card from "../../../components/ui/Card";
import PageHeader from "../../../components/ui/PageHeader";
import FilterBar from "../../../components/ui/FilterBar";
import Input from "../../../components/ui/Input";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/tables/DataTable";
import { SearchFilter, SelectFilter } from "../../../components/forms";
import { formatDate, formatDateTime, formatINR, formatNumber } from "../../../utils/format";
import { useMastersList } from "../../adminMasters/hooks/useMastersList"; // generic server-driven list state (page + filters)
import { REPORT_FILTERS, REPORT_SECTIONS, STATUS_OPTIONS, reportsApi } from "../api/reportsApi";

const EMPTY = { q: "", status: "", from: "", to: "" };
const Dash = () => <span className="text-ink-subtle">—</span>;

// One generic, VIEW-ONLY table. The server decides the columns; nothing here can change data (no actions, no forms that post).
function renderCell(type, value) {
  if (value === null || value === undefined || value === "") return <Dash />;
  switch (type) {
    case "money": return <span className="tabular-nums">{formatINR(value)}</span>;
    case "number": return <span className="tabular-nums">{formatNumber(value)}</span>;
    case "date": return typeof value === "string" && value.includes("T") ? formatDateTime(value) : formatDate(value);
    case "status": return <StatusBadge status={String(value)} />;
    default: return typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
  }
}

export default function DistributorReportPage() {
  const { section } = useParams();
  const known = REPORT_SECTIONS.find((s) => s.id === section);
  if (!known) return <Navigate to="/dashboard/reports/sales" replace />;
  return <ReportBody key={section} section={section} label={known.label} />;
}

function ReportBody({ section, label }) {
  const [filters, setFilters] = useState(EMPTY);
  const allowed = REPORT_FILTERS[section] || [];
  const fetcher = useMemo(() => (params, signal) => reportsApi.run(section, params, signal), [section]);
  const list = useMastersList({ fetcher, filters, defaultSort: undefined });
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const data = list.data;

  const columns = useMemo(
    () => (data?.columns || []).map((c, i) => ({
      key: c.key,
      header: c.label,
      sticky: i === 0,
      align: c.type === "money" || c.type === "number" ? "right" : undefined,
      accessor: (r) => r[c.key],
      render: (v) => renderCell(c.type, v),
    })),
    [data?.columns],
  );

  // DataTable keys rows by a property name; report rows come in different shapes, so every row gets a stable synthetic key.
  const rows = useMemo(() => (data?.items || []).map((r, i) => ({ ...r, _rk: `${section}-${list.page}-${i}` })), [data?.items, section, list.page]);
  const totals = data?.totals;
  return (
    <div>
      <PageHeader
        title={`${label} report`}
        description={data?.description || "Read-only report. Nothing on this page can change your data."}
        meta={<span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-caption font-medium text-neutral-700">View only</span>}
      />
      {allowed.length ? (
        <FilterBar className="mb-4" activeCount={allowed.filter((k) => filters[k]).length} onReset={() => setFilters(EMPTY)}>
          {allowed.includes("q") ? <SearchFilter value={filters.q} onChange={set("q")} placeholder="Search" className="w-full sm:w-64" /> : null}
          {allowed.includes("status") && STATUS_OPTIONS[section] ? (
            <SelectFilter label="Status" allLabel="All" options={STATUS_OPTIONS[section].map((s) => ({ value: s, label: s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) }))} value={filters.status} onChange={set("status")} />
          ) : null}
          {allowed.includes("from") ? <Input type="date" label="From" value={filters.from} max={filters.to || undefined} onChange={(e) => set("from")(e.target.value)} className="w-40" /> : null}
          {allowed.includes("to") ? <Input type="date" label="To" value={filters.to} min={filters.from || undefined} onChange={(e) => set("to")(e.target.value)} className="w-40" /> : null}
        </FilterBar>
      ) : null}
      {totals ? (
        <p className="mb-3 text-body text-ink-muted">
          {Object.entries(totals).map(([k, v], i) => (
            <span key={k}>{i ? " · " : ""}{k === "totalAmount" ? "Total" : k === "outstandingAmount" ? "Outstanding" : k}: <b>{formatINR(v)}</b></span>
          ))}
        </p>
      ) : null}
      <Card>
        <DataTable
          bare manual rowKey="_rk" caption={`${label} report`}
          columns={columns} data={rows} loading={list.status === "loading" && !data}
          error={list.status === "error" ? list.error?.message || "Unable to load this report. Please try again." : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          emptyTitle="Nothing to show" emptyDescription="No records match these filters."
        />
      </Card>
    </div>
  );
}
