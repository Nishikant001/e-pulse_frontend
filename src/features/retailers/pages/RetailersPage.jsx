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
import { useMastersList } from "../../adminMasters/hooks/useMastersList"; // reused: generic server-driven list state
import { RETAILER_PORTALS, retailerLabels, retailersApi } from "../api/retailersApi";
import { RetailerStatusDialog } from "../components/RetailerDialogs";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
];
const toOptions = (arr) => (arr || []).map((v) => ({ value: v, label: v }));
const Dash = () => <span className="text-ink-subtle">—</span>;

/** Retailer list — /admin/masters/customers ("Customer Master": all customer records, distributor filter) and /dashboard/customers (own customers only). */
export default function RetailersPage({ portal = "distributor" }) {
  const cfg = RETAILER_PORTALS[portal];
  const L = retailerLabels(portal);
  const navigate = useNavigate();
  const api = useMemo(() => retailersApi(portal), [portal]);
  const KEYS = useMemo(() => (cfg.showDistributor ? ["q", "status", "distributorId", "state", "city", "territory"] : ["q", "status", "state", "city", "territory"]), [cfg.showDistributor]);
  const [filters, setFilters] = useState(() => Object.fromEntries(["q", "status", "distributorId", "state", "city", "territory"].map((k) => [k, ""])));
  const [lookups, setLookups] = useState({});
  const [statusTarget, setStatusTarget] = useState(null);
  const list = useMastersList({ fetcher: api.list, filters, defaultSort: { key: "name", dir: "asc" } });

  useEffect(() => {
    const c = new AbortController();
    api.lookups(c.signal).then(setLookups).catch(() => {}); // filter options are optional; the list itself reports errors
    return () => c.abort();
  }, [api]);

  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const open = (id) => navigate(`${cfg.base}/${id}`);

  const columns = useMemo(() => {
    const cols = [
      {
        key: "name", header: L.Noun, sortable: true, sticky: true, minWidth: "15rem", accessor: (r) => r.name,
        render: (v, r) => (
          <button type="button" onClick={() => navigate(`${cfg.base}/${r.id}`)} className="block text-left">
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
    ];
    if (cfg.showDistributor) {
      cols.push({
        key: "distributor", header: "Distributor", sortable: true, minWidth: "12rem", accessor: (r) => r.distributor?.name,
        render: (v, r) => (
          <>
            <span className="block">{v || <Dash />}</span>
            <span className="block text-caption text-ink-subtle">{r.distributor?.code}</span>
          </>
        ),
      });
    }
    cols.push(
      { key: "city", header: "City", sortable: true, accessor: (r) => r.city, render: (v) => v || <Dash /> },
      { key: "state", header: "State", sortable: true, accessor: (r) => r.state, render: (v) => v || <Dash /> },
      { key: "territory", header: "Territory", sortable: true, accessor: (r) => r.territory, render: (v) => v || <Dash /> },
      { key: "gstin", header: "GSTIN", accessor: (r) => r.gstin, render: (v) => (v ? <span className="whitespace-nowrap font-mono text-caption">{v}</span> : <Dash />) },
      { key: "status", header: "Status", sortable: true, accessor: (r) => r.status, render: (v) => <StatusBadge status={v} domain="distributor" /> },
      { key: "createdAt", header: "Created", sortable: true, accessor: (r) => r.createdAt, render: (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : <Dash />) },
    );
    return cols;
  }, [cfg, navigate, L.Noun]);

  return (
    <div>
      <PageHeader
        title={portal === "admin" ? "Customer Master" : "Customers"}
        description={
          portal === "admin"
            ? "Every customer record across all distributors. Only an administrator can move a customer to a different distributor."
            : "Your customers — add a customer with full business, contact, tax and address details, and edit them any time. Which distributor a customer belongs to is controlled by the administrator."
        }
        actions={
          <>
            <IconButton icon={RefreshCw} label={`Refresh ${L.nouns}`} variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
            <Button leftIcon={Plus} onClick={() => navigate(`${cfg.base}/new`)}>{`Add ${L.noun}`}</Button>
          </>
        }
      />

      <FilterBar className="mb-4" activeCount={KEYS.filter((k) => filters[k]).length} onReset={() => setFilters(Object.fromEntries(["q", "status", "distributorId", "state", "city", "territory"].map((k) => [k, ""])))}>
        <SearchFilter value={filters.q} onChange={set("q")} placeholder="Name, code, contact, email, phone, GSTIN" className="w-full sm:w-72" />
        <StatusFilter domain="distributor" options={STATUS_OPTIONS} value={filters.status} onChange={set("status")} />
        {cfg.showDistributor ? (
          <SelectFilter label="Distributor" allLabel="All distributors" options={(lookups.distributors || []).map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }))} value={filters.distributorId} onChange={set("distributorId")} />
        ) : null}
        <SelectFilter label="State" allLabel="All states" options={toOptions(lookups.states)} value={filters.state} onChange={set("state")} />
        <SelectFilter label="City" allLabel="All cities" options={toOptions(lookups.cities)} value={filters.city} onChange={set("city")} />
        <SelectFilter label="Territory" allLabel="All territories" options={toOptions(lookups.territories)} value={filters.territory} onChange={set("territory")} />
      </FilterBar>

      <Card>
        <DataTable
          bare manual rowKey="id" caption={L.Nouns}
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (list.error?.message || `Unable to load ${L.nouns}. Please try again.`) : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort} onRowClick={(r) => open(r.id)}
          rowActions={(row) => {
            const actions = [
              { key: "view", label: `View ${L.noun}`, icon: Eye, onClick: () => open(row.id) },
              { key: "edit", label: `Edit ${L.noun}`, icon: Pencil, onClick: () => navigate(`${cfg.base}/${row.id}/edit`) },
            ];
            // A distributor cannot approve a PENDING record (admin only), so the action is not offered.
            if (row.status === "active") actions.push({ key: "deactivate", label: "Deactivate", icon: PowerOff, onClick: () => setStatusTarget(row) });
            else if (portal === "admin" || row.status === "inactive") actions.push({ key: "activate", label: "Activate", icon: Power, onClick: () => setStatusTarget(row) });
            return actions;
          }}
          emptyTitle={`No ${L.nouns} found`} emptyDescription={portal === "admin" ? `Try changing the filters, or add a ${L.noun}.` : "You have no customers yet — add your first one."}
        />
      </Card>

      <RetailerStatusDialog api={api} retailer={statusTarget} open={Boolean(statusTarget)} onClose={() => setStatusTarget(null)} onChanged={list.reload} />
    </div>
  );
}
