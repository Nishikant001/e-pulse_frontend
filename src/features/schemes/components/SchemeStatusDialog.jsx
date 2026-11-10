import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { useState } from "react";
import { useToast } from "../../../components/feedback";
import { schemesApi } from "../api/schemesApi";

/** Activate / Deactivate. Schemes are never deleted, so anything already using them keeps its reference. */
export default function SchemeStatusDialog({ scheme, open, onClose, onChanged }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  if (!scheme) return null;
  const activating = scheme.status !== "active";
  async function confirm() {
    setSaving(true);
    try {
      await schemesApi.setStatus(scheme.id, activating ? "active" : "inactive");
      toast.success(activating ? "Scheme activated" : "Scheme deactivated");
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
      open={open} onCancel={saving ? undefined : onClose} onConfirm={confirm} loading={saving}
      tone={activating ? "primary" : "warning"} title={activating ? "Activate scheme?" : "Deactivate scheme?"} confirmLabel={activating ? "Activate" : "Deactivate"}
      message={activating ? `${scheme.name} will apply again to new evaluations while it is within its validity dates.` : `${scheme.name} will stop applying to new evaluations. Nothing is deleted and existing records are unchanged.`}
    />
  );
}
