import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input, { Textarea } from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useToast } from "../../../components/feedback";
import { mastersApi } from "../api/mastersApi";

const UNITS = ["TAB", "CAP", "BOTTLE", "VIAL", "STRIP", "BOX", "TUBE", "AMPOULE", "SACHET", "PCS"];

const emptyForm = {
  distributorId: "", name: "", generic_name: "", brand: "", category: "", dosage_form: "", strength: "",
  pack_size: "", unit: "TAB", mfg_by: "", hsn_id: "", mrp: "", sale_price: "", reorder_level: "10", description: "",
};

/**
 * Create / edit a product. On create, `distributorId` is required (the Admin explicitly names the owning
 * distributor); on edit, the distributor is fixed (resolved server-side from the existing record) and shown
 * read-only. HSN options are scoped to the selected distributor — GST rate is inherited from the HSN, not entered
 * separately, per the existing tax model (see tax.service.js).
 */
export default function ProductFormModal({ open, onClose, onSaved, product, lookups, distributorId: fixedDistributorId }) {
  const toast = useToast();
  const isEdit = Boolean(product);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({
        distributorId: String(product.distributor?.id || fixedDistributorId || ""),
        name: product.name || "", generic_name: product.genericName || "", brand: product.brand || "",
        category: product.category === "Uncategorised" ? "" : product.category || "", dosage_form: product.dosageForm || "",
        strength: product.strength || "", pack_size: product.packSize || "", unit: product.unit || "TAB",
        mfg_by: product.manufacturer || "", hsn_id: product.hsn?.id ? String(product.hsn.id) : "",
        mrp: product.mrp ?? "", sale_price: product.salePrice ?? "", reorder_level: String(product.reorderLevel ?? 10),
        description: product.description || "",
      });
    } else {
      setForm({ ...emptyForm, distributorId: fixedDistributorId ? String(fixedDistributorId) : "" });
    }
    setErrors({});
  }, [open, product, fixedDistributorId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const hsnOptions = (lookups?.hsnOptions || [])
    .filter((h) => !form.distributorId || String(h.distributorId) === String(form.distributorId))
    .map((h) => ({ value: String(h.id), label: `${h.hsnCode} — ${h.description} (${h.gstRate}% GST)` }));

  function validate() {
    const e = {};
    if (!isEdit && !form.distributorId) e.distributorId = "Distributor is required";
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.unit) e.unit = "Unit of measurement is required";
    if (!form.hsn_id) e.hsn_id = "HSN / tax category is required";
    if (form.mrp !== "" && (isNaN(Number(form.mrp)) || Number(form.mrp) < 0)) e.mrp = "MRP must be a non-negative amount";
    if (form.sale_price !== "" && (isNaN(Number(form.sale_price)) || Number(form.sale_price) < 0)) e.sale_price = "Sale price must be a non-negative amount";
    if (form.mrp !== "" && form.sale_price !== "" && Number(form.sale_price) > Number(form.mrp)) e.sale_price = "Sale price cannot exceed MRP";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(), generic_name: form.generic_name.trim() || null, brand: form.brand.trim() || null,
      category: form.category.trim() || null, dosage_form: form.dosage_form || null, strength: form.strength.trim() || null,
      pack_size: form.pack_size.trim() || null, unit: form.unit, mfg_by: form.mfg_by.trim() || null,
      hsn_id: Number(form.hsn_id), mrp: form.mrp === "" ? null : Number(form.mrp), sale_price: form.sale_price === "" ? null : Number(form.sale_price),
      reorder_level: Number(form.reorder_level) || 10, description: form.description.trim() || null,
    };
    try {
      if (isEdit) {
        await mastersApi.products.update(product.id, payload);
        toast.success("Product updated");
      } else {
        await mastersApi.products.create({ ...payload, distributorId: Number(form.distributorId) });
        toast.success("Product created");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Unable to save product", { title: "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? "Edit product" : "Add product"}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{isEdit ? "Save changes" : "Create product"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!isEdit ? (
          <Select
            label="Distributor" required value={form.distributorId} onChange={set("distributorId")} error={errors.distributorId}
            placeholder="Select distributor" options={(lookups?.distributors || []).map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }))}
            wrapperClassName="sm:col-span-2"
          />
        ) : (
          <Input label="Distributor" value={`${product?.distributor?.name || ""} (${product?.distributor?.code || ""})`} disabled wrapperClassName="sm:col-span-2" />
        )}
        <Input label="Product name" required value={form.name} onChange={set("name")} error={errors.name} wrapperClassName="sm:col-span-2" />
        <Input label="Generic name" value={form.generic_name} onChange={set("generic_name")} hint="e.g. Paracetamol" />
        <Input label="Brand" value={form.brand} onChange={set("brand")} />
        <Input label="Category" value={form.category} onChange={set("category")} hint="e.g. Analgesic, Antibiotic" />
        <Select label="Dosage form" value={form.dosage_form} onChange={set("dosage_form")} placeholder="Select dosage form" options={(lookups?.dosageForms || []).map((v) => ({ value: v, label: v }))} />
        <Input label="Strength" value={form.strength} onChange={set("strength")} hint='e.g. "500mg"' />
        <Input label="Pack size" value={form.pack_size} onChange={set("pack_size")} hint='e.g. "10x10", "100ml"' />
        <Select label="Unit of measurement" required value={form.unit} onChange={set("unit")} error={errors.unit} options={UNITS.map((u) => ({ value: u, label: u }))} />
        <Input label="Manufacturer" value={form.mfg_by} onChange={set("mfg_by")} />
        <Select
          label="HSN / Tax category" required value={form.hsn_id} onChange={set("hsn_id")} error={errors.hsn_id}
          placeholder={form.distributorId ? "Select HSN code" : "Select a distributor first"} options={hsnOptions} disabled={!form.distributorId}
        />
        <Input label="Reorder level" type="number" min="0" value={form.reorder_level} onChange={set("reorder_level")} hint="Flags low stock on Inventory screens" />
        <Input label="MRP (₹)" type="number" min="0" step="0.01" value={form.mrp} onChange={set("mrp")} error={errors.mrp} />
        <Input label="Sale price (₹)" type="number" min="0" step="0.01" value={form.sale_price} onChange={set("sale_price")} error={errors.sale_price} />
        <Textarea label="Description" value={form.description} onChange={set("description")} wrapperClassName="sm:col-span-2" rows={3} />
      </div>
    </Modal>
  );
}
