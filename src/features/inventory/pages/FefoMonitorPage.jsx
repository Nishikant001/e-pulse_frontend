import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Calculator, RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/tables/DataTable";
import { formatDate, formatINR, formatNumber } from "../../../utils/format";
import { SampleBanner, SourceSwitch } from "../../adminSales/components/SourceControls";
import { useSalesList } from "../../adminSales/hooks/useSalesList";
import BatchDrawer from "../components/BatchDrawer";
import ExpiryCell from "../components/ExpiryCell";
import FefoPreviewModal from "../components/FefoPreviewModal";
import InventoryFilterBar from "../components/InventoryFilterBar";
import NonSaleableModal from "../components/NonSaleableModal";
import TransferStockModal from "../components/TransferStockModal";
import { buildBatchRowActions } from "../components/batchRowActions";
import { inventoryErrorMessage } from "../api/inventoryErrors";
import { useBatchQuickActions } from "../hooks/useBatchQuickActions";
import { useInventoryScreen } from "../hooks/useInventoryScreen";

const FIELDS = ["search", "distributor", "warehouse", "product", "category", "batch", "bucket"];
const KEYS = ["q", "distributorId", "warehouseId", "product", "category", "batch", "bucket"];

/**
 * FEFO Monitor — batches a normal sale could currently draw from (not expired, not non-saleable, in stock), in the
 * same earliest-expiry-first order inventory.service.allocateStock actually consumes them in, with each row's
 * 1-based Priority in its (distributor, warehouse, product) group. Reuses Batch Stock (GET /inventory/batches) with
 * fefoEligible=1 — not a second batch-listing endpoint. /admin/inventory/fefo · /dashboard/inventory/fefo
 */
export default function FefoMonitorPage({ portal = "admin" }) {
  const { isAdmin, source, setSource, api, lookups, expire, isSample } = useInventoryScreen(portal);
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(() => Object.fromEntries(KEYS.map((k) => [k, params.get(k) || ""])));
  const effectiveFilters = useMemo(() => ({ ...filters, fefoEligible: "1" }), [filters]);
  const list = useSalesList({ fetcher: api.batches, filters: effectiveFilters, defaultSort: { key: "priority", dir: "asc" }, onUnauthorized: expire });
  const quick = useBatchQuickActions(api);
  const [previewRow, setPreviewRow] = useState(null);

  const openId = params.get("batch");
  const open = (id) => setParams({ batch: String(id) });
  const close = () => setParams({});

  const columns = useMemo(
    () => [
      { key: "priority", header: "Priority", sortable: true, sticky: true, align: "right", accessor: (r) => r.priority, render: (v) => <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-100 px-1.5 text-caption font-semibold text-brand-800 tabular-nums">{v}</span> },
      { key: "product", header: "Product", sortable: true, minWidth: "12rem", accessor: (r) => r.product, render: (v, r) => (<><span className="block font-medium text-ink">{v}</span><span className="block text-caption text-ink-subtle">{r.category}</span></>) },
      { key: "sku", header: "SKU", sortable: true, accessor: (r) => r.sku },
      { key: "batch_no", header: "Batch", sortable: true, accessor: (r) => r.batchNo, render: (v, r) => <button type="button" onClick={() => open(r.batchId)} className="whitespace-nowrap font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button> },
      ...(isAdmin ? [{ key: "distributor", header: "Distributor", sortable: true, minWidth: "11rem", accessor: (r) => r.distributor.name }] : []),
      { key: "warehouse", header: "Warehouse", sortable: true, accessor: (r) => r.warehouse.name },
      { key: "mfg_date", header: "MFG Date", sortable: true, accessor: (r) => r.mfgDate, render: (v) => (v ? <span className="whitespace-nowrap">{formatDate(v)}</span> : <span className="text-ink-subtle">—</span>) },
      { key: "exp_date", header: "Expiry Date", sortable: true, accessor: (r) => r.expDate, render: (v, r) => <ExpiryCell date={v} days={r.daysToExpiry} /> },
      { key: "available", header: "Available Qty", sortable: true, align: "right", accessor: (r) => r.availableQty, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "saleable", header: "Saleable Qty", sortable: true, align: "right", accessor: (r) => r.saleableQty, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "value", header: "Stock Value", sortable: true, align: "right", accessor: (r) => r.stockValue, render: (v) => <span className="tabular-nums">{formatINR(v)}</span> },
      { key: "status", header: "Status", accessor: (r) => r.status, render: (v, r) => (<><StatusBadge status={v} domain="inventory" size="sm" />{r.expiryBucket !== v ? <span className="mt-0.5 block"><StatusBadge status={r.expiryBucket} domain="inventory" size="sm" /></span> : null}</>) },
    ],
    [isAdmin], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const rowActions = (row) => [
    { key: "preview", label: "Preview allocation", icon: Calculator, onClick: () => setPreviewRow(row) },
    ...buildBatchRowActions(row, { api, portal, onViewBatch: open, onTransfer: quick.openTransfer, onMarkNonSaleable: quick.openNonSaleable }),
  ];

  return (
    <div>
      <PageHeader
        title="FEFO Monitor"
        description="Batches eligible for a normal sale right now, in First-Expiry-First-Out order — the same order automatic allocation actually uses. Priority is 1-based within each product and warehouse."
        actions={
          <>
            {isAdmin ? <SourceSwitch source={source} onChange={setSource} /> : null}
            <IconButton icon={RefreshCw} label="Refresh" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
          </>
        }
      />
      {isSample ? <SampleBanner dateNote={false} /> : null}
      <InventoryFilterBar fields={FIELDS} filters={filters} onChange={setFilters} lookups={lookups} showDistributor={isAdmin} searchPlaceholder="SKU, product, batch, distributor, warehouse" />

      <Card>
        <DataTable
          bare manual rowKey="key" caption="FEFO-eligible batch stock, priority order"
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? inventoryErrorMessage(list.error, "Unable to load the FEFO monitor. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort} onRowClick={(r) => open(r.batchId)} rowActions={rowActions}
          emptyTitle="No eligible batches found" emptyDescription="Nothing currently matches — try changing the filters."
        />
      </Card>
      <p className="mt-3 text-caption text-ink-subtle">
        Excludes expired, non-saleable and out-of-stock batches. The second badge in Status shows the finer expiry bucket (Critical / Near Expiry / Monitor) when it adds information beyond the main status.
      </p>

      <BatchDrawer batchId={openId} api={api} portal={portal} lookups={lookups} onClose={close} onChanged={list.reload} />
      <FefoPreviewModal
        open={!!previewRow}
        onClose={() => setPreviewRow(null)}
        api={api}
        context={previewRow ? { productId: previewRow.productId, product: previewRow.product, distributorId: previewRow.distributor.id, warehouseId: previewRow.warehouse.id, warehouseName: previewRow.warehouse.name } : null}
      />
      <TransferStockModal open={!!quick.transferBatch} onClose={quick.closeTransfer} batch={quick.transferBatch} api={api} lookups={lookups} onDone={list.reload} />
      <NonSaleableModal open={!!quick.nonSaleableBatch} onClose={quick.closeNonSaleable} batch={quick.nonSaleableBatch} api={api} lookups={lookups} onDone={list.reload} />
    </div>
  );
}
