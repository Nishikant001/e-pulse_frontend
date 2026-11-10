import { useEffect, useMemo, useState } from "react";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import Alert from "../../../components/ui/Alert";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Input";
import { useToast } from "../../../components/feedback";

/** Activate / Deactivate. Nothing is deleted — orders, invoices, payments and returns stay as they are. */
export function RetailerStatusDialog({ api, retailer, open, onClose, onChanged }) {
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) setReason("");
  }, [open]);
  if (!retailer) return null;
  const noun = api.noun || "customer";
  const Noun = noun.charAt(0).toUpperCase() + noun.slice(1);
  const activating = retailer.status !== "active";

  async function confirm() {
    setSaving(true);
    try {
      await api.setStatus(retailer.id, { status: activating ? "active" : "inactive", reason: activating ? undefined : reason.trim() || undefined });
      toast.success(`${Noun} ${activating ? "activated" : "deactivated"}`);
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
      title={activating ? `Activate ${noun}?` : `Deactivate ${noun}?`}
      confirmLabel={activating ? "Activate" : "Deactivate"}
      message={
        <div className="space-y-3">
          <p>
            {activating
              ? `${retailer.name} will be available for new orders again.`
              : `${retailer.name} will no longer be selectable for new orders. Existing orders, invoices, payments and returns are kept unchanged.`}
          </p>
          {!activating ? <Textarea label="Reason (optional)" rows={2} maxLength={255} value={reason} onChange={(e) => setReason(e.target.value)} /> : null}
        </div>
      }
    />
  );
}

/**
 * ADMIN ONLY. Moves a retailer to another distributor. The customer group is per-distributor, so a group of the new distributor must be chosen.
 * The server refuses the move while there are open orders or an unsettled balance and explains why; that message is shown here as-is.
 */
export function ReassignDialog({ api, retailer, lookups, open, onClose, onChanged }) {
  const toast = useToast();
  const [distributorId, setDistributorId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setDistributorId("");
      setGroupId("");
      setError("");
    }
  }, [open]);

  const distributorOptions = useMemo(
    () => (lookups?.distributors || []).filter((d) => d.id !== retailer?.distributor?.id && d.status !== "inactive").map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` })),
    [lookups, retailer],
  );
  const groupOptions = useMemo(
    () => (lookups?.customerGroups || []).filter((g) => String(g.distributorId) === String(distributorId)).map((g) => ({ value: String(g.id), label: `${g.name} (${g.code})` })),
    [lookups, distributorId],
  );
  if (!retailer) return null;

  async function submit() {
    if (!distributorId || !groupId) {
      setError("Select the new distributor and one of its customer groups");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.assign(retailer.id, { distributor_id: Number(distributorId), customer_group_id: Number(groupId) });
      toast.success("Customer moved to the new distributor");
      onChanged?.();
      onClose();
    } catch (err) {
      setError(err.message || "Unable to change the distributor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="Change distributor"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Move customer</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-body text-ink-muted">
          {retailer.name} currently belongs to <strong>{retailer.distributor?.name}</strong>. Only an administrator can move a customer. Past orders, invoices and payments stay with the distributor that issued them.
        </p>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <Select label="New distributor" required value={distributorId} onChange={(e) => { setDistributorId(e.target?.value ?? e); setGroupId(""); }} placeholder="Select distributor" options={distributorOptions} />
        <Select
          label="Customer group of the new distributor" required value={groupId} onChange={(e) => setGroupId(e.target?.value ?? e)} disabled={!distributorId}
          placeholder={distributorId ? (groupOptions.length ? "Select group" : "This distributor has no customer groups") : "Select a distributor first"} options={groupOptions}
        />
      </div>
    </Modal>
  );
}
