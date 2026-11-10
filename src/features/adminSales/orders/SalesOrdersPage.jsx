import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Ban, CircleCheck, Eye, FileText, RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useDateRange } from "../../../components/layout/dateRangeContext";
import DataTable from "../../../components/tables/DataTable";
import { formatDate, formatINR, formatNumber } from "../../../utils/format";
import SalesFilterBar from "../components/SalesFilterBar";
import SapBadge from "../components/SapBadge";
import { SampleBanner, SourceSwitch } from "../components/SourceControls";
import { useSalesActions } from "../hooks/useSalesActions";
import { useSalesList } from "../hooks/useSalesList";
import { useSalesScreen } from "../hooks/useSalesScreen";
import OrderDrawer from "./OrderDrawer";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "invoiced", label: "Invoiced" },
  { value: "cancelled", label: "Cancelled" },
  { value: "synced", label: "Synced" },
];
const FIELDS = ["search", "date", "distributor", "retailer", "territory", "status", "sap"];
const EMPTY_FILTERS = { q: "", distributorId: "", retailer: "", territory: "", status: "", sap: "" };

/** SalesOrdersPage — /admin/sales/orders. Server-side filtering, search, sorting and pagination. */
export default function SalesOrdersPage() {
  const { source, setSource, api, lookups, expire, isSample } = useSalesScreen();
  const { range } = useDateRange();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const apiFilters = useMemo(() => ({ ...filters, from: range.from, to: range.to }), [filters, range.from, range.to]);
  const list = useSalesList({ fetcher: api.listOrders, filters: apiFilters, defaultSort: { key: "order_date", dir: "desc" }, onUnauthorized: expire });
  const { request, modal } = useSalesActions({ api, onDone: list.reload });

  const openId = params.get("order");
  const open = (id) => setParams({ order: String(id) });
  const close = () => setParams({});

  const columns = [
    { key: "order_number", header: "Order ID", sortable: true, accessor: (r) => r.orderNumber, render: (v, r) => <button type="button" onClick={() => open(r.id)} className="font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button> },
    { key: "order_date", header: "Order date", sortable: true, accessor: (r) => r.orderDate, render: (v) => formatDate(v) },
    { key: "distributor_name", header: "Distributor", sortable: true, accessor: (r) => r.distributor.name, render: (v, r) => (<><span className="block">{v}</span><span className="block text-caption text-ink-subtle">{r.distributor.code}{r.territory ? ` · ${r.territory}` : ""}</span></>) },
    { key: "retailer_name", header: "Retailer", sortable: true, accessor: (r) => r.retailer.name },
    { key: "product_count", header: "Products", sortable: true, align: "right", accessor: (r) => r.productCount },
    { key: "quantity", header: "Quantity", sortable: true, align: "right", accessor: (r) => r.quantity, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
    { key: "amount", header: "Amount", sortable: true, align: "right", accessor: (r) => r.amount, render: (v) => <span className="tabular-nums">{formatINR(v)}</span> },
    { key: "scheme", header: "Scheme", accessor: (r) => r.scheme, render: (v) => v || <span className="text-ink-subtle">—</span> },
    { key: "status", header: "Status", sortable: true, accessor: (r) => r.status, render: (v) => <StatusBadge status={v} domain="salesOrder" /> },
    { key: "sap", header: "SAP sync", accessor: (r) => r.sapStatus, render: (v) => <SapBadge status={v} /> },
  ];

  const rowActions = (row) => {
    const liveOnly = isSample ? "Live only" : undefined;
    const items = [{ key: "view", label: "View details", icon: Eye, onClick: () => open(row.id) }];
    // Phase 2: no "Edit" action — the create/edit order screens were removed from the Admin portal. Confirm / Create invoice / Cancel are unchanged
    // (whether they belong to "sales creation" is a Phase 3 permission decision).
    if (row.actions.includes("confirm")) items.push({ key: "confirm", label: "Confirm", icon: CircleCheck, disabled: isSample, hint: liveOnly, onClick: () => request("confirm", row) });
    if (row.actions.includes("create_invoice")) items.push({ key: "invoice", label: "Create invoice", icon: FileText, disabled: isSample, hint: liveOnly, onClick: () => request("create_invoice", row) });
    if (row.actions.includes("cancel")) items.push({ key: "sep", divider: true }, { key: "cancel", label: "Cancel order", icon: Ban, danger: true, disabled: isSample, hint: liveOnly, onClick: () => request("cancel", row) });
    return items;
  };

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        description="Orders placed by retailers with their distributors, across the network."
        actions={
          <>
            <SourceSwitch source={source} onChange={setSource} />
            <IconButton icon={RefreshCw} label="Refresh orders" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
          </>
        }
      />
      {isSample ? <SampleBanner /> : null}

      <SalesFilterBar fields={FIELDS} filters={filters} onChange={setFilters} lookups={lookups} statusOptions={STATUS_OPTIONS} searchPlaceholder="Order, distributor, retailer, invoice, SAP no." />

      <Card>
        <DataTable
          bare
          manual
          rowKey="id"
          caption="Sales orders"
          columns={columns}
          data={list.data?.items || []}
          loading={list.status === "loading"}
          error={list.status === "error" ? "Unable to load orders. Please try again." : null}
          onRetry={list.reload}
          page={list.page}
          pageSize={list.pageSize}
          total={list.data?.total ?? 0}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          sort={list.sort}
          onSortChange={list.setSort}
          rowActions={rowActions}
          responsive="cards"
          cardTitleKey="order_number"
          emptyTitle="No sales orders found"
          emptyDescription="Try changing the filters or the date range."
        />
      </Card>

      <OrderDrawer orderId={openId} api={api} isSample={isSample} onClose={close} onChanged={list.reload} />
      {modal}
    </div>
  );
}
