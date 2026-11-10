import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Plus, Power, PowerOff, RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import FilterBar from "../../../components/ui/FilterBar";
import DataTable from "../../../components/tables/DataTable";
import { SearchFilter, SelectFilter } from "../../../components/forms";
import { formatDate } from "../../../utils/format";
import { useMastersList } from "../../adminMasters/hooks/useMastersList"; // reused: generic server-driven list state
import { SCHEME_BASE, schemesApi } from "../api/schemesApi";
import SchemeStatusDialog from "../components/SchemeStatusDialog";

const EMPTY = { q: "", status: "", type: "", validity: "", productId: "", distributorId: "" };
const KEYS = Object.keys(EMPTY);
const Dash = () => <span className="text-ink-subtle">—</span>;
const TYPE_LABEL = { QUANTITY_FREE: "Quantity (free goods)", PERCENT_DISCOUNT: "Percentage", FIXED_DISCOUNT: "Fixed amount" };

/** Scheme Master — /admin/masters/schemes (Admin only). */
export default function SchemesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(EMPTY);
  const [lookups, setLookups] = useState({});
  const [target, setTarget] = useState(null);
  const list = useMastersList({ fetcher: schemesApi.list, filters, defaultSort: { key: "createdAt", dir: "desc" } });

  useEffect(() => {
    const c = new AbortController();
    schemesApi.lookups({}, c.signal).then(setLookups).catch(() => {});
    return () => c.abort();
  }, []);

  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const open = (id) => navigate(`${SCHEME_BASE}/${id}`);

  const columns = useMemo(() => [
    {
      key: "name", header: "Scheme", sortable: true, sticky: true, minWidth: "15rem", accessor: (r) => r.name,
      render: (v, r) => (
        <button type="button" onClick={() => open(r.id)} className="block text-left">
          <span className="block font-medium text-brand-700 underline-offset-2 hover:underline">{v}</span>
          <span className="block text-caption text-ink-subtle">{r.code}</span>
        </button>
      ),
    },
    { key: "type", header: "Type", sortable: true, minWidth: "12rem", accessor: (r) => r.type, render: (v, r) => (<><span className="block">{TYPE_LABEL[v] || v}</span><span className="block text-caption text-ink-subtle">{r.ruleSummary}</span></>) },
    { key: "products", header: "Products", accessor: (r) => r.productSummary, render: (v) => v || <Dash /> },
    { key: "applicability", header: "Applicability", minWidth: "12rem", accessor: (r) => r.applicability, render: (v) => (v || []).slice(1).map((a) => <span key={a} className="block text-caption">{a}</span>) },
    { key: "validFrom", header: "Valid from", sortable: true, accessor: (r) => r.validFrom, render: (v) => formatDate(v) },
    { key: "validTo", header: "Valid to", sortable: true, accessor: (r) => r.validTo, render: (v) => (v ? formatDate(v) : "No end date") },
    { key: "priority", header: "Priority", sortable: true, accessor: (r) => r.priority, render: (v) => <span className="tabular-nums">{v}</span> },
    { key: "status", header: "Status", sortable: true, accessor: (r) => r.effectiveStatus, render: (v) => <StatusBadge status={v} domain="scheme" /> },
    { key: "createdAt", header: "Created", sortable: true, accessor: (r) => r.createdAt, render: (v) => (v ? formatDate(v) : <Dash />) },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [navigate]);

  return (
    <div>
      <PageHeader
        title="Schemes"
        description="Commercial schemes configured by the administrator. Lower priority number wins; schemes never stack, and equal priorities on the same product are flagged as a conflict."
        actions={(
          <>
            <IconButton icon={RefreshCw} label="Refresh schemes" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
            <Button leftIcon={Plus} onClick={() => navigate(`${SCHEME_BASE}/new`)}>Add scheme</Button>
          </>
        )}
      />

      <FilterBar className="mb-4" activeCount={KEYS.filter((k) => filters[k]).length} onReset={() => setFilters(EMPTY)}>
        <SearchFilter value={filters.q} onChange={set("q")} placeholder="Scheme name or code" className="w-full sm:w-72" />
        <SelectFilter label="Status" allLabel="All statuses" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} value={filters.status} onChange={set("status")} />
        <SelectFilter label="Type" allLabel="All types" options={(lookups.types || []).map((t) => ({ value: t.value, label: t.label }))} value={filters.type} onChange={set("type")} />
        <SelectFilter label="Validity" allLabel="Any validity" options={[{ value: "current", label: "Currently valid" }, { value: "upcoming", label: "Upcoming" }, { value: "expired", label: "Expired" }]} value={filters.validity} onChange={set("validity")} />
        <SelectFilter label="Product" allLabel="All products" options={(lookups.products || []).map((p) => ({ value: String(p.id), label: `${p.name} (${p.code || p.id})` }))} value={filters.productId} onChange={set("productId")} />
        <SelectFilter label="Distributor" allLabel="All distributors" options={(lookups.distributors || []).map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }))} value={filters.distributorId} onChange={set("distributorId")} />
      </FilterBar>

      <Card>
        <DataTable
          bare manual rowKey="id" caption="Schemes"
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (list.error?.message || "Unable to load schemes. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort} onRowClick={(r) => open(r.id)}
          rowActions={(row) => [
            { key: "view", label: "View scheme", icon: Eye, onClick: () => open(row.id) },
            { key: "edit", label: "Edit scheme", icon: Pencil, onClick: () => navigate(`${SCHEME_BASE}/${row.id}/edit`) },
            row.status === "active"
              ? { key: "deactivate", label: "Deactivate", icon: PowerOff, onClick: () => setTarget(row) }
              : { key: "activate", label: "Activate", icon: Power, onClick: () => setTarget(row) },
          ]}
          emptyTitle="No schemes found" emptyDescription="Try changing the filters, or add a scheme."
        />
      </Card>

      <SchemeStatusDialog scheme={target} open={Boolean(target)} onClose={() => setTarget(null)} onChanged={list.reload} />
    </div>
  );
}
