import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Layers, RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/tables/DataTable";
import { formatINR, formatNumber } from "../../../utils/format";
import { SampleBanner, SourceSwitch } from "../../adminSales/components/SourceControls";
import { useSalesList } from "../../adminSales/hooks/useSalesList";
import BatchDrawer from "../components/BatchDrawer";
import InventoryFilterBar from "../components/InventoryFilterBar";
import InventoryKpis from "../components/InventoryKpis";
import ProductStockDrawer from "../components/ProductStockDrawer";
import { inventoryErrorMessage } from "../api/inventoryErrors";
import { useAsyncData } from "../hooks/useAsyncData";
import { inventoryBase, useInventoryScreen } from "../hooks/useInventoryScreen";
import { PRODUCT_STATUS_OPTIONS } from "../inventoryOptions";

const FIELDS = ["search", "distributor", "warehouse", "product", "category", "batch", "status"];
const KEYS = ["q", "distributorId", "warehouseId", "product", "category", "batch", "status"];

/** Current Stock — product-level stock per distributor and warehouse. /admin/inventory/current · /dashboard/inventory/current */
export default function CurrentStockPage({ portal = "admin" }) {
  const { isAdmin, source, setSource, api, lookups, expire, isSample } = useInventoryScreen(portal);
  const [urlParams] = useSearchParams();
  const navigate = useNavigate();
  const [filters, setFilters] = useState(() => Object.fromEntries(KEYS.map((k) => [k, urlParams.get(k) || ""])));
  const [selected, setSelected] = useState(null);
  const [batchId, setBatchId] = useState(null);

  const list = useSalesList({ fetcher: api.current, filters, defaultSort: { key: "product", dir: "asc" }, onUnauthorized: expire });
  const { status: _s, ...kpiFilters } = filters; // KPIs follow the same filters except the status filter
  const kpi = useAsyncData((signal) => api.summary(kpiFilters, signal), [api, JSON.stringify(kpiFilters), list.status === "ready" ? "r" : "l"]);
  const reloadAll = () => { list.reload(); kpi.reload(); };
  const base = inventoryBase(portal);

  const columns = useMemo(
    () => [
      { key: "sku", header: "SKU", sortable: true, sticky: true, accessor: (r) => r.sku, render: (v) => <span className="font-medium text-ink">{v}</span> },
      { key: "product", header: "Product", sortable: true, minWidth: "12rem", accessor: (r) => r.product, render: (v, r) => (<><span className="block">{v}</span>{r.unit ? <span className="block text-caption text-ink-subtle">{r.unit}</span> : null}</>) },
      { key: "category", header: "Category", sortable: true, accessor: (r) => r.category },
      ...(isAdmin ? [{ key: "distributor", header: "Distributor", sortable: true, minWidth: "11rem", accessor: (r) => r.distributor.name, render: (v, r) => (<><span className="block">{v}</span><span className="block text-caption text-ink-subtle">{r.distributor.code}</span></>) }] : []),
      { key: "warehouse", header: "Warehouse", sortable: true, accessor: (r) => r.warehouse.name },
      { key: "available", header: "Available Qty", sortable: true, align: "right", accessor: (r) => r.availableQty, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "reserved", header: "Reserved Qty", sortable: true, align: "right", accessor: (r) => r.reservedQty, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "saleable", header: "Saleable Qty", sortable: true, align: "right", accessor: (r) => r.saleableQty, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "non_saleable", header: "Non-Saleable Qty", sortable: true, align: "right", accessor: (r) => r.nonSaleableQty, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "value", header: "Stock Value", sortable: true, align: "right", accessor: (r) => r.stockValue, render: (v) => <span className="tabular-nums">{formatINR(v)}</span> },
      {
        key: "status", header: "Status", accessor: (r) => r.status,
        render: (v, r) => (
          <>
            <StatusBadge status={v} domain="inventory" />
            {r.expiredQty > 0 ? <span className="mt-0.5 block text-caption text-ink-subtle">{formatNumber(r.expiredQty)} expired</span> : r.nearExpiryQty > 0 ? <span className="mt-0.5 block text-caption text-ink-subtle">{formatNumber(r.nearExpiryQty)} near expiry</span> : null}
          </>
        ),
      },
    ],
    [isAdmin],
  );

  const rowActions = (row) => [
    { key: "details", label: "Stock details", icon: Eye, onClick: () => setSelected(row) },
    { key: "batches", label: "View batches", icon: Layers, onClick: () => navigate(`${base}/batch?product=${encodeURIComponent(row.sku)}`) },
  ];

  return (
    <div>
      <PageHeader
        title="Current Stock"
        description="Stock on hand by product, distributor and warehouse, derived from the stock ledger. Stock value is at purchase cost."
        actions={
          <>
            {isAdmin ? <SourceSwitch source={source} onChange={setSource} /> : null}
            <IconButton icon={RefreshCw} label="Refresh stock" variant="outline" onClick={reloadAll} disabled={list.status === "loading"} />
          </>
        }
      />
      {isSample ? <SampleBanner dateNote={false} /> : null}
      <InventoryKpis summary={kpi.data} loading={kpi.status === "loading" && !kpi.data} error={kpi.status === "error"} onRetry={kpi.reload} />
      <InventoryFilterBar fields={FIELDS} filters={filters} onChange={setFilters} lookups={lookups} statusOptions={PRODUCT_STATUS_OPTIONS} showDistributor={isAdmin} />

      <Card>
        <DataTable
          bare manual rowKey="key" caption="Current stock by product and warehouse"
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? inventoryErrorMessage(list.error, "Unable to load stock. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort} rowActions={rowActions} onRowClick={setSelected}
          emptyTitle="No stock found" emptyDescription="Try changing the filters or the search."
        />
      </Card>
      <p className="mt-3 text-caption text-ink-subtle">
        Available = everything on hand. Saleable = usable by a sale (not expired, not held). Non-saleable = held, damaged, returned, blocked or expired. Reserved = units on confirmed orders not yet delivered (informational).
        {lookups?.thresholds ? ` Near expiry = within ${lookups.thresholds.nearExpiryDays} days. Low stock = saleable stock at or below the product’s reorder level.` : ""}
      </p>

      <ProductStockDrawer row={selected} api={api} portal={portal} onClose={() => setSelected(null)} onOpenBatch={(id) => setBatchId(id)} />
      <BatchDrawer batchId={batchId} api={api} portal={portal} lookups={lookups} onClose={() => setBatchId(null)} onChanged={reloadAll} />
    </div>
  );
}
