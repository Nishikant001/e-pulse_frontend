import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import IconButton from "../../../components/ui/IconButton";
import Alert from "../../../components/ui/Alert";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingState from "../../../components/ui/LoadingState";
import ErrorState from "../../../components/ui/ErrorState";
import Input, { Textarea } from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useToast, useConfirm } from "../../../components/feedback";
import { SCHEME_BASE, schemesApi } from "../api/schemesApi";
import CheckList from "../components/CheckList";

const todayIso = () => new Date().toISOString().slice(0, 10);
const EMPTY = {
  name: "", scheme_code: "", description: "", scheme_type: "QUANTITY_FREE", product_scope: "PRODUCTS", category: "", product_ids: [],
  distributor_scope: "ALL", distributor_ids: [], retailer_scope: "ALL", retailer_ids: [],
  buy_quantity: "", free_quantity: "", discount_percent: "", discount_amount: "", min_quantity: "", max_quantity: "", max_discount: "",
  valid_from: todayIso(), valid_to: "", priority: "100", status: "active",
};
const s = (v) => (v === null || v === undefined ? "" : String(v));
const fromDetail = (d) => ({
  name: d.name, scheme_code: d.code, description: d.description || "", scheme_type: d.type, product_scope: d.productScope, category: d.category || "", product_ids: d.productIds,
  distributor_scope: d.distributorScope, distributor_ids: d.distributorIds, retailer_scope: d.retailerScope, retailer_ids: d.retailerIds,
  buy_quantity: s(d.buyQuantity), free_quantity: s(d.freeQuantity), discount_percent: s(d.discountPercent), discount_amount: s(d.discountAmount),
  min_quantity: s(d.minQuantity), max_quantity: s(d.maxQuantity), max_discount: s(d.maxDiscount), valid_from: d.validFrom, valid_to: d.validTo || "", priority: s(d.priority), status: d.status,
});

const pos = (v) => v !== "" && Number.isInteger(Number(v)) && Number(v) > 0;
// Mirrors the server rules for fast feedback; the server stays the authority and returns the same field keys.
function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = "Scheme name is required";
  if (f.scheme_code.trim() && !/^[A-Za-z0-9][A-Za-z0-9_-]{2,29}$/.test(f.scheme_code.trim())) e.scheme_code = "3–30 characters: letters, digits, - or _";
  if (f.product_scope === "PRODUCTS" && f.product_ids.length === 0) e.product_ids = "Select at least one product";
  if (f.product_scope === "CATEGORY" && !f.category) e.category = "Choose a category";
  if (f.distributor_scope === "SPECIFIC" && f.distributor_ids.length === 0) e.distributor_ids = "Select at least one distributor";
  if (f.retailer_scope === "SPECIFIC" && f.retailer_ids.length === 0) e.retailer_ids = "Select at least one retailer";
  if (f.scheme_type === "QUANTITY_FREE") {
    if (!pos(f.buy_quantity)) e.buy_quantity = "Enter a whole number above zero";
    if (!pos(f.free_quantity)) e.free_quantity = "Enter a whole number above zero";
  } else {
    if (f.min_quantity !== "" && !pos(f.min_quantity)) e.min_quantity = "Enter a whole number above zero";
    if (f.scheme_type === "PERCENT_DISCOUNT" && !(Number(f.discount_percent) > 0 && Number(f.discount_percent) <= 100)) e.discount_percent = "Enter a percentage above 0 and up to 100";
    if (f.scheme_type === "FIXED_DISCOUNT" && !(Number(f.discount_amount) > 0)) e.discount_amount = "Enter an amount above zero";
    if (f.max_discount !== "" && !(Number(f.max_discount) > 0)) e.max_discount = "Enter an amount above zero";
  }
  if (f.max_quantity !== "") {
    if (!pos(f.max_quantity)) e.max_quantity = "Enter a whole number above zero";
    else if (f.scheme_type === "QUANTITY_FREE" && pos(f.buy_quantity) && Number(f.max_quantity) < Number(f.buy_quantity)) e.max_quantity = "Cannot be below the buy quantity";
    else if (f.scheme_type !== "QUANTITY_FREE" && pos(f.min_quantity) && Number(f.max_quantity) < Number(f.min_quantity)) e.max_quantity = "Cannot be below the minimum quantity";
  }
  if (!f.valid_from) e.valid_from = "Valid from is required";
  if (f.valid_to && f.valid_from && f.valid_to < f.valid_from) e.valid_to = "Valid to cannot be before valid from";
  if (!pos(f.priority) || Number(f.priority) > 9999) e.priority = "Enter a whole number from 1 to 9999";
  return e;
}

function summary(f) {
  if (f.scheme_type === "QUANTITY_FREE") return pos(f.buy_quantity) && pos(f.free_quantity) ? `Buy ${f.buy_quantity}, get ${f.free_quantity} free. Buying ${Number(f.buy_quantity) * 2} gives ${Number(f.free_quantity) * 2} free (total ${Number(f.buy_quantity) * 2 + Number(f.free_quantity) * 2}).` : "Enter the buy and free quantities.";
  if (f.scheme_type === "PERCENT_DISCOUNT") return Number(f.discount_percent) > 0 ? `${f.discount_percent}% off the line value${pos(f.min_quantity) ? ` for ${f.min_quantity}+ units` : ""}${Number(f.max_discount) > 0 ? `, capped at ₹${f.max_discount}` : ""}.` : "Enter the discount percentage.";
  return Number(f.discount_amount) > 0 ? `₹${f.discount_amount} off the line${pos(f.min_quantity) ? ` for ${f.min_quantity}+ units` : ""}, never more than the line value.` : "Enter the discount amount.";
}

/** Add / Edit scheme — /admin/masters/schemes/new and /admin/masters/schemes/:id/edit (Admin only). */
export default function SchemeFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [lookups, setLookups] = useState({});
  const [load, setLoad] = useState({ status: isEdit ? "loading" : "ready", error: null });
  const [original, setOriginal] = useState(null);

  const fetchScheme = useCallback(() => {
    if (!isEdit) return undefined;
    const c = new AbortController();
    setLoad({ status: "loading", error: null });
    schemesApi.detail(id, c.signal).then((d) => { setOriginal(d); setForm(fromDetail(d)); setLoad({ status: "ready", error: null }); }).catch((error) => { if (error?.name !== "AbortError") setLoad({ status: "error", error }); });
    return () => c.abort();
  }, [id, isEdit]);
  useEffect(() => fetchScheme(), [fetchScheme]);

  // Product / retailer choices are narrowed to the chosen distributors (server re-validates this on save).
  const scopedDistributor = form.distributor_scope === "SPECIFIC" && form.distributor_ids.length === 1 ? form.distributor_ids[0] : "";
  useEffect(() => {
    const c = new AbortController();
    schemesApi.lookups({ distributorId: scopedDistributor }, c.signal).then(setLookups).catch(() => {});
    return () => c.abort();
  }, [scopedDistributor]);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((p) => (p[key] ? { ...p, [key]: undefined } : p));
  };

  const productOptions = useMemo(() => {
    const ids = new Set(form.distributor_scope === "SPECIFIC" ? form.distributor_ids : []);
    return (lookups.products || []).filter((p) => !ids.size || ids.has(p.distributorId)).map((p) => ({ id: p.id, label: `${p.name} (${p.code || p.id})` }));
  }, [lookups.products, form.distributor_scope, form.distributor_ids]);
  const retailerOptions = useMemo(() => {
    const ids = new Set(form.distributor_scope === "SPECIFIC" ? form.distributor_ids : []);
    return (lookups.retailers || []).filter((r) => !ids.size || ids.has(r.distributorId)).map((r) => ({ id: r.id, label: `${r.name}${r.code ? ` (${r.code})` : ""}` }));
  }, [lookups.retailers, form.distributor_scope, form.distributor_ids]);

  async function handleSave() {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) { toast.error("Please fix the highlighted fields", { title: "Check the form" }); return; }
    const ok = await confirm({
      title: isEdit ? "Save changes?" : "Create scheme?",
      message: isEdit ? "Changes apply to future evaluations only. Records that already used this scheme are not recalculated." : `${form.name.trim()} will be created${form.status === "active" ? " and applied from its valid-from date" : " as inactive"}.`,
      confirmLabel: isEdit ? "Save changes" : "Create scheme",
    });
    if (!ok) return;
    const num = (v) => (v === "" ? null : Number(v));
    const payload = {
      name: form.name.trim(), description: form.description.trim(), product_scope: form.product_scope, category: form.category, product_ids: form.product_ids,
      distributor_scope: form.distributor_scope, distributor_ids: form.distributor_ids, retailer_scope: form.retailer_scope, retailer_ids: form.retailer_ids,
      buy_quantity: num(form.buy_quantity), free_quantity: num(form.free_quantity), discount_percent: num(form.discount_percent), discount_amount: num(form.discount_amount),
      min_quantity: num(form.min_quantity), max_quantity: num(form.max_quantity), max_discount: num(form.max_discount),
      valid_from: form.valid_from, valid_to: form.valid_to || null, priority: Number(form.priority), status: form.status,
    };
    if (!isEdit) { payload.scheme_type = form.scheme_type; if (form.scheme_code.trim()) payload.scheme_code = form.scheme_code.trim().toUpperCase(); }
    setSaving(true);
    try {
      const out = isEdit ? await schemesApi.update(id, payload) : await schemesApi.create(payload);
      toast.success(isEdit ? "Scheme updated" : `Scheme ${out.code} created`);
      navigate(`${SCHEME_BASE}/${out.id}`);
    } catch (err) {
      const field = err?.details?.field;
      if (field) setErrors((p) => ({ ...p, [field]: err.message }));
      toast.error(err.message || "Unable to save scheme", { title: "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  const back = () => navigate(isEdit ? `${SCHEME_BASE}/${id}` : SCHEME_BASE);
  if (load.status === "loading") return <LoadingState label="Loading scheme…" />;
  if (load.status === "error") return <ErrorState message={load.error?.status === 404 ? "This scheme does not exist." : load.error?.message || "Unable to load this scheme."} onRetry={fetchScheme} />;

  const type = form.scheme_type;
  const scopeOptions = (all, specific) => [{ value: "ALL", label: all }, { value: "SPECIFIC", label: specific }];

  return (
    <div>
      <PageHeader
        title={isEdit ? `Edit ${original?.name || "scheme"}` : "Add scheme"}
        description="Schemes are configured by the administrator only. Products, distributors and retailers are referenced, never copied."
        actions={<IconButton icon={ArrowLeft} label="Back" variant="outline" onClick={back} />}
      />
      <div className="space-y-4">
        <Card>
          <CardHeader title="Basic information" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Scheme name" required value={form.name} onChange={set("name")} error={errors.name} />
            <Input label="Scheme code" value={form.scheme_code} onChange={set("scheme_code")} error={errors.scheme_code} disabled={isEdit} hint={isEdit ? "Cannot be changed" : "Leave blank to generate automatically"} />
            <Select label="Scheme type" required value={type} onChange={set("scheme_type")} disabled={isEdit} hint={isEdit ? "Cannot be changed — create a new scheme instead" : undefined}
              options={[{ value: "QUANTITY_FREE", label: "Quantity — Buy X get Y free" }, { value: "PERCENT_DISCOUNT", label: "Percentage discount" }, { value: "FIXED_DISCOUNT", label: "Fixed discount amount" }]} />
            <Input label="Priority" required type="number" min="1" max="9999" value={form.priority} onChange={set("priority")} error={errors.priority} hint="Lower number wins. Schemes never stack." />
            <Textarea label="Description" rows={2} maxLength={500} value={form.description} onChange={set("description")} wrapperClassName="sm:col-span-2" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Applicability" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Products" value={form.product_scope} onChange={set("product_scope")} options={[{ value: "PRODUCTS", label: "Specific products" }, { value: "CATEGORY", label: "Product category" }]} />
            {form.product_scope === "CATEGORY"
              ? <Select label="Category" required value={form.category} onChange={set("category")} error={errors.category} placeholder="Select category" options={(lookups.categories || []).map((c) => ({ value: c, label: c }))} />
              : <div />}
            <Select label="Distributors" value={form.distributor_scope} onChange={set("distributor_scope")} options={scopeOptions("All distributors", "Specific distributors")} />
            <Select label="Retailers" value={form.retailer_scope} onChange={set("retailer_scope")} options={scopeOptions("All retailers", "Specific retailers")} />
            {form.distributor_scope === "SPECIFIC" ? <CheckList label="Applicable distributors" options={(lookups.distributors || []).map((d) => ({ id: d.id, label: `${d.name} (${d.code})` }))} value={form.distributor_ids} onChange={set("distributor_ids")} error={errors.distributor_ids} /> : null}
            {form.product_scope === "PRODUCTS" ? <CheckList label="Applicable products" options={productOptions} value={form.product_ids} onChange={set("product_ids")} error={errors.product_ids} hint="Products belong to one distributor each." empty="No products found." /> : null}
            {form.retailer_scope === "SPECIFIC" ? <CheckList label="Applicable retailers" options={retailerOptions} value={form.retailer_ids} onChange={set("retailer_ids")} error={errors.retailer_ids} hint="Retailers must belong to the selected distributors." empty="No retailers found." /> : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Scheme rule" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {type === "QUANTITY_FREE" ? (
              <>
                <Input label="Buy quantity" required type="number" min="1" value={form.buy_quantity} onChange={set("buy_quantity")} error={errors.buy_quantity} />
                <Input label="Free quantity" required type="number" min="1" value={form.free_quantity} onChange={set("free_quantity")} error={errors.free_quantity} hint="Free goods are tracked separately from the paid quantity" />
              </>
            ) : null}
            {type === "PERCENT_DISCOUNT" ? <Input label="Discount (%)" required type="number" min="0" max="100" step="0.01" value={form.discount_percent} onChange={set("discount_percent")} error={errors.discount_percent} /> : null}
            {type === "FIXED_DISCOUNT" ? <Input label="Discount amount (₹)" required type="number" min="0" step="0.01" value={form.discount_amount} onChange={set("discount_amount")} error={errors.discount_amount} /> : null}
            {type !== "QUANTITY_FREE" ? <Input label="Minimum quantity" type="number" min="1" value={form.min_quantity} onChange={set("min_quantity")} error={errors.min_quantity} /> : null}
            <Input label="Maximum quantity" type="number" min="1" value={form.max_quantity} onChange={set("max_quantity")} error={errors.max_quantity} hint="Quantity above this earns no extra benefit" />
            {type !== "QUANTITY_FREE" ? <Input label="Maximum discount (₹)" type="number" min="0" step="0.01" value={form.max_discount} onChange={set("max_discount")} error={errors.max_discount} /> : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Validity & status" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="Valid from" type="date" required value={form.valid_from} onChange={set("valid_from")} error={errors.valid_from} />
            <Input label="Valid to (optional)" type="date" value={form.valid_to} onChange={set("valid_to")} error={errors.valid_to} />
            <Select label="Status" value={form.status} onChange={set("status")} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
          </CardBody>
        </Card>

        <Alert tone="info" title="Summary">{summary(form)} Only one scheme applies per product line — if two schemes share the same priority, neither is applied.</Alert>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={back} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{isEdit ? "Save changes" : "Create scheme"}</Button>
        </div>
      </div>
    </div>
  );
}
