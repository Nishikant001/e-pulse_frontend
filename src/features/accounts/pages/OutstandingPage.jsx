import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import FilterBar from "../../../components/ui/FilterBar";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/tables/DataTable";
import { SearchFilter, SelectFilter } from "../../../components/forms";
import { formatDate, formatINR } from "../../../utils/format";
import { useMastersList } from "../../adminMasters/hooks/useMastersList"; // reused: generic server-driven list state
import { ACCOUNT_PORTALS, accountsApi } from "../api/accountsApi";
import { BucketBadge, Dash, Money } from "../components/accountsUi";
import { distributorOptions, retailerOptions, useLookups } from "../components/accountsHooks";

const EMPTY = { search: "", entityType: "", distributorId: "", retailerId: "", status: "", from: "", to: "" };

/** Outstanding by retailer / distributor — outstanding = invoices − payments − credit notes (claim settlements are shown separately, never netted). */
export default function OutstandingPage({ portal = "admin" }) {
  const cfg = ACCOUNT_PORTALS[portal];
  const api = useMemo(() => accountsApi(portal), [portal]);
  const [filters, setFilters] = useState(EMPTY);
  const lookups = useLookups(api, { distributorId: filters.distributorId });
  const list = useMastersList({ fetcher: api.outstanding, filters, defaultSort: { key: "outstanding", dir: "desc" } });
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v, ...(k === "distributorId" ? { retailerId: "" } : {}) }));
  const keys = Object.keys(EMPTY).filter((k) => cfg.showDistributor || k !== "distributorId");
  const totals = list.data?.totals;

  const columns = useMemo(() => [
    { key: "name", header: "Entity", sortable: true, sticky: true, minWidth: "13rem", accessor: (r) => r.name, render: (v, r) => (<><span className="block font-medium">{v}</span><span className="block text-caption text-ink-subtle">{r.code}</span></>) },
    { key: "entityType", header: "Type", accessor: (r) => r.entityType, render: (v) => (v === "RETAILER" ? "Retailer" : "Distributor") },
    ...(cfg.showDistributor ? [{ key: "distributorName", header: "Distributor", accessor: (r) => r.distributorName, render: (v, r) => (r.entityType === "RETAILER" ? v || <Dash /> : <Dash />) }] : []),
    { key: "invoiceCount", header: "Invoices", sortable: true, align: "right", accessor: (r) => r.invoiceCount },
    { key: "invoiceAmount", header: "Invoice amount", sortable: true, align: "right", accessor: (r) => r.invoiceAmount, render: (v) => <Money value={v} /> },
    { key: "paymentsReceived", header: "Payments received", sortable: true, align: "right", accessor: (r) => r.paymentsReceived, render: (v) => <Money value={v} /> },
    { key: "creditNotes", header: "Credit notes", align: "right", accessor: (r) => r.creditNotes, render: (v) => <Money value={v} /> },
    { key: "claimSettled", header: "Claim settled", align: "right", accessor: (r) => r.claimSettled, render: (v) => (v > 0 ? <Money value={v} /> : <Dash />) },
    { key: "outstanding", header: "Outstanding", sortable: true, align: "right", accessor: (r) => r.outstanding, render: (v, r) => (<><Money value={v} className="font-semibold" />{r.advance > 0 ? <span className="block text-caption text-success-700">+{formatINR(r.advance)} advance</span> : null}</>) },
    { key: "overdue", header: "Overdue", sortable: true, align: "right", accessor: (r) => r.overdue, render: (v) => (v > 0 ? <Money value={v} className="text-error-700" /> : <Dash />) },
    { key: "dueDate", header: "Due date", sortable: true, accessor: (r) => r.dueDate, render: (v) => (v ? formatDate(v) : <Dash />) },
    { key: "ageingBucket", header: "Ageing", accessor: (r) => r.ageingBucket, render: (v) => <BucketBadge bucket={v} /> },
  ], [cfg]);

  return (
    <div>
      <PageHeader title="Outstanding" description="What retailers and distributors still owe: invoices less payments and credit notes. Approved scheme claims are settled in their own account and are not netted here." actions={<IconButton icon={RefreshCw} label="Refresh" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />} />
      <FilterBar className="mb-4" activeCount={keys.filter((k) => filters[k]).length} onReset={() => setFilters(EMPTY)}>
        <SearchFilter value={filters.search} onChange={set("search")} placeholder="Name or code" className="w-full sm:w-64" />
        <SelectFilter label="Entity type" allLabel="All" options={[{ value: "RETAILER", label: "Retailers" }, ...(cfg.showDistributor ? [{ value: "DISTRIBUTOR", label: "Distributors" }] : [])]} value={filters.entityType} onChange={set("entityType")} />
        {cfg.showDistributor ? <SelectFilter label="Distributor" allLabel="All distributors" options={distributorOptions(lookups)} value={filters.distributorId} onChange={set("distributorId")} /> : null}
        <SelectFilter label="Retailer" allLabel="All retailers" options={retailerOptions(lookups, filters.distributorId)} value={filters.retailerId} onChange={set("retailerId")} />
        <SelectFilter label="Balance" allLabel="All" options={[{ value: "outstanding", label: "Outstanding only" }, { value: "overdue", label: "Overdue only" }]} value={filters.status} onChange={set("status")} />
        <Input type="date" label="Invoice date from" value={filters.from} max={filters.to || undefined} onChange={(e) => set("from")(e.target.value)} className="w-40" />
        <Input type="date" label="Invoice date to" value={filters.to} min={filters.from || undefined} onChange={(e) => set("to")(e.target.value)} className="w-40" />
      </FilterBar>
      {totals ? <p className="mb-3 text-body text-ink-muted">Retailers shown: invoiced <b>{formatINR(totals.invoiceAmount)}</b> · outstanding <b>{formatINR(totals.outstanding)}</b> · overdue <b className="text-error-700">{formatINR(totals.overdue)}</b></p> : null}
      <Card>
        <DataTable bare manual rowKey="key" caption="Outstanding" columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (list.error?.message || "Unable to load outstanding. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} sort={list.sort} onSortChange={list.setSort}
          emptyTitle="Nothing outstanding" emptyDescription="No receivables match these filters." />
      </Card>
    </div>
  );
}
