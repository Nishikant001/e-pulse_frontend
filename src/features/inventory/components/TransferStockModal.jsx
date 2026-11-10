import { useEffect, useState } from "react";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import Input, { Textarea } from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import Select from "../../../components/ui/Select";
import { useToast } from "../../../components/feedback";
import { formatNumber } from "../../../utils/format";
import { inventoryErrorMessage } from "../api/inventoryErrors";

/**
 * Transfer saleable stock of one batch to another of the distributor's warehouses. This is a first, minimal UI for
 * the transfer foundation Phase 5 built (services/inventory.service.js#transferStock): the server posts a single
 * immediate OUT/IN pair, atomically, with the same overdraw protection as a sale. There is no approval step and no
 * in-transit state — see docs, known limitations. Distributor portal only (Admin is read-only).
 */
export default function TransferStockModal({ open, onClose, batch, api, lookups, onDone }) {
  const toast = useToast();
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Batches with saleable stock in more than one warehouse are rare (Phase 5 only starts sending stock to a second
  // warehouse via a transfer), so this usually defaults to the one place there's anything to move.
  const sources = (batch?.locations || []).filter((l) => l.saleableQty > 0);
  useEffect(() => {
    if (open) {
      setFromWarehouseId(sources.length ? String(sources[0].warehouse.id) : "");
      setToWarehouseId(""); setQuantity(""); setReason(""); setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, batch?.batchId]);
  if (!batch) return null;

  const distributorId = batch.distributor?.id;
  const fromLocation = sources.find((l) => String(l.warehouse.id) === fromWarehouseId);
  const others = (lookups?.warehouses || []).filter((w) => w.distributorId === distributorId && w.status === "active" && String(w.id) !== fromWarehouseId);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.createTransfer({
        batchId: batch.batchId, quantity: Number(quantity), fromWarehouseId: Number(fromWarehouseId), toWarehouseId: Number(toWarehouseId), reason: reason.trim() || undefined,
      });
      toast.success("Stock transfer posted");
      onDone?.();
      onClose();
    } catch (e) {
      setError(inventoryErrorMessage(e, "Stock transaction failed. Nothing was transferred."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Transfer stock"
      description={`${batch.product?.name || batch.product} · batch ${batch.batchNo}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy} disabled={!quantity || !toWarehouseId || !fromWarehouseId}>Transfer</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Alert tone="error" title="Could not transfer stock">{error}</Alert> : null}
        {sources.length === 0 ? (
          <Alert tone="info" title="No saleable stock to transfer">This batch has no saleable quantity in any warehouse right now.</Alert>
        ) : others.length === 0 ? (
          <Alert tone="info" title="No other warehouse available">This distributor has only one active warehouse. Add a second warehouse before transferring stock.</Alert>
        ) : (
          <>
            {sources.length > 1 ? (
              <Select label="From warehouse" value={fromWarehouseId} onChange={(e) => setFromWarehouseId(e.target.value)} options={sources.map((l) => ({ value: String(l.warehouse.id), label: `${l.warehouse.name} (${formatNumber(l.saleableQty)} saleable)` }))} />
            ) : (
              <Input label="From warehouse" value={sources[0].warehouse.name} disabled />
            )}
            <Select label="To warehouse" value={toWarehouseId} onChange={(e) => setToWarehouseId(e.target.value)} placeholder="Select a warehouse" options={others.map((w) => ({ value: String(w.id), label: w.name }))} />
            <Input label="Quantity" type="number" min="1" step="1" inputMode="numeric" required value={quantity} onChange={(e) => setQuantity(e.target.value)} hint={fromLocation ? `Up to ${formatNumber(fromLocation.saleableQty)} saleable units in ${fromLocation.warehouse.name}` : undefined} />
            <Textarea label="Note (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} />
            <p className="text-caption text-ink-subtle">Posts immediately — there is no approval step or in-transit state. Both warehouses' stock ledgers record the movement.</p>
          </>
        )}
      </div>
    </Modal>
  );
}
