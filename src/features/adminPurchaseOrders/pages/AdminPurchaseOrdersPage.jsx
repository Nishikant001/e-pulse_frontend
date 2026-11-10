import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import PageHeader from "../../../components/ui/PageHeader";
import FilterBar from "../../../components/ui/FilterBar";
import Input from "../../../components/ui/Input";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/tables/DataTable";
import { SearchFilter, SelectFilter } from "../../../components/forms";
import { formatDate, formatINR } from "../../../utils/format";
import { useMastersList } from "../../adminMasters/hooks/useMastersList";
import { adminPurchaseOrdersApi as api } from "../api/purchaseOrdersApi";

const EMPTY = { q: "", status: "", distributorId: "", from: "", to: "" };
const label = (s) => String(s || "").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

/** Purchase orders created by distributors. Read only — the distributor owns and edits its own orders. */
export default function AdminPurchaseOrdersPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(EMPTY);
  const [lookups, setLookups] = useState({ statuses: [], distributors: [] });
  useEffect(() => { api.lookups().then(setLookups).catch(() => {}); }, []);
  const list = useMastersList({ fetcher: api.list, filters, defaultSort: { key: "createdAt", dir: "desc" } });
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));

  const columns = useMemo(() => [
    { key: "order_number", header: "PO number", sortable: true, sticky: true, accessor: (r) => r.orderNumber, render: (v) => <span className="font-medium text-ink">{v}</span> },
    { key: "orderDate", header: "Date", sortable: true, accessor: (r) => r.orderDate, render: (v) => formatDate(v) },
    { key: "distributor", header: "Distributor", accessor: (r) => r.distributor?.name || "—", render: (v, r) => (<><span className="block">{v}</span><span className="block text-caption text-ink-subtle">{r.distributor?.code}</span></>) },
    { key: "status", header: "Status", sortable: true, accessor: (r) => r.status, render: (v) => <StatusBadge status={v} domain="purchaseOrder" /> },
    { key: "lineCount", header: "Items", align: "right", accessor: (r) => r.lineCount },
    { key: "netValue", header: "Net value", align: "right", accessor: (r) => r.netValue, render: (v) => <span className="tabular-nums">{formatINR(v)}</span> },
    { key: "totalAmount", header: "Total", sortable: true, align: "right", accessor: (r) => r.totalAmount, render: (v) => <span className="font-medium tabular-nums">{formatINR(v)}</span> },
  ], []);

  return (
    <div>
      <PageHeader title="Purchase Orders" description="Orders your distributors create. They reach you automatically — open one to deliver the goods and invoice it." />
      <FilterBar className="mb-4" activeCount={Object.keys(EMPTY).filter((k) => filters[k]).length} onReset={() => setFilters(EMPTY)}>
        <SearchFilter value={filters.q} onChange={set("q")} placeholder="PO number or distributor" className="w-full sm:w-64" />
        <SelectFilter label="Status" allLabel="All statuses" options={lookups.statuses.map((s) => ({ value: s, label: label(s) }))} value={filters.status} onChange={set("status")} />
        <SelectFilter label="Distributor" allLabel="All distributors" options={lookups.distributors.map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }))} value={filters.distributorId} onChange={set("distributorId")} />
        <Input type="date" label="Order date from" value={filters.from} max={filters.to || undefined} onChange={(e) => set("from")(e.target.value)} className="w-40" />
        <Input type="date" label="Order date to" value={filters.to} min={filters.from || undefined} onChange={(e) => set("to")(e.target.value)} className="w-40" />
      </FilterBar>
      <Card>
        <DataTable
          bare manual rowKey="id" caption="Purchase orders" columns={columns} data={list.data?.items || []} loading={list.status === "loading" && !list.data}
          error={list.status === "error" ? list.error?.message || "Unable to load purchase orders. Please try again." : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize} sort={list.sort} onSortChange={list.setSort}
          onRowClick={(r) => navigate(`/admin/purchase-orders/${r.id}`)}
          emptyTitle="No purchase orders yet" emptyDescription="When a distributor creates a purchase order it will appear here."
        />
      </Card>
    </div>
  );
}
