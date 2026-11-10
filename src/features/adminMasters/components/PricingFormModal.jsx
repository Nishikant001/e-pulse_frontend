import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useToast } from "../../../components/feedback";
import { mastersApi } from "../api/mastersApi";

const emptyForm = { distributorId: "", productId: "", customer_group_id: "", base_price: "", discount_percent: "", valid_from: "", valid_to: "" };

/**
 * Create / edit a product-wise price for a customer group. base_price / discount_percent are the SAME fields
 * pricing.service.js already uses to compute the unit price for a Sales Order line — nothing is recomputed here.
 * A product and customer group can have at most one PricingMaster row (see models/pricingmaster.model.js); editing
 * changes that one row rather than adding a new "version".
 */
export default function PricingFormModal({ open, onClose, onSaved, pricing, productOptions, customerGroupOptions, distributorOptions, distributorId: fixedDistributorId, productId: fixedProductId }) {
  const toast = useToast();
  const isEdit = Boolean(pricing);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (pricing) {
      setForm({
        distributorId: String(pricing.distributor?.id || fixedDistributorId || ""),
        productId: String(pricing.product?.id || fixedProductId || ""),
        customer_group_id: String(pricing.customerGroup?.id || ""),
        base_price: pricing.basePrice ?? "", discount_percent: pricing.discountPercent ?? "",
        valid_from: pricing.validFrom || "", valid_to: pricing.validTo || "",
      });
    } else {
      setForm({ ...emptyForm, distributorId: fixedDistributorId ? String(fixedDistributorId) : "", productId: fixedProductId ? String(fixedProductId) : "" });
    }
    setErrors({});
  }, [open, pricing, fixedDistributorId, fixedProductId]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e?.target ? e.target.value : e }));

  const scopedProducts = (productOptions || []).filter((p) => !form.distributorId || String(p.distributorId) === String(form.distributorId));
  const scopedGroups = (customerGroupOptions || []).filter((g) => !form.distributorId || String(g.distributorId) === String(form.distributorId));

  function validate() {
    const e = {};
    if (!isEdit && !form.distributorId) e.distributorId = "Distributor is required";
    if (!form.productId) e.productId = "Product is required";
    if (!form.customer_group_id) e.customer_group_id = "Customer group is required";
    if (form.base_price === "" || isNaN(Number(form.base_price)) || Number(form.base_price) < 0) e.base_price = "Base price must be a non-negative amount";
    if (form.discount_percent !== "" && (isNaN(Number(form.discount_percent)) || Number(form.discount_percent) < 0 || Number(form.discount_percent) > 100)) e.discount_percent = "Discount must be between 0 and 100";
    if (!form.valid_from) e.valid_from = "Effective-from date is required";
    if (form.valid_to && form.valid_from && form.valid_to < form.valid_from) e.valid_to = "Effective-to date cannot be before effective-from";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      productId: Number(form.productId), customer_group_id: Number(form.customer_group_id),
      base_price: Number(form.base_price), discount_percent: form.discount_percent === "" ? 0 : Number(form.discount_percent),
      valid_from: form.valid_from, valid_to: form.valid_to || null,
    };
    try {
      if (isEdit) {
        await mastersApi.pricing.update(pricing.id, payload);
        toast.success("Pricing updated");
      } else {
        await mastersApi.pricing.create({ ...payload, distributorId: Number(form.distributorId) });
        toast.success("Pricing created");
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Unable to save pricing", { title: "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? "Edit pricing" : "Add pricing"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{isEdit ? "Save changes" : "Create pricing"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!isEdit ? (
          <Select label="Distributor" required value={form.distributorId} onChange={(e) => setForm((f) => ({ ...f, distributorId: e.target.value, productId: "", customer_group_id: "" }))} error={errors.distributorId}
            placeholder="Select distributor" options={(distributorOptions || []).map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }))} wrapperClassName="sm:col-span-2" />
        ) : (
          <Input label="Distributor" value={`${pricing?.distributor?.name || ""} (${pricing?.distributor?.code || ""})`} disabled wrapperClassName="sm:col-span-2" />
        )}
        {!isEdit ? (
          <Select label="Product" required value={form.productId} onChange={set("productId")} error={errors.productId}
            placeholder={form.distributorId ? "Select product" : "Select a distributor first"} disabled={!form.distributorId}
            options={scopedProducts.map((p) => ({ value: String(p.id), label: `${p.name} (${p.sku})` }))} />
        ) : (
          <Input label="Product" value={`${pricing?.product?.name || ""} (${pricing?.product?.sku || ""})`} disabled />
        )}
        {!isEdit ? (
          <Select label="Customer group" required value={form.customer_group_id} onChange={set("customer_group_id")} error={errors.customer_group_id}
            placeholder={form.distributorId ? "Select customer group" : "Select a distributor first"} disabled={!form.distributorId}
            options={scopedGroups.map((g) => ({ value: String(g.id), label: g.name }))} />
        ) : (
          <Input label="Customer group" value={pricing?.customerGroup?.name || ""} disabled />
        )}
        <Input label="Base price (₹)" type="number" min="0" step="0.01" required value={form.base_price} onChange={set("base_price")} error={errors.base_price} />
        <Input label="Discount (%)" type="number" min="0" max="100" step="0.01" value={form.discount_percent} onChange={set("discount_percent")} error={errors.discount_percent} hint="Applied to base price for the unit price" />
        <Input label="Effective from" type="date" required value={form.valid_from} onChange={set("valid_from")} error={errors.valid_from} />
        <Input label="Effective to (optional)" type="date" value={form.valid_to} onChange={set("valid_to")} error={errors.valid_to} />
      </div>
    </Modal>
  );
}
