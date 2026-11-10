import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/tables/DataTable";
import { formatDate, formatINR, formatNumber } from "../../../utils/format";
import { SampleBanner, SourceSwitch } from "../../adminSales/components/SourceControls";
import { useSalesList } from "../../adminSales/hooks/useSalesList";
import BatchDrawer from "../components/BatchDrawer";
import { ExpiredStockKpi } from "../components/ExpiryBucketKpis";
import InventoryFilterBar from "../components/InventoryFilterBar";
import { buildBatchRowActions } from "../components/batchRowActions";
import { inventoryErrorMessage } from "../api/inventoryErrors";
import { useAsyncData } from "../hooks/useAsyncData";
import { useInventoryScreen } from "../hooks/useInventoryScreen";

const FIELDS = ["search", "distributor", "warehouse", "product", "category", "batch"];
const KEYS = ["q", "distributorId", "warehouseId", "product", "category", "batch"];

/**
 * Expired Stock — batches past their expiry date. Reuses Batch Stock (GET /inventory/batches, status=expired), not a
 * second listing endpoint. Expired stock is excluded from normal FEFO allocation (services/inventory.service.js) and
 * cannot be sold (services/salesdelivery.controller.js rejects it) — it is never deleted, only excluded.
 * /admin/inventory/expired · /dashboard/inventory/expired
 */
export default function ExpiredStockPage({ portal = "admin" }) {
  const { isAdmin, source, setSource, api, lookups, expire, isSample } = useInventoryScreen(portal);
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(() => Object.fromEntries(KEYS.map((k) => [k, params.get(k) || ""])));
  const effectiveFilters = useMemo(() => ({ ...filters, status: "expired", includeEmpty: "1" }), [filters]);
  const list = useSalesList({ fetcher: api.batches, filters: effectiveFilters, defaultSort: { key: "exp_date", dir: "desc" }, onUnauthorized: expire });
  const { distributorId, warehouseId, product, category, batch } = filters;
  const kpiFilters = useMemo(() => ({ distributorId, warehouseId, product, category, batch }), [distributorId, warehouseId, product, category, batch]);
  const kpi = useAsyncData((signal) => api.expirySummary(kpiFilters, signal), [api, JSON.stringify(kpiFilters)]);

  const openId = params.get("batch");
  const open = (id) => setParams({ batch: String(id) });
  const close = () => setParams({});

  const columns = useMemo(
    () => [
      { key: "product", header: "Product", sortable: true, sticky: true, minWidth: "12rem", accessor: (r) => r.product, render: (v, r) => (<><span className="block font-medium text-ink">{v}</span><span className="block text-caption text-ink-subtle">{r.sku}</span></>) },
      { key: "batch_no", header: "Batch", sortable: true, accessor: (r) => r.batchNo, render: (v, r) => <button type="button" onClick={() => open(r.batchId)} className="whitespace-nowrap font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button> },
      ...(isAdmin ? [{ key: "distributor", header: "Distributor", sortable: true, minWidth: "11rem", accessor: (r) => r.distributor.name }] : []),
      { key: "warehouse", header: "Warehouse", sortable: true, accessor: (r) => r.warehouse.name },
      { key: "mfg_date", header: "MFG", sortable: true, accessor: (r) => r.mfgDate, render: (v) => (v ? <span className="whitespace-nowrap">{formatDate(v)}</span> : <span className="text-ink-subtle">—</span>) },
      { key: "exp_date", header: "Expiry", sortable: true, accessor: (r) => r.expDate, render: (v, r) => (v ? <span className="whitespace-nowrap">{formatDate(v)}<span className="block text-caption text-ink-subtle">{Math.abs(r.daysToExpiry)} days ago</span></span> : <span className="text-ink-subtle">—</span>) },
      { key: "available", header: "Quantity", sortable: true, align: "right", accessor: (r) => r.availableQty, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "value", header: "Stock Value", sortable: true, align: "right", accessor: (r) => r.stockValue, render: (v) => <span className="tabular-nums">{formatINR(v)}</span> },
      { key: "status", header: "Status", accessor: (r) => r.status, render: (v) => <StatusBadge status={v} domain="inventory" size="sm" /> },
    ],
    [isAdmin], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Transfer / Mark non-saleable are shown disabled here (an expired batch always has 0 saleable quantity, by
  // definition — see services/inventoryRules.service.js#splitBatchQuantities), so buildBatchRowActions already
  // disables them with an accurate reason; nothing further to wire up for this read-mostly page.
  const rowActions = (row) => buildBatchRowActions(row, { api, portal, onViewBatch: open });

  return (
    <div>
      <PageHeader
        title="Expired Stock"
        description="Batches past their expiry date. Excluded from normal FEFO allocation and cannot be sold — never deleted, and fully traceable on the stock ledger."
        actions={
          <>
            {isAdmin ? <SourceSwitch source={source} onChange={setSource} /> : null}
            <IconButton icon={RefreshCw} label="Refresh" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
          </>
        }
      />
      {isSample ? <SampleBanner dateNote={false} /> : null}
      <ExpiredStockKpi summary={kpi.data} loading={kpi.status === "loading" && !kpi.data} error={kpi.status === "error"} onRetry={kpi.reload} />
      <InventoryFilterBar fields={FIELDS} filters={filters} onChange={setFilters} lookups={lookups} showDistributor={isAdmin} searchPlaceholder="SKU, product, batch, distributor, warehouse" />

      <Card>
        <DataTable
          bare manual rowKey="key" caption="Expired stock"
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? inventoryErrorMessage(list.error, "Unable to load expired stock. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort} onRowClick={(r) => open(r.batchId)} rowActions={rowActions}
          emptyTitle="No expired stock" emptyDescription="Nothing has passed its expiry date."
        />
      </Card>

      <BatchDrawer batchId={openId} api={api} portal={portal} lookups={lookups} onClose={close} onChanged={() => { list.reload(); kpi.reload(); }} />
    </div>
  );
}
