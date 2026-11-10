import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Building2, CalendarDays, CalendarRange, FileText, IndianRupee, Package, RefreshCw, Store } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import KpiCard from "../../../components/ui/KpiCard";
import PageHeader from "../../../components/ui/PageHeader";
import { useDateRange } from "../../../components/layout/dateRangeContext";
import DataTable from "../../../components/tables/DataTable";
import { AdminApiError } from "../../../utils/adminApi";
import { formatDate, formatINR, formatINRCompact, formatNumber } from "../../../utils/format";
import SalesFilterBar from "../components/SalesFilterBar";
import SapBadge from "../components/SapBadge";
import { SampleBanner, SourceSwitch } from "../components/SourceControls";
import { useSalesList } from "../hooks/useSalesList";
import { useSalesScreen } from "../hooks/useSalesScreen";
import { DistributorChart, ProductChart, TrendChart } from "./SecondaryCharts";
import SecondaryDrawer from "./SecondaryDrawer";

const FIELDS = ["search", "date", "distributor", "retailer", "product", "category", "territory", "batch", "sap"];
const EMPTY_FILTERS = { q: "", distributorId: "", retailer: "", product: "", category: "", territory: "", batch: "", sap: "" };

/**
 * SecondarySalesPage — /admin/sales/secondary: distributor → retailer sales at invoice-line × batch level.
 * KPIs, charts and the table all follow the same filters; the table is paginated on the server.
 */
export default function SecondarySalesPage() {
  const { source, setSource, api, lookups, expire, isSample } = useSalesScreen();
  const { range } = useDateRange();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const apiFilters = useMemo(() => ({ ...filters, from: range.from, to: range.to }), [filters, range.from, range.to]);
  const list = useSalesList({ fetcher: api.listSecondary, filters: apiFilters, defaultSort: { key: "invoice_date", dir: "desc" }, onUnauthorized: expire });

  // KPI strip + charts: ONE request for the current filters (aborted when they change).
  const [summary, setSummary] = useState({ status: "loading", data: null });
  const [attempt, setAttempt] = useState(0);
  const filterKey = JSON.stringify(apiFilters);
  useEffect(() => {
    const controller = new AbortController();
    setSummary((s) => ({ status: "loading", data: s.data }));
    Promise.resolve(api.secondarySummary(apiFilters, controller.signal))
      .then((data) => setSummary({ status: "ready", data }))
      .catch((error) => {
        if (error?.name === "AbortError") return;
        if (error instanceof AdminApiError && error.status === 401) expire();
        setSummary({ status: "error", data: null });
      });
    return () => controller.abort();
    // filterKey stands for apiFilters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, api, attempt]);
  const reloadAll = () => {
    list.reload();
    setAttempt((n) => n + 1);
  };

  const loading = summary.status === "loading";
  const k = summary.data?.kpis;
  const data = summary.status === "error" ? null : summary.data;

  const recordKey = params.get("record");
  const open = (key) => setParams({ record: key });
  const close = () => setParams({});

  const columns = [
    { key: "invoice_number", header: "Invoice No", sortable: true, sticky: true, accessor: (r) => r.invoiceNumber, cellClassName: "font-medium" },
    { key: "distributor_name", header: "Distributor", sortable: true, accessor: (r) => r.distributor.name },
    { key: "retailer_name", header: "Retailer", sortable: true, accessor: (r) => r.retailer.name },
    { key: "product", header: "Product", sortable: true, accessor: (r) => r.product },
    { key: "batch", header: "Batch", accessor: (r) => r.batchNo, render: (v) => v || <span className="text-ink-subtle">—</span> },
    { key: "quantity", header: "Quantity", sortable: true, align: "right", accessor: (r) => r.quantity, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
    { key: "mrp", header: "MRP", align: "right", accessor: (r) => r.mrp, render: (v) => (v === null ? <span className="text-ink-subtle">—<span className="sr-only">Not available</span></span> : formatINR(v)) },
    { key: "net_value", header: "Net value", sortable: true, align: "right", accessor: (r) => r.netValue, render: (v) => <span className="tabular-nums">{formatINR(v)}</span> },
    { key: "scheme", header: "Scheme", accessor: (r) => r.scheme, render: (v) => v || <span className="text-ink-subtle">—</span> },
    { key: "gst", header: "GST", sortable: true, align: "right", accessor: (r) => r.gst, render: (v) => <span className="tabular-nums">{formatINR(v)}</span> },
    { key: "invoice_date", header: "Date", sortable: true, accessor: (r) => r.invoiceDate, render: (v) => formatDate(v) },
    { key: "sap", header: "SAP status", accessor: (r) => r.sapStatus, render: (v) => <SapBadge status={v} /> },
  ];

  const cards = [
    ["Total Secondary Sales", IndianRupee, "brand", k && formatINRCompact(k.totalSecondarySales), "net of GST, selected period"],
    ["Today's Secondary Sales", CalendarDays, "info", k && formatINRCompact(k.todaysSecondarySales), "today"],
    ["Monthly Secondary Sales", CalendarRange, "info", k && formatINRCompact(k.monthlySecondarySales), "this month"],
    ["Active Distributors", Building2, "success", k && formatNumber(k.activeDistributors), "in selected period"],
    ["Active Retailers", Store, "brand", k && formatNumber(k.activeRetailers), "in selected period"],
    ["Total Invoices", FileText, "warning", k && formatNumber(k.totalInvoices), "in selected period"],
    ["Total Quantity", Package, "warning", k && formatNumber(k.totalQuantity), "units, selected period"],
  ];

  return (
    <div>
      <PageHeader
        title="Secondary Sales"
        description="Sales from distributors to retailers, by invoice line and batch. Only posted, partially paid and paid invoices count."
        actions={
          <>
            <SourceSwitch source={source} onChange={setSource} />
            <IconButton icon={RefreshCw} label="Refresh secondary sales" variant="outline" onClick={reloadAll} disabled={loading || list.status === "loading"} />
          </>
        }
      />
      {isSample ? <SampleBanner /> : null}

      <SalesFilterBar fields={FIELDS} filters={filters} onChange={setFilters} lookups={lookups} searchPlaceholder="Invoice, distributor, retailer, product, batch" />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, icon, status, value, note]) => (
          <KpiCard key={title} title={title} icon={icon} status={status} loading={loading} error={summary.status === "error"} onRetry={() => setAttempt((n) => n + 1)} value={value} comparison={note} />
        ))}
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <TrendChart summary={data} loading={loading} />
        </div>
        <DistributorChart summary={data} loading={loading} />
      </div>
      <div className="mb-4">
        <ProductChart summary={data} loading={loading} />
      </div>

      <Card>
        <DataTable
          bare
          manual
          rowKey="key"
          caption="Secondary sales by invoice line and batch"
          columns={columns}
          data={list.data?.items || []}
          loading={list.status === "loading"}
          error={list.status === "error" ? "Unable to load secondary sales. Please try again." : null}
          onRetry={list.reload}
          page={list.page}
          pageSize={list.pageSize}
          total={list.data?.total ?? 0}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          sort={list.sort}
          onSortChange={list.setSort}
          onRowClick={(r) => open(r.key)}
          responsive="cards"
          cardTitleKey="invoice_number"
          emptyTitle="No secondary sales found"
          emptyDescription="Try changing the filters or the date range."
        />
      </Card>

      <SecondaryDrawer recordKey={recordKey} api={api} onClose={close} />
    </div>
  );
}
