import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useToast } from "../../../components/feedback";
import { mastersApi } from "../api/mastersApi";

const emptyForm = { distributorId: "", hsn_code: "", description: "", gst_rate: "" };

/**
 * Create / edit an HSN / GST tax record. Only the overall GST rate is stored — the CGST/SGST/IGST split shown
 * elsewhere is computed from it by tax.service.js (intra-state = rate/2 + rate/2, inter-state = full rate as
 * IGST), never entered separately here.
 */
export default function TaxFormModal({ open, onClose, onSaved, tax, distributorOptions, distributorId: fixedDistributorId }) {
  const toast = useToast();
  const isEdit = Boolean(tax);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (tax) {
      setForm({ distributorId: String(tax.distributor?.id || fixedDistributorId || ""), hsn_code: tax.hsnCode || "", description: tax.description || "", gst_rate: tax.gstRate ?? "" });
    } else {
      setForm({ ...emptyForm, distributorId: fixedDistributorId ? String(fixedDistributorId) : "" });
    }
    setErrors({});
  }, [open, tax, fixedDistributorId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  function validate() {
    const e = {};
    if (!isEdit && !form.distributorId) e.distributorId = "Distributor is required";
    if (!form.hsn_code.trim()) e.hsn_code = "HSN code is required";
    if (form.gst_rate === "" || isNaN(Number(form.gst_rate)) || Number(form.gst_rate) < 0 || Number(form.gst_rate) > 100) e.gst_rate = "GST rate must be between 0 and 100";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const payload = { hsn_code: form.hsn_code.trim(), description: form.description.trim() || null, gst_rate: Number(form.gst_rate) };
    try {
      if (isEdit) {
        await mastersApi.taxes.update(tax.id, payload);
        toast.success("Tax record updated");
      } else {
        await mastersApi.taxes.create({ ...payload, distributorId: Number(form.distributorId) });
        toast.success("Tax record created");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Unable to save tax record", { title: "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? "Edit tax record" : "Add tax record"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{isEdit ? "Save changes" : "Create tax record"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4">
        {!isEdit ? (
          <Select label="Distributor" required value={form.distributorId} onChange={set("distributorId")} error={errors.distributorId}
            placeholder="Select distributor" options={(distributorOptions || []).map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }))} />
        ) : (
          <Input label="Distributor" value={`${tax?.distributor?.name || ""} (${tax?.distributor?.code || ""})`} disabled />
        )}
        <Input label="HSN code" required value={form.hsn_code} onChange={set("hsn_code")} error={errors.hsn_code} />
        <Input label="Description" value={form.description} onChange={set("description")} placeholder="e.g. Medicaments (Pharmaceutical products)" />
        <Input label="GST rate (%)" type="number" min="0" max="100" step="0.01" required value={form.gst_rate} onChange={set("gst_rate")} error={errors.gst_rate} hint="CGST/SGST/IGST are computed from this rate automatically" />
      </div>
    </Modal>
  );
}
