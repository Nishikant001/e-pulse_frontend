import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useToast } from "../../../components/feedback";
import { mastersApi } from "../api/mastersApi";

const emptyForm = { distributorId: "", productId: "", batch_no: "", mfg_date: "", exp_date: "", mrp: "", purchase_price: "", openingQty: "" };

/**
 * Create / edit a batch (identity fields only: batch number, MFG/expiry dates, MRP, purchase price). Duplicate
 * batch numbers and invalid date ranges are rejected server-side by the existing batchValidation.service.js —
 * this form does not re-implement those rules, it only surfaces whatever the API rejects.
 * On create, an optional "opening quantity" posts an OPENING stock movement right after the batch is created.
 */
export default function BatchFormModal({ open, onClose, onSaved, batch, productOptions, distributorOptions, distributorId: fixedDistributorId, productId: fixedProductId }) {
  const toast = useToast();
  const isEdit = Boolean(batch);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (batch) {
      setForm({
        distributorId: String(batch.product?.distributorId || batch.distributorId || fixedDistributorId || ""),
        productId: String(batch.product?.id || batch.productId || fixedProductId || ""),
        batch_no: batch.batchNo || "", mfg_date: batch.mfgDate || "", exp_date: batch.expDate || "",
        mrp: batch.mrp ?? "", purchase_price: batch.purchasePrice ?? "", openingQty: "",
      });
    } else {
      setForm({ ...emptyForm, distributorId: fixedDistributorId ? String(fixedDistributorId) : "", productId: fixedProductId ? String(fixedProductId) : "" });
    }
    setErrors({});
  }, [open, batch, fixedDistributorId, fixedProductId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const scopedProductOptions = (productOptions || []).filter((p) => !form.distributorId || String(p.distributorId) === String(form.distributorId));

  function validate() {
    const e = {};
    if (!isEdit && !form.distributorId) e.distributorId = "Distributor is required";
    if (!form.productId) e.productId = "Product is required";
    if (!form.batch_no.trim()) e.batch_no = "Batch number is required";
    if (!form.mfg_date) e.mfg_date = "Manufacturing date is required";
    if (!form.exp_date) e.exp_date = "Expiry date is required";
    if (form.mfg_date && form.exp_date && form.exp_date <= form.mfg_date) e.exp_date = "Expiry date must be after the manufacturing date";
    if (form.openingQty !== "" && (isNaN(Number(form.openingQty)) || Number(form.openingQty) < 0)) e.openingQty = "Opening quantity must be zero or more";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      batch_no: form.batch_no.trim(), mfg_date: form.mfg_date, exp_date: form.exp_date,
      mrp: form.mrp === "" ? null : Number(form.mrp), purchase_price: form.purchase_price === "" ? null : Number(form.purchase_price),
    };
    try {
      if (isEdit) {
        await mastersApi.batches.update(batch.id, payload);
        toast.success("Batch updated");
      } else {
        const result = await mastersApi.batches.create({
          ...payload, distributorId: Number(form.distributorId), productId: Number(form.productId),
          openingQty: form.openingQty === "" ? undefined : Number(form.openingQty),
        });
        toast.success("Batch created");
        if (result.openingStockPosted === false) toast.error(result.openingStockError || "Opening stock could not be posted; add it from Inventory.", { title: "Batch saved, but opening stock failed" });
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Unable to save batch", { title: "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? "Edit batch" : "Add batch"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{isEdit ? "Save changes" : "Create batch"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!isEdit ? (
          <Select label="Distributor" required value={form.distributorId} onChange={(e) => setForm((f) => ({ ...f, distributorId: e.target.value, productId: "" }))} error={errors.distributorId}
            placeholder="Select distributor" options={(distributorOptions || []).map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }))} wrapperClassName="sm:col-span-2" />
        ) : (
          <Input label="Distributor" value={`${batch?.product?.distributorName || ""}`} disabled wrapperClassName="sm:col-span-2" />
        )}
        {!isEdit ? (
          <Select label="Product" required value={form.productId} onChange={set("productId")} error={errors.productId}
            placeholder={form.distributorId ? "Select product" : "Select a distributor first"} disabled={!form.distributorId}
            options={scopedProductOptions.map((p) => ({ value: String(p.id), label: `${p.name} (${p.sku})` }))} wrapperClassName="sm:col-span-2" />
        ) : (
          <Input label="Product" value={batch?.productName || ""} disabled wrapperClassName="sm:col-span-2" />
        )}
        <Input label="Batch number" required value={form.batch_no} onChange={set("batch_no")} error={errors.batch_no} />
        <div />
        <Input label="Manufacturing date" type="date" required value={form.mfg_date} onChange={set("mfg_date")} error={errors.mfg_date} />
        <Input label="Expiry date" type="date" required value={form.exp_date} onChange={set("exp_date")} error={errors.exp_date} />
        <Input label="MRP (₹)" type="number" min="0" step="0.01" value={form.mrp} onChange={set("mrp")} />
        <Input label="Purchase price (₹)" type="number" min="0" step="0.01" value={form.purchase_price} onChange={set("purchase_price")} />
        {!isEdit ? (
          <Input label="Opening quantity (optional)" type="number" min="0" value={form.openingQty} onChange={set("openingQty")} error={errors.openingQty}
            hint="Posts an OPENING stock movement for this batch immediately" wrapperClassName="sm:col-span-2" />
        ) : null}
      </div>
    </Modal>
  );
}
