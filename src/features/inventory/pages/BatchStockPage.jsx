import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, RefreshCw } from "lucide-react";
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
import InventoryFilterBar from "../components/InventoryFilterBar";
import { inventoryErrorMessage } from "../api/inventoryErrors";
import { useInventoryScreen } from "../hooks/useInventoryScreen";
import { BATCH_STATUS_OPTIONS } from "../inventoryOptions";

const FIELDS = ["search", "distributor", "warehouse", "product", "category", "batch", "status", "empty"];
const KEYS = ["q", "distributorId", "warehouseId", "product", "category", "batch", "status", "includeEmpty"];

/** Batch Stock — the primary pharmaceutical traceability unit. /admin/inventory/batch · /dashboard/inventory/batch */
export default function BatchStockPage({ portal = "admin" }) {
  const { isAdmin, source, setSource, api, lookups, expire, isSample } = useInventoryScreen(portal);
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(() => Object.fromEntries(KEYS.map((k) => [k, params.get(k) || ""])));
  const list = useSalesList({ fetcher: api.batches, filters, defaultSort: { key: "exp_date", dir: "asc" }, onUnauthorized: expire });

  const openId = params.get("batch");
  const open = (id) => setParams({ batch: String(id) });
  const close = () => setParams({});

  const columns = useMemo(
    () => [
      { key: "product", header: "Product", sortable: true, sticky: true, minWidth: "12rem", accessor: (r) => r.product, render: (v, r) => (<><span className="block font-medium text-ink">{v}</span><span className="block text-caption text-ink-subtle">{r.category}</span></>) },
      { key: "sku", header: "SKU", sortable: true, accessor: (r) => r.sku },
      { key: "batch_no", header: "Batch Number", sortable: true, accessor: (r) => r.batchNo, render: (v, r) => <button type="button" onClick={() => open(r.batchId)} className="whitespace-nowrap font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button> },
      ...(isAdmin ? [{ key: "distributor", header: "Distributor", sortable: true, minWidth: "11rem", accessor: (r) => r.distributor.name, render: (v, r) => (<><span className="block">{v}</span><span className="block text-caption text-ink-subtle">{r.distributor.code}</span></>) }] : []),
      { key: "warehouse", header: "Warehouse", sortable: true, accessor: (r) => r.warehouse.name },
      { key: "mfg_date", header: "MFG Date", sortable: true, accessor: (r) => r.mfgDate, render: (v) => (v ? <span className="whitespace-nowrap">{formatDate(v)}</span> : <span className="text-ink-subtle">—</span>) },
      { key: "exp_date", header: "Expiry Date", sortable: true, accessor: (r) => r.expDate, render: (v, r) => <ExpiryCell date={v} days={r.daysToExpiry} /> },
      { key: "available", header: "Available Qty", sortable: true, align: "right", accessor: (r) => r.availableQty, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "saleable", header: "Saleable Qty", sortable: true, align: "right", accessor: (r) => r.saleableQty, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "non_saleable", header: "Non-Saleable Qty", sortable: true, align: "right", accessor: (r) => r.nonSaleableQty, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "mrp", header: "MRP", sortable: true, align: "right", accessor: (r) => r.mrp, render: (v) => (v != null ? <span className="tabular-nums">{formatINR(v)}</span> : <span className="text-ink-subtle">—</span>) },
      { key: "value", header: "Stock Value", sortable: true, align: "right", accessor: (r) => r.stockValue, render: (v) => <span className="tabular-nums">{formatINR(v)}</span> },
      { key: "status", header: "Status", accessor: (r) => r.status, render: (v) => <StatusBadge status={v} domain="inventory" /> },
    ],
    [isAdmin], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <div>
      <PageHeader
        title="Batch Stock"
        description="Stock by batch — manufacturing and expiry dates, saleable and non-saleable quantities, MRP and value. Select a batch for its full trace."
        actions={
          <>
            {isAdmin ? <SourceSwitch source={source} onChange={setSource} /> : null}
            <IconButton icon={RefreshCw} label="Refresh batches" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
          </>
        }
      />
      {isSample ? <SampleBanner dateNote={false} /> : null}
      <InventoryFilterBar fields={FIELDS} filters={filters} onChange={setFilters} lookups={lookups} statusOptions={BATCH_STATUS_OPTIONS} showDistributor={isAdmin} searchPlaceholder="SKU, product, batch, distributor, warehouse" />

      <Card>
        <DataTable
          bare manual rowKey="key" caption="Batch stock"
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? inventoryErrorMessage(list.error, "Unable to load batch stock. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort} onRowClick={(r) => open(r.batchId)}
          rowActions={(row) => [{ key: "view", label: "View batch details", icon: Eye, onClick: () => open(row.batchId) }]}
          emptyTitle="No batches found" emptyDescription="Try changing the filters, or include empty batches."
        />
      </Card>
      <p className="mt-3 text-caption text-ink-subtle">
        Status: Expired (past expiry) · Near expiry{lookups?.thresholds ? ` (within ${lookups.thresholds.nearExpiryDays} days)` : ""} · Non-saleable (no saleable units) · Out of stock · Healthy. Stock value is at purchase cost; MRP is shown for information only.
      </p>

      <BatchDrawer batchId={openId} api={api} portal={portal} lookups={lookups} onClose={close} onChanged={list.reload} />
    </div>
  );
}
