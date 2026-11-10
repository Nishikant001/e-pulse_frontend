import { useState } from "react";
import { Ban, Repeat } from "lucide-react";
import Button from "../../../components/ui/Button";
import Drawer from "../../../components/ui/Drawer";
import ErrorState from "../../../components/ui/ErrorState";
import StatusBadge from "../../../components/ui/StatusBadge";
import { SkeletonText } from "../../../components/ui/Skeleton";
import InfoGrid from "../../adminSales/components/InfoGrid";
import { formatDate, formatINR, formatNumber } from "../../../utils/format";
import { useAsyncData } from "../hooks/useAsyncData";
import { inventoryBase } from "../hooks/useInventoryScreen";
import { inventoryErrorMessage } from "../api/inventoryErrors";
import ExpiryCell from "./ExpiryCell";
import MovementHistory from "./MovementHistory";
import NonSaleableModal from "./NonSaleableModal";
import StockMovementPanel from "./StockMovementPanel";
import TransferStockModal from "./TransferStockModal";

const Section = ({ title, children }) => (
  <section className="mb-6">
    <h3 className="mb-2 text-card-title font-semibold text-ink">{title}</h3>
    {children}
  </section>
);

/** Batch details drawer: batch information, stock, location and movement — all from the API / stock ledger. */
export default function BatchDrawer({ batchId, api, portal, lookups, onClose, onChanged }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const q = useAsyncData((signal) => (batchId ? api.batchDetail(batchId, signal) : Promise.resolve(null)), [api, batchId]);
  const d = q.data;
  const open = !!batchId;
  const s = d?.stock;

  const footer =
    d && api.canWrite ? (
      <>
        <Button variant="secondary" leftIcon={Repeat} onClick={() => setTransferOpen(true)}>Transfer stock</Button>
        <Button variant="secondary" leftIcon={Ban} onClick={() => setModalOpen(true)}>Change stock status</Button>
      </>
    ) : null;

  return (
    <>
      <Drawer open={open} onClose={onClose} size="lg" title={d ? `Batch ${d.batchNo}` : "Batch details"} description={d ? `${d.product.name} · ${d.product.sku}` : undefined} footer={footer}>
        {q.status === "error" ? (
          <ErrorState title="Unable to load batch details" message={inventoryErrorMessage(q.error, "Unable to load batch details. Please try again.")} onRetry={q.reload} />
        ) : !d ? (
          <SkeletonText lines={10} />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <StatusBadge status={d.status} domain="inventory" />
              {!d.batchActive ? <StatusBadge status="inactive" domain="inventory" label="Batch inactive" /> : null}
              {/* Suppressed when it would just repeat the status badge above (expired batches, or a batch far from expiry) — shown to add the finer critical/high/medium detail otherwise. */}
              {d.expiryBucket && d.expiryBucket !== d.status ? <StatusBadge status={d.expiryBucket} domain="inventory" /> : null}
            </div>

            <Section title="Batch information">
              <InfoGrid
                columns="sm:grid-cols-2"
                items={[
                  { label: "Batch number", value: d.batchNo },
                  { label: "Product", value: d.product.name },
                  { label: "SKU", value: d.product.sku },
                  { label: "Manufacturer", value: d.product.manufacturer },
                  { label: "Manufacturing date", value: d.mfgDate ? formatDate(d.mfgDate) : null },
                  { label: "Expiry date", value: <ExpiryCell date={d.expDate} days={d.daysToExpiry} /> },
                  { label: "MRP", value: d.mrp != null ? formatINR(d.mrp) : null },
                  { label: "HSN", value: d.hsn },
                  { label: "GST", value: d.gstRate != null ? `${d.gstRate}%` : null },
                  { label: "Purchase cost / unit", value: d.unitCost ? formatINR(d.unitCost) : null },
                  {
                    label: "FEFO priority",
                    value:
                      d.fefo.priority != null ? (
                        <>
                          #{d.fefo.priority} for this product{d.fefo.warehouse ? ` in ${d.fefo.warehouse.name}` : ""}
                        </>
                      ) : (
                        <span className="text-ink-subtle">{d.fefo.note || "Not eligible"}</span>
                      ),
                  },
                ]}
              />
            </Section>

            <Section title="Stock">
              <InfoGrid
                columns="sm:grid-cols-2"
                items={[
                  { label: "Total quantity", value: formatNumber(s.totalQty) },
                  { label: "Saleable quantity", value: formatNumber(s.saleableQty) },
                  { label: "Reserved quantity", value: formatNumber(s.reservedQty) },
                  { label: "Non-saleable quantity", value: formatNumber(s.nonSaleableQty) },
                  { label: "Stock value (at purchase cost)", value: formatINR(s.stockValue) },
                ]}
              />
              {s.nonSaleableBreakdown.length ? (
                <ul className="mt-3 space-y-1 rounded-card border border-line bg-surface-muted px-3 py-2 text-caption text-ink-muted" aria-label="Why stock is non-saleable">
                  {s.nonSaleableBreakdown.map((r) => (
                    <li key={r.reason} className="flex justify-between gap-3"><span>{r.label}</span><span className="tabular-nums text-ink">{formatNumber(r.qty)}</span></li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 text-caption text-ink-subtle">Reserved counts units on confirmed batch-specific sales orders that are not delivered yet. It is informational — it does not reduce saleable stock.</p>
            </Section>

            <Section title="Location">
              <InfoGrid columns="sm:grid-cols-2" items={[{ label: "Distributor", value: d.distributor.name }, { label: "Distributor code", value: d.distributor.code }]} />
              <div className="dms-scroll mt-3 overflow-x-auto rounded-card border border-line">
                <table className="w-full min-w-[24rem] text-left text-caption">
                  <caption className="sr-only">Stock by warehouse</caption>
                  <thead className="bg-surface-muted text-ink-muted"><tr><th scope="col" className="px-3 py-2 font-medium">Warehouse</th><th scope="col" className="px-3 py-2 text-right font-medium">Total</th><th scope="col" className="px-3 py-2 text-right font-medium">Saleable</th><th scope="col" className="px-3 py-2 text-right font-medium">Non-saleable</th></tr></thead>
                  <tbody>
                    {d.locations.map((l) => (
                      <tr key={l.warehouse.id ?? "default"} className="border-t border-line"><td className="px-3 py-2">{l.warehouse.name}</td><td className="px-3 py-2 text-right tabular-nums">{formatNumber(l.totalQty)}</td><td className="px-3 py-2 text-right tabular-nums">{formatNumber(l.saleableQty)}</td><td className="px-3 py-2 text-right tabular-nums">{formatNumber(l.nonSaleableQty)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Movement">
              <StockMovementPanel api={api} scope={{ batchId: d.batchId }} />
              <div className="mt-4">
                <MovementHistory api={api} scope={{ batchId: d.batchId }} ledgerHref={`${inventoryBase(portal)}/ledger?batch=${encodeURIComponent(d.batchNo)}`} />
              </div>
            </Section>
          </>
        )}
      </Drawer>
      <NonSaleableModal open={modalOpen} onClose={() => setModalOpen(false)} batch={d} api={api} lookups={lookups} onDone={() => { q.reload(); onChanged?.(); }} />
      <TransferStockModal open={transferOpen} onClose={() => setTransferOpen(false)} batch={d} api={api} lookups={lookups} onDone={() => { q.reload(); onChanged?.(); }} />
    </>
  );
}
