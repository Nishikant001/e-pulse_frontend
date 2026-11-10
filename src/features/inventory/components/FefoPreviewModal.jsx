import { useEffect, useState } from "react";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import StatusBadge from "../../../components/ui/StatusBadge";
import { formatDate, formatNumber } from "../../../utils/format";
import { inventoryErrorMessage } from "../api/inventoryErrors";

/**
 * "FEFO Allocation Preview" (item 8) — read-only: shows what automatic FEFO allocation would do for a requested
 * quantity of a product, right now, in one warehouse. Nothing is reserved or changed; the actual allocation at
 * delivery time is always re-validated by the server and can differ if stock changes in between.
 */
export default function FefoPreviewModal({ open, onClose, context, api }) {
  const [quantity, setQuantity] = useState("");
  const [state, setState] = useState({ status: "idle", data: null, error: null });

  useEffect(() => {
    if (open) {
      setQuantity("");
      setState({ status: "idle", data: null, error: null });
    }
  }, [open, context?.productId]);
  if (!context) return null;

  const run = async () => {
    const q = Number(quantity);
    if (!Number.isInteger(q) || q <= 0) return;
    setState({ status: "loading", data: null, error: null });
    try {
      const data = await api.fefoPreview({ productId: context.productId, quantity: q, warehouseId: context.warehouseId, distributorId: context.distributorId });
      setState({ status: "ready", data, error: null });
    } catch (e) {
      setState({ status: "error", data: null, error: inventoryErrorMessage(e, "Unable to compute a FEFO allocation preview.") });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="FEFO Allocation Preview" description={`${context.product} · ${context.warehouseName || "Dispatch warehouse"}`} footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      <div className="space-y-4">
        <p className="text-caption text-ink-subtle">
          Shows which batches automatic (earliest-expiry-first) allocation would draw from for a given quantity — informational only. Nothing is reserved; the actual allocation is decided by the server when a delivery is created.
        </p>
        <div className="flex items-end gap-2">
          <Input label="Requested quantity" type="number" min="1" step="1" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} wrapperClassName="flex-1" />
          <Button onClick={run} loading={state.status === "loading"} disabled={!quantity}>Preview</Button>
        </div>
        {state.status === "error" ? <Alert tone="error" title="Could not compute a preview">{state.error}</Alert> : null}
        {state.status === "ready" ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-caption font-medium text-ink-muted">Requested {formatNumber(state.data.requested)}</span>
              <StatusBadge status={state.data.sufficient ? "healthy" : "expired"} domain="inventory" label={state.data.sufficient ? "Fully allocatable" : "Insufficient eligible stock"} />
            </div>
            {state.data.allocations.length ? (
              <div className="dms-scroll overflow-x-auto rounded-card border border-line">
                <table className="w-full min-w-[26rem] text-left text-caption">
                  <caption className="sr-only">Proposed FEFO allocation</caption>
                  <thead className="bg-surface-muted text-ink-muted"><tr><th scope="col" className="px-3 py-2 font-medium">Batch</th><th scope="col" className="px-3 py-2 font-medium">Expiry</th><th scope="col" className="px-3 py-2 text-right font-medium">Available</th><th scope="col" className="px-3 py-2 text-right font-medium">Proposed allocation</th></tr></thead>
                  <tbody>
                    {state.data.allocations.map((a) => (
                      <tr key={a.batchId} className="border-t border-line">
                        <td className="px-3 py-2 font-medium">{a.batchNo}</td>
                        <td className="px-3 py-2">{a.expDate ? formatDate(a.expDate) : "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatNumber(a.available)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatNumber(a.allocated)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="rounded-card border border-line px-3 py-4 text-center text-body text-ink-muted">No eligible batches for this product in this warehouse.</p>
            )}
            {!state.data.sufficient ? <p className="mt-2 text-caption text-ink-subtle">Only {formatNumber(state.data.totalAllocated)} of {formatNumber(state.data.requested)} requested units are currently allocatable ({formatNumber(state.data.remaining)} short).</p> : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
