import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useToast } from "../../../components/feedback";
import { mastersApi } from "../api/mastersApi";

const emptyForm = { distributorId: "", code: "", name: "" };

/**
 * Create / edit a customer group. The code (e.g. RETAIL, WHOLESALE) is unique per distributor and is fixed once
 * created — only the display name can be edited. Duplicate codes are rejected server-side.
 */
export default function CustomerGroupFormModal({ open, onClose, onSaved, group, distributorOptions, distributorId: fixedDistributorId }) {
  const toast = useToast();
  const isEdit = Boolean(group);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (group) setForm({ distributorId: String(group.distributor?.id || ""), code: group.code || "", name: group.name || "" });
    else setForm({ ...emptyForm, distributorId: fixedDistributorId ? String(fixedDistributorId) : "" });
    setErrors({});
  }, [open, group, fixedDistributorId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  function validate() {
    const e = {};
    if (!isEdit && !form.distributorId) e.distributorId = "Distributor is required";
    if (!isEdit && !form.code.trim()) e.code = "Group code is required";
    if (!form.name.trim()) e.name = "Group name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await mastersApi.customerGroups.update(group.id, { name: form.name.trim() });
        toast.success("Customer group updated");
      } else {
        await mastersApi.customerGroups.create({ distributorId: Number(form.distributorId), code: form.code.trim().toUpperCase(), name: form.name.trim() });
        toast.success("Customer group created");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Unable to save customer group", { title: "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? "Edit customer group" : "Add customer group"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{isEdit ? "Save changes" : "Create group"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        {!isEdit ? (
          <Select label="Distributor" required value={form.distributorId} onChange={set("distributorId")} error={errors.distributorId}
            placeholder="Select distributor" options={(distributorOptions || []).map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }))} />
        ) : (
          <Input label="Distributor" value={`${group?.distributor?.name || ""} (${group?.distributor?.code || ""})`} disabled />
        )}
        <Input label="Group code" required value={form.code} onChange={set("code")} error={errors.code} disabled={isEdit} placeholder="e.g. RETAIL, WHOLESALE" hint={isEdit ? "The code cannot be changed after creation" : "Stored in upper case; unique per distributor"} />
        <Input label="Group name" required value={form.name} onChange={set("name")} error={errors.name} placeholder="e.g. Retail Customers" />
      </div>
    </Modal>
  );
}
