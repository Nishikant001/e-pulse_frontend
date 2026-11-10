import { useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import FilterBar from "../../../components/ui/FilterBar";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/tables/DataTable";
import { SearchFilter, SelectFilter } from "../../../components/forms";
import { formatDate, formatINR } from "../../../utils/format";
import { useMastersList } from "../../adminMasters/hooks/useMastersList";
import { ACCOUNT_PORTALS, MODE_LABEL, accountsApi } from "../api/accountsApi";
import { Dash, Money } from "../components/accountsUi";
import { distributorOptions, retailerOptions, useLookups } from "../components/accountsHooks";
import RecordPaymentModal from "../components/RecordPaymentModal";

const EMPTY = { search: "", distributorId: "", retailerId: "", mode: "", from: "", to: "" };

/** Payments received. Admin can record one; the Distributor view is read-only. */
export default function PaymentsPage({ portal = "admin" }) {
  const cfg = ACCOUNT_PORTALS[portal];
  const api = useMemo(() => accountsApi(portal), [portal]);
  const [filters, setFilters] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const lookups = useLookups(api, portal === "admin" ? {} : {});
  const list = useMastersList({ fetcher: api.payments, filters, defaultSort: { key: "date", dir: "desc" } });
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v, ...(k === "distributorId" ? { retailerId: "" } : {}) }));
  const keys = Object.keys(EMPTY).filter((k) => cfg.showDistributor || k !== "distributorId");

  const columns = useMemo(() => [
    { key: "number", header: "Payment", sortable: true, sticky: true, minWidth: "10rem", accessor: (r) => r.number, render: (v) => <span className="font-medium">{v}</span> },
    { key: "date", header: "Date", sortable: true, accessor: (r) => r.date, render: (v) => formatDate(v) },
    { key: "retailer", header: "Retailer", accessor: (r) => r.retailer?.name, minWidth: "11rem", render: (v, r) => (<><span className="block">{v || <Dash />}</span><span className="block text-caption text-ink-subtle">{r.retailer?.code}</span></>) },
    ...(cfg.showDistributor ? [{ key: "distributor", header: "Distributor", accessor: (r) => r.distributor?.name, render: (v) => v || <Dash /> }] : []),
    { key: "amount", header: "Amount", sortable: true, align: "right", accessor: (r) => r.amount, render: (v) => <Money value={v} className="font-semibold" /> },
    { key: "mode", header: "Mode", accessor: (r) => r.mode, render: (v) => MODE_LABEL[v] || v },
    { key: "referenceNo", header: "Reference", accessor: (r) => r.referenceNo, render: (v) => v || <Dash /> },
    { key: "allocations", header: "Allocated to", minWidth: "12rem", accessor: (r) => r.allocatedAmount, render: (v, r) => (r.allocations.length ? <><span className="block">{r.allocations.map((a) => a.invoiceNumber || `#${a.invoiceId}`).join(", ")}</span>{r.unallocatedAmount > 0 ? <span className="block text-caption text-ink-subtle">{formatINR(r.unallocatedAmount)} unapplied</span> : null}</> : <span className="text-ink-subtle">Unapplied</span>) },
    ...(cfg.showDistributor ? [{ key: "createdBy", header: "Recorded by", accessor: (r) => r.createdBy?.name, render: (v) => v || <Dash /> }] : []),
    { key: "remarks", header: "Remarks", minWidth: "12rem", accessor: (r) => r.remarks, render: (v) => v || <Dash /> },
  ], [cfg]);

  return (
    <div>
      <PageHeader title="Payments" description={cfg.canWrite ? "Payments received from retailers. Recording a payment posts it to the ledger and reduces outstanding." : "Payments received on your retailers' accounts."}
        actions={<><IconButton icon={RefreshCw} label="Refresh" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />{cfg.canWrite ? <Button leftIcon={Plus} onClick={() => setOpen(true)}>Record payment</Button> : null}</>} />
      <FilterBar className="mb-4" activeCount={keys.filter((k) => filters[k]).length} onReset={() => setFilters(EMPTY)}>
        <SearchFilter value={filters.search} onChange={set("search")} placeholder="Payment no., reference, retailer" className="w-full sm:w-72" />
        {cfg.showDistributor ? <SelectFilter label="Distributor" allLabel="All distributors" options={distributorOptions(lookups)} value={filters.distributorId} onChange={set("distributorId")} /> : null}
        <SelectFilter label="Retailer" allLabel="All retailers" options={retailerOptions(lookups, filters.distributorId)} value={filters.retailerId} onChange={set("retailerId")} />
        <SelectFilter label="Mode" allLabel="All modes" options={Object.entries(MODE_LABEL).map(([value, label]) => ({ value, label }))} value={filters.mode} onChange={set("mode")} />
        <Input type="date" label="From" value={filters.from} max={filters.to || undefined} onChange={(e) => set("from")(e.target.value)} className="w-40" />
        <Input type="date" label="To" value={filters.to} min={filters.from || undefined} onChange={(e) => set("to")(e.target.value)} className="w-40" />
      </FilterBar>
      {list.data ? <p className="mb-3 text-body text-ink-muted">{list.data.total} payment{list.data.total === 1 ? "" : "s"} · total <b>{formatINR(list.data.totalAmount)}</b></p> : null}
      <Card>
        <DataTable bare manual rowKey="id" caption="Payments" columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (list.error?.message || "Unable to load payments.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} sort={list.sort} onSortChange={list.setSort}
          emptyTitle="No payments found" emptyDescription={cfg.canWrite ? "Record a payment when money is received from a retailer." : "No payments match these filters."} />
      </Card>
      {cfg.canWrite ? <RecordPaymentModal open={open} onClose={() => setOpen(false)} api={api} lookups={lookups} onDone={list.reload} /> : null}
    </div>
  );
}
