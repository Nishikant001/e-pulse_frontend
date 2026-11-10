import { useState } from "react";
import { Link } from "react-router-dom";
import Drawer from "../../../components/ui/Drawer";
import ErrorState from "../../../components/ui/ErrorState";
import StatusBadge from "../../../components/ui/StatusBadge";
import Tabs from "../../../components/ui/Tabs";
import { SkeletonTable } from "../../../components/ui/Skeleton";
import InfoGrid from "../../adminSales/components/InfoGrid";
import { formatINR, formatNumber } from "../../../utils/format";
import { useAsyncData } from "../hooks/useAsyncData";
import { inventoryBase } from "../hooks/useInventoryScreen";
import { inventoryErrorMessage } from "../api/inventoryErrors";
import ExpiryCell from "./ExpiryCell";
import MovementHistory from "./MovementHistory";
import StockMovementPanel from "./StockMovementPanel";

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "batches", label: "Batches" },
  { id: "movement", label: "Movement" },
];

function BatchList({ api, row, onOpenBatch }) {
  const q = useAsyncData((signal) => api.batches({ productId: row.productId, distributorId: row.distributor.id, warehouseId: row.warehouse?.id, includeEmpty: "1", pageSize: 50, sort: "exp_date", dir: "asc" }, signal), [api, row.key]);
  if (q.status === "error") return <ErrorState compact title="Unable to load batches" message={inventoryErrorMessage(q.error, "Unable to load batches. Please try again.")} onRetry={q.reload} />;
  if (!q.data) return <SkeletonTable rows={4} columns={4} />;
  if (!q.data.items.length) return <p className="rounded-card border border-line px-3 py-6 text-center text-body text-ink-muted">No batches recorded for this product.</p>;
  return (
    <div className="dms-scroll overflow-x-auto rounded-card border border-line">
      <table className="w-full min-w-[34rem] text-left text-caption">
        <caption className="sr-only">Batches of {row.product}</caption>
        <thead className="bg-surface-muted text-ink-muted"><tr><th scope="col" className="px-3 py-2 font-medium">Batch</th><th scope="col" className="px-3 py-2 font-medium">Expiry</th><th scope="col" className="px-3 py-2 text-right font-medium">Available</th><th scope="col" className="px-3 py-2 text-right font-medium">Saleable</th><th scope="col" className="px-3 py-2 font-medium">Status</th></tr></thead>
        <tbody>
          {q.data.items.map((b) => (
            <tr key={b.key} className="border-t border-line">
              <td className="px-3 py-2"><button type="button" onClick={() => onOpenBatch(b.batchId)} className="font-medium text-brand-700 hover:underline">{b.batchNo}</button></td>
              <td className="px-3 py-2"><ExpiryCell date={b.expDate} days={b.daysToExpiry} /></td>
              <td className="px-3 py-2 text-right tabular-nums">{formatNumber(b.availableQty)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatNumber(b.saleableQty)}</td>
              <td className="px-3 py-2"><StatusBadge status={b.status} domain="inventory" size="sm" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Product stock drawer (Current Stock row detail): summary, batches and movement for the product in that warehouse. */
export default function ProductStockDrawer({ row, api, portal, onClose, onOpenBatch }) {
  const [tab, setTab] = useState("summary");
  const scope = row ? { productId: row.productId, ...(row.warehouse?.id ? { warehouseId: row.warehouse.id } : {}) } : null;
  return (
    <Drawer open={!!row} onClose={onClose} size="lg" title={row ? row.product : "Stock details"} description={row ? `${row.sku} · ${row.warehouse?.name ?? ""} · ${row.distributor.name}` : undefined}>
      {row ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3"><StatusBadge status={row.status} domain="inventory" /></div>
          <Tabs tabs={TABS} value={tab} onChange={setTab} className="mb-4" />
          {tab === "summary" ? (
            <>
              <InfoGrid
                columns="sm:grid-cols-2"
                items={[
                  { label: "SKU", value: row.sku }, { label: "Category", value: row.category }, { label: "Distributor", value: row.distributor.name }, { label: "Warehouse", value: row.warehouse?.name },
                  { label: "Available (on hand)", value: formatNumber(row.availableQty) }, { label: "Reserved", value: formatNumber(row.reservedQty) },
                  { label: "Saleable", value: formatNumber(row.saleableQty) }, { label: "Non-saleable", value: formatNumber(row.nonSaleableQty) },
                  { label: "Expired quantity", value: formatNumber(row.expiredQty) }, { label: "Near-expiry quantity", value: formatNumber(row.nearExpiryQty) },
                  { label: "Reorder level", value: row.reorderLevel != null ? formatNumber(row.reorderLevel) : "Not set" }, { label: "Batches with stock", value: formatNumber(row.batchCount) },
                  { label: "Stock value (at purchase cost)", value: formatINR(row.stockValue) },
                ]}
              />
              <p className="mt-3 text-caption text-ink-subtle">Status is calculated by the server: expired stock → Expired; the product’s saleable stock at or below its reorder level → Low stock; stock nearing expiry → Near expiry; otherwise Healthy.</p>
            </>
          ) : null}
          {tab === "batches" ? <BatchList api={api} row={row} onOpenBatch={onOpenBatch} /> : null}
          {tab === "movement" ? (
            <div className="space-y-4">
              <StockMovementPanel api={api} scope={scope} />
              <MovementHistory api={api} scope={scope} ledgerHref={`${inventoryBase(portal)}/ledger?product=${encodeURIComponent(row.sku)}`} />
            </div>
          ) : null}
          {tab === "batches" ? (
            <p className="mt-3 text-caption text-ink-subtle"><Link to={`${inventoryBase(portal)}/batch?product=${encodeURIComponent(row.sku)}`} className="font-medium text-brand-700 hover:underline">Open in Batch Stock</Link></p>
          ) : null}
        </>
      ) : null}
    </Drawer>
  );
}
