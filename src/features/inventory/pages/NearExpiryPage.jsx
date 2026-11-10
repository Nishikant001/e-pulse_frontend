import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/tables/DataTable";
import { formatINR, formatNumber } from "../../../utils/format";
import { SampleBanner, SourceSwitch } from "../../adminSales/components/SourceControls";
import { useSalesList } from "../../adminSales/hooks/useSalesList";
import BatchDrawer from "../components/BatchDrawer";
import ExpiryBucketKpis from "../components/ExpiryBucketKpis";
import ExpiryCell from "../components/ExpiryCell";
import InventoryFilterBar from "../components/InventoryFilterBar";
import NonSaleableModal from "../components/NonSaleableModal";
import TransferStockModal from "../components/TransferStockModal";
import { buildBatchRowActions } from "../components/batchRowActions";
import { inventoryErrorMessage } from "../api/inventoryErrors";
import { useAsyncData } from "../hooks/useAsyncData";
import { useBatchQuickActions } from "../hooks/useBatchQuickActions";
import { useInventoryScreen } from "../hooks/useInventoryScreen";

const FIELDS = ["search", "distributor", "warehouse", "product", "category", "batch", "bucket", "expiryRange"];
const KEYS = ["q", "distributorId", "warehouseId", "product", "category", "batch", "bucket", "expFrom", "expTo"];
const BUCKET_OPTIONS = [
  { value: "critical", label: "Critical (< 30 days)" },
  { value: "high", label: "Near Expiry (30–59 days)" },
  { value: "medium", label: "Monitor (60–89 days)" },
];

/**
 * Near Expiry — batches within the near-expiry window (not yet expired), by urgency bucket. Reuses Batch Stock
 * (GET /inventory/batches, status=near_expiry) rather than a second listing endpoint. /admin/inventory/near-expiry
 */
export default function NearExpiryPage({ portal = "admin" }) {
  const { isAdmin, source, setSource, api, lookups, expire, isSample } = useInventoryScreen(portal);
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(() => Object.fromEntries(KEYS.map((k) => [k, params.get(k) || ""])));
  const effectiveFilters = useMemo(() => ({ ...filters, status: "near_expiry" }), [filters]);
  const list = useSalesList({ fetcher: api.batches, filters: effectiveFilters, defaultSort: { key: "exp_date", dir: "asc" }, onUnauthorized: expire });
  const { distributorId, warehouseId, product, category, batch } = filters;
  const kpiFilters = useMemo(() => ({ distributorId, warehouseId, product, category, batch }), [distributorId, warehouseId, product, category, batch]);
  const kpi = useAsyncData((signal) => api.expirySummary(kpiFilters, signal), [api, JSON.stringify(kpiFilters)]);
  const quick = useBatchQuickActions(api);

  const openId = params.get("batch");
  const open = (id) => setParams({ batch: String(id) });
  const close = () => setParams({});
  const reloadAll = () => { list.reload(); kpi.reload(); };

  const columns = useMemo(
    () => [
      { key: "product", header: "Product", sortable: true, sticky: true, minWidth: "12rem", accessor: (r) => r.product, render: (v, r) => (<><span className="block font-medium text-ink">{v}</span><span className="block text-caption text-ink-subtle">{r.sku}</span></>) },
      { key: "batch_no", header: "Batch", sortable: true, accessor: (r) => r.batchNo, render: (v, r) => <button type="button" onClick={() => open(r.batchId)} className="whitespace-nowrap font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button> },
      ...(isAdmin ? [{ key: "distributor", header: "Distributor", sortable: true, minWidth: "11rem", accessor: (r) => r.distributor.name }] : []),
      { key: "warehouse", header: "Warehouse", sortable: true, accessor: (r) => r.warehouse.name },
      { key: "exp_date", header: "Expiry", sortable: true, accessor: (r) => r.expDate, render: (v) => (v ? <span className="whitespace-nowrap">{new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span> : <span className="text-ink-subtle">—</span>) },
      { key: "days", header: "Days Remaining", sortable: true, align: "right", accessor: (r) => r.daysToExpiry, render: (v, r) => <ExpiryCell date={r.expDate} days={v} /> },
      { key: "available", header: "Quantity", sortable: true, align: "right", accessor: (r) => r.availableQty, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "value", header: "Stock Value", sortable: true, align: "right", accessor: (r) => r.stockValue, render: (v) => <span className="tabular-nums">{formatINR(v)}</span> },
      { key: "status", header: "Status", accessor: (r) => r.status, render: (v, r) => (<><StatusBadge status={v} domain="inventory" size="sm" /><span className="mt-0.5 block"><StatusBadge status={r.expiryBucket} domain="inventory" size="sm" /></span></>) },
    ],
    [isAdmin], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const rowActions = (row) => buildBatchRowActions(row, { api, portal, onViewBatch: open, onTransfer: quick.openTransfer, onMarkNonSaleable: quick.openNonSaleable });

  return (
    <div>
      <PageHeader
        title="Near Expiry"
        description="Saleable stock nearing expiry, not yet past its date. Critical, Near Expiry and Monitor buckets follow the same 30/60/90-day thresholds as the Admin Dashboard."
        actions={
          <>
            {isAdmin ? <SourceSwitch source={source} onChange={setSource} /> : null}
            <IconButton icon={RefreshCw} label="Refresh" variant="outline" onClick={reloadAll} disabled={list.status === "loading"} />
          </>
        }
      />
      {isSample ? <SampleBanner dateNote={false} /> : null}
      <ExpiryBucketKpis summary={kpi.data} loading={kpi.status === "loading" && !kpi.data} error={kpi.status === "error"} onRetry={kpi.reload} />
      <InventoryFilterBar fields={FIELDS} filters={filters} onChange={setFilters} lookups={lookups} bucketOptions={BUCKET_OPTIONS} showDistributor={isAdmin} searchPlaceholder="SKU, product, batch, distributor, warehouse" />

      <Card>
        <DataTable
          bare manual rowKey="key" caption="Near-expiry batches"
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? inventoryErrorMessage(list.error, "Unable to load near-expiry stock. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort} onRowClick={(r) => open(r.batchId)} rowActions={rowActions}
          emptyTitle="Nothing near expiry" emptyDescription="No saleable batches currently fall in this window."
        />
      </Card>
      <p className="mt-3 text-caption text-ink-subtle">
        KPIs and the Expiry bucket filter count only saleable, active stock — a batch already marked non-saleable for another reason still appears in this list (its Status shows that), but is not counted again in the totals above.
      </p>

      <BatchDrawer batchId={openId} api={api} portal={portal} lookups={lookups} onClose={close} onChanged={reloadAll} />
      <TransferStockModal open={!!quick.transferBatch} onClose={quick.closeTransfer} batch={quick.transferBatch} api={api} lookups={lookups} onDone={reloadAll} />
      <NonSaleableModal open={!!quick.nonSaleableBatch} onClose={quick.closeNonSaleable} batch={quick.nonSaleableBatch} api={api} lookups={lookups} onDone={reloadAll} />
    </div>
  );
}
