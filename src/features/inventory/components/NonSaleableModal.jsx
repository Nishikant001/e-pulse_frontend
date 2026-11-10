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
 * Move quantity between saleable and non-saleable for one batch (Distributor portal). Nothing is deleted: the server posts two
 * ledger rows in one transaction and keeps the reason. The server is the authority on every rule; this form only helps.
 */
export default function NonSaleableModal({ open, onClose, batch, api, lookups, onDone }) {
  const toast = useToast();
  const [action, setAction] = useState("MARK");
  const [reasonCode, setReasonCode] = useState("DAMAGED");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setAction("MARK"); setReasonCode("DAMAGED"); setQuantity(""); setNote(""); setWarehouseId(""); setError(null);
    }
  }, [open, batch?.batchId]);
  if (!batch) return null;

  const reasons = (lookups?.nonSaleableReasons || []).filter((r) => r.value !== "EXPIRED"); // expiry is derived automatically
  const warehouses = (lookups?.warehouses || []).filter((w) => w.distributorId === batch.distributor.id && w.status === "active");
  const max = action === "MARK" ? batch.stock.saleableQty : batch.stock.nonSaleableQty;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.changeSaleability({ batchId: batch.batchId, quantity: Number(quantity), action, reasonCode, reason: note.trim() || undefined, warehouseId: warehouseId ? Number(warehouseId) : undefined });
      toast.success(action === "MARK" ? "Stock marked non-saleable" : "Stock released to saleable");
      onDone?.();
      onClose();
    } catch (e) {
      setError(inventoryErrorMessage(e, "Stock transaction failed. Nothing was changed."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Change stock status"
      description={`${batch.product.name} · batch ${batch.batchNo}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy} disabled={!quantity}>{action === "MARK" ? "Mark non-saleable" : "Release to saleable"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Alert tone="error" title="Could not change stock status">{error}</Alert> : null}
        <Select label="Action" value={action} onChange={(e) => setAction(e.target.value)} options={[{ value: "MARK", label: "Mark saleable stock as non-saleable" }, { value: "RELEASE", label: "Release non-saleable stock back to saleable" }]} />
        <Select label="Reason" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)} options={reasons.map((r) => ({ value: r.value, label: r.label }))} />
        {warehouses.length > 1 ? (
          <Select label="Warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} placeholder="Default warehouse" options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))} />
        ) : null}
        <Input label="Quantity" type="number" min="1" step="1" inputMode="numeric" required value={quantity} onChange={(e) => setQuantity(e.target.value)} hint={`Up to ${formatNumber(max)} ${action === "MARK" ? "saleable" : "non-saleable"} units in this batch`} />
        <Textarea label={reasonCode === "OTHER" ? "Note (required for “Other”)" : "Note (optional)"} required={reasonCode === "OTHER"} value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} />
        <p className="text-caption text-ink-subtle">Stock is never deleted. Both entries appear on the stock ledger with this reason.</p>
      </div>
    </Modal>
  );
}
