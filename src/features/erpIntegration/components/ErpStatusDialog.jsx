import { useState } from "react";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { useToast } from "../../../components/feedback";
import { erpApi } from "../api/erpApi";
import { errorText } from "../erpDisplay";

/** Activate / deactivate. Deactivating the DEFAULT connection needs an explicit choice: the tenant is left with no default. */
export default function ErpStatusDialog({ connection, open, onClose, onChanged }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  if (!connection) return null;
  const activating = connection.status === "INACTIVE";
  const losesDefault = !activating && connection.isDefault;
  async function confirm() {
    setSaving(true);
    try {
      await erpApi.setStatus(connection.id, activating ? "ACTIVE" : "INACTIVE", losesDefault);
      toast.success(activating ? "ERP connection activated" : "ERP connection deactivated");
      onChanged?.();
      onClose();
    } catch (err) {
      toast.error(errorText(err, "Unable to change status"), { title: "Update failed" });
    } finally {
      setSaving(false);
    }
  }
  return (
    <ConfirmationModal open={open} onCancel={saving ? undefined : onClose} onConfirm={confirm} loading={saving}
      tone={activating ? "primary" : "warning"} title={activating ? "Activate ERP connection?" : "Deactivate ERP connection?"} confirmLabel={activating ? "Activate" : losesDefault ? "Deactivate and clear default" : "Deactivate"}
      message={activating
        ? `${connection.name} becomes available again. Activating does not contact the ERP — run a connection test to verify it.`
        : losesDefault
          ? `${connection.name} is the DEFAULT ERP. If you deactivate it, this tenant will have NO default ERP until you choose another one. No other connection is selected automatically.`
          : `${connection.name} will no longer be offered for any data domain. Nothing is deleted.`} />
  );
}
