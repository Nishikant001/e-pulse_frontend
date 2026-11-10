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
import { SearchFilter, SelectFilter, StatusFilter } from "../../../components/forms";
import { formatINR, formatNumber } from "../../../utils/format";
import { useMastersList } from "../../adminMasters/hooks/useMastersList"; // reused: generic server-driven list state
import { distributorsApi } from "../api/distributorsApi";
import StatusChangeDialog from "../components/StatusChangeDialog";

const KEYS = ["q", "status", "state", "city", "territory"];
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];
const toOptions = (arr) => (arr || []).map((v) => ({ value: v, label: v }));
const Dash = () => <span className="text-ink-subtle">—</span>;

/** Distributor Management list — /admin/distributors */
export default function DistributorsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(() => Object.fromEntries(KEYS.map((k) => [k, ""])));
  const [lookups, setLookups] = useState({});
  const [statusTarget, setStatusTarget] = useState(null);
  const list = useMastersList({ fetcher: distributorsApi.list, filters, defaultSort: { key: "name", dir: "asc" } });

  useEffect(() => {
    const c = new AbortController();
    distributorsApi.lookups(c.signal).then(setLookups).catch(() => {}); // filter options are optional; the list itself reports errors
    return () => c.abort();
  }, []);

  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const open = (id) => navigate(`/admin/distributors/${id}`);

  const columns = useMemo(
    () => [
      {
        key: "name", header: "Distributor", sortable: true, sticky: true, minWidth: "15rem", accessor: (r) => r.name,
        render: (v, r) => (
          <button type="button" onClick={() => navigate(`/admin/distributors/${r.id}`)} className="block text-left">
            <span className="block font-medium text-brand-700 underline-offset-2 hover:underline">{v}</span>
            <span className="block text-caption text-ink-subtle">{r.code}</span>
          </button>
        ),
      },
      {
        key: "contact", header: "Contact", minWidth: "13rem", accessor: (r) => r.contactPerson,
        render: (v, r) => (
          <>
            <span className="block">{v || <Dash />}</span>
            <span className="block text-caption text-ink-subtle">{[r.phone, r.email].filter(Boolean).join(" · ") || "—"}</span>
          </>
        ),
      },
      { key: "city", header: "City", sortable: true, accessor: (r) => r.city, render: (v) => v || <Dash /> },
      { key: "state", header: "State", sortable: true, accessor: (r) => r.state, render: (v) => v || <Dash /> },
      { key: "territory", header: "Territory", sortable: true, accessor: (r) => r.territory, render: (v) => v || <Dash /> },
      { key: "gstin", header: "GSTIN", accessor: (r) => r.gstin, render: (v) => (v ? <span className="whitespace-nowrap font-mono text-caption">{v}</span> : <Dash />) },
      { key: "creditLimit", header: "Credit limit", sortable: true, align: "right", accessor: (r) => r.creditLimit, render: (v) => (v != null ? <span className="tabular-nums">{formatINR(v)}</span> : <Dash />) },
      { key: "retailers", header: "Retailers", sortable: true, align: "right", accessor: (r) => r.retailerCount, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "status", header: "Status", sortable: true, accessor: (r) => r.status, render: (v) => <StatusBadge status={v} domain="distributor" /> },
    ],
    [navigate],
  );

  return (
    <div>
      <PageHeader
        title="Distributors"
        description="Every distributor on the platform — business identity, contact, territory and account status. Orders, invoices and payments are kept when a distributor is deactivated."
        actions={
          <>
            <IconButton icon={RefreshCw} label="Refresh distributors" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
            <Button leftIcon={Plus} onClick={() => navigate("/admin/distributors/new")}>Add distributor</Button>
          </>
        }
      />

      <FilterBar
        className="mb-4"
        activeCount={KEYS.filter((k) => filters[k]).length}
        onReset={() => setFilters(Object.fromEntries(KEYS.map((k) => [k, ""])))}
      >
        <SearchFilter value={filters.q} onChange={set("q")} placeholder="Name, code, contact, email, phone, GSTIN" className="w-full sm:w-72" />
        <StatusFilter domain="distributor" options={STATUS_OPTIONS} value={filters.status} onChange={set("status")} />
        <SelectFilter label="State" allLabel="All states" options={toOptions(lookups.states)} value={filters.state} onChange={set("state")} />
        <SelectFilter label="City" allLabel="All cities" options={toOptions(lookups.cities)} value={filters.city} onChange={set("city")} />
        <SelectFilter label="Territory" allLabel="All territories" options={toOptions(lookups.territories)} value={filters.territory} onChange={set("territory")} />
      </FilterBar>

      <Card>
        <DataTable
          bare manual rowKey="id" caption="Distributors"
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (list.error?.message || "Unable to load distributors. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort} onRowClick={(r) => open(r.id)}
          rowActions={(row) => [
            { key: "view", label: "View profile", icon: Eye, onClick: () => open(row.id) },
            { key: "edit", label: "Edit distributor", icon: Pencil, onClick: () => navigate(`/admin/distributors/${row.id}/edit`) },
            row.status === "active"
              ? { key: "deactivate", label: "Deactivate", icon: PowerOff, onClick: () => setStatusTarget(row) }
              : { key: "activate", label: "Activate", icon: Power, onClick: () => setStatusTarget(row) },
          ]}
          emptyTitle="No distributors found" emptyDescription="Try changing the filters, or add a new distributor."
        />
      </Card>

      <StatusChangeDialog distributor={statusTarget} open={Boolean(statusTarget)} onClose={() => setStatusTarget(null)} onChanged={list.reload} />
    </div>
  );
}
