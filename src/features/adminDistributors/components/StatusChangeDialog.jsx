import { useEffect, useState } from "react";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import Alert from "../../../components/ui/Alert";
import { Textarea } from "../../../components/ui/Input";
import { useToast } from "../../../components/feedback";
import { distributorsApi } from "../api/distributorsApi";

/**
 * Confirm + save an Activate / Deactivate. Nothing is deleted: orders, invoices, payments, returns and retailers stay as they are.
 * `distributor` needs { id, name, status } and optionally { liveOrderCount } (used only to warn, never to block).
 */
export default function StatusChangeDialog({ distributor, open, onClose, onChanged }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) setReason("");
  }, [open]);
  if (!distributor) return null;

  const activating = distributor.status !== "active";
  const live = Number(distributor.liveOrderCount) || 0;

  async function confirm() {
    setSaving(true);
    try {
      await distributorsApi.setStatus(distributor.id, { status: activating ? "active" : "inactive", reason: activating ? undefined : reason.trim() || undefined });
      toast.success(activating ? "Distributor activated" : "Distributor deactivated");
      onChanged?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Unable to change status", { title: "Update failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ConfirmationModal
      open={open}
      onCancel={saving ? undefined : onClose}
      onConfirm={confirm}
      loading={saving}
      tone={activating ? "primary" : "warning"}
      title={activating ? "Activate distributor?" : "Deactivate distributor?"}
      confirmLabel={activating ? "Activate" : "Deactivate"}
      message={
        <div className="space-y-3">
          <p>
            {activating
              ? `${distributor.name} will be able to sign in and create new orders again.`
              : `${distributor.name} will no longer be able to sign in or create new orders. All existing orders, invoices, payments, returns and retailers are kept unchanged.`}
          </p>
          {!activating && live > 0 ? <Alert tone="warning">{live} open order{live === 1 ? "" : "s"} exist for this distributor. They are not cancelled by deactivation.</Alert> : null}
          {!activating ? <Textarea label="Reason (optional)" rows={2} maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} hint="Shown on the distributor profile" /> : null}
        </div>
      }
    />
  );
}
