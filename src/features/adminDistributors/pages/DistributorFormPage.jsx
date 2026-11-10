import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import IconButton from "../../../components/ui/IconButton";
import Alert from "../../../components/ui/Alert";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingState from "../../../components/ui/LoadingState";
import ErrorState from "../../../components/ui/ErrorState";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useToast, useConfirm } from "../../../components/feedback";
import { AdminApiError } from "../../../utils/adminApi";
import { distributorsApi } from "../api/distributorsApi";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9][0-9\s-]{7,14}$/;
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const PINCODE = /^[1-9][0-9]{5}$/;

const EMPTY = {
  name: "", contact_person: "", email: "", phone_number: "", street1: "", street2: "", street3: "", city: "", region: "", postal_code: "",
  country: "India", territory: "", tax_no: "", pan: "", credit_limit: "", payment_terms: "", status: "pending",
};

// Mirrors the server rules (the server is still the authority and returns the same field keys).
function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = "Business name is required";
  if (!f.email.trim()) e.email = "Email is required";
  else if (!EMAIL.test(f.email.trim())) e.email = "Enter a valid email address";
  if (!f.phone_number.trim()) e.phone_number = "Phone number is required";
  else if (!PHONE.test(f.phone_number.trim())) e.phone_number = "Enter a valid phone number (8–15 digits)";
  if (!f.street1.trim()) e.street1 = "Address line 1 is required";
  if (!f.city.trim()) e.city = "City is required";
  if (!f.region.trim()) e.region = "State is required";
  if (!f.postal_code.trim()) e.postal_code = "Postal code is required";
  else if (!PINCODE.test(f.postal_code.trim())) e.postal_code = "Enter a valid 6-digit postal code";
  if (f.tax_no.trim() && !GSTIN.test(f.tax_no.trim().toUpperCase())) e.tax_no = "Enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5)";
  if (f.pan.trim() && !PAN.test(f.pan.trim().toUpperCase())) e.pan = "Enter a valid 10-character PAN (e.g. ABCDE1234F)";
  if (f.credit_limit !== "" && (Number.isNaN(Number(f.credit_limit)) || Number(f.credit_limit) < 0)) e.credit_limit = "Credit limit must be a non-negative amount";
  return e;
}

const fromDetail = (d) => ({
  name: d.name || "", contact_person: d.contactPerson || "", email: d.email || "", phone_number: d.phone || "",
  street1: d.address.street1 || "", street2: d.address.street2 || "", street3: d.address.street3 || "", city: d.address.city || "",
  region: d.address.state || "", postal_code: d.address.postalCode || "", country: d.address.country || "India", territory: d.territory || "",
  tax_no: d.gstin || "", pan: d.pan || "", credit_limit: d.creditLimit ?? "", payment_terms: d.paymentTerms || "", status: d.status,
});

/** Add / Edit distributor — /admin/distributors/new and /admin/distributors/:id/edit */
export default function DistributorFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState(EMPTY);
  const [original, setOriginal] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [lookups, setLookups] = useState({});
  const [load, setLoad] = useState({ status: isEdit ? "loading" : "ready", error: null });

  const fetchDistributor = useCallback(() => {
    if (!isEdit) return undefined;
    const c = new AbortController();
    setLoad({ status: "loading", error: null });
    distributorsApi
      .detail(id, c.signal)
      .then((d) => {
        setOriginal(d);
        setForm(fromDetail(d));
        setLoad({ status: "ready", error: null });
      })
      .catch((error) => {
        if (error?.name !== "AbortError") setLoad({ status: "error", error });
      });
    return () => c.abort();
  }, [id, isEdit]);

  useEffect(() => fetchDistributor(), [fetchDistributor]);
  useEffect(() => {
    const c = new AbortController();
    distributorsApi.lookups(c.signal).then(setLookups).catch(() => {});
    return () => c.abort();
  }, []);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  async function handleSave() {
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Please fix the highlighted fields", { title: "Check the form" });
      return;
    }
    const emailChanged = isEdit && original && form.email.trim().toLowerCase() !== (original.email || "").toLowerCase();
    const ok = await confirm({
      title: isEdit ? "Save changes?" : "Create distributor?",
      message: isEdit
        ? emailChanged
          ? "The email address is the distributor's sign-in identity. Changing it changes the address they must use to log in."
          : `Update the details of ${form.name.trim()}?`
        : `${form.name.trim()} will be added with status “${form.status}”. No login account is created — one must be set up separately.`,
      tone: emailChanged ? "warning" : "primary",
      confirmLabel: isEdit ? "Save changes" : "Create distributor",
    });
    if (!ok) return;

    const payload = {
      name: form.name.trim(), contact_person: form.contact_person.trim(), email: form.email.trim(), phone_number: form.phone_number.trim(),
      street1: form.street1.trim(), street2: form.street2.trim(), street3: form.street3.trim(), city: form.city.trim(), region: form.region.trim(),
      postal_code: form.postal_code.trim(), country: form.country.trim(), territory: form.territory.trim(), tax_no: form.tax_no.trim().toUpperCase(),
      pan: form.pan.trim().toUpperCase(), credit_limit: form.credit_limit === "" ? "" : Number(form.credit_limit), payment_terms: form.payment_terms,
    };
    setSaving(true);
    try {
      if (isEdit) {
        await distributorsApi.update(id, payload);
        toast.success("Distributor updated");
        navigate(`/admin/distributors/${id}`);
      } else {
        const created = await distributorsApi.create({ ...payload, status: form.status });
        toast.success(`Distributor ${created.code} created`);
        navigate(`/admin/distributors/${created.id}`);
      }
    } catch (err) {
      if (err instanceof AdminApiError && err.details && typeof err.details === "object") setErrors((prev) => ({ ...prev, ...err.details }));
      toast.error(err.message || "Unable to save distributor", { title: "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  const back = () => navigate(isEdit ? `/admin/distributors/${id}` : "/admin/distributors");
  if (load.status === "loading") return <LoadingState label="Loading distributor…" />;
  if (load.status === "error") return <ErrorState message={load.error?.status === 404 ? "This distributor does not exist." : load.error?.message || "Unable to load this distributor."} onRetry={fetchDistributor} />;

  const stateOptions = (lookups.states || []).map((v) => ({ value: v, label: v }));
  const termOptions = (lookups.paymentTerms || []).map((v) => ({ value: v, label: v }));

  return (
    <div>
      <PageHeader
        title={isEdit ? `Edit ${original?.name || "distributor"}` : "Add distributor"}
        description={isEdit ? "Update business, contact, address and commercial details. Status is changed from the profile page." : "Create a distributor record. A login account is not created automatically."}
        actions={<IconButton icon={ArrowLeft} label="Back" variant="outline" onClick={back} />}
      />

      <div className="space-y-4">
        <Card>
          <CardHeader title="Business & contact" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Distributor code" value={isEdit ? original?.code || "" : "Assigned automatically"} disabled hint="System-generated and unique — it cannot be edited" />
            <Input label="Business name" required value={form.name} onChange={set("name")} error={errors.name} />
            <Input label="Contact person" value={form.contact_person} onChange={set("contact_person")} error={errors.contact_person} />
            <Input label="Phone number" required value={form.phone_number} onChange={set("phone_number")} error={errors.phone_number} inputMode="tel" />
            <Input label="Email" required type="email" value={form.email} onChange={set("email")} error={errors.email} hint="Also used as the distributor's sign-in identity" wrapperClassName="sm:col-span-2" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Address & territory" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Alert tone="info" className="sm:col-span-2">This is the distributor's registered / billing address. A separate shipping address is not stored on the distributor record.</Alert>
            <Input label="Address line 1" required value={form.street1} onChange={set("street1")} error={errors.street1} wrapperClassName="sm:col-span-2" />
            <Input label="Address line 2" value={form.street2} onChange={set("street2")} error={errors.street2} />
            <Input label="Address line 3" value={form.street3} onChange={set("street3")} error={errors.street3} />
            <Input label="City" required value={form.city} onChange={set("city")} error={errors.city} />
            {stateOptions.length ? (
              <Input label="State" required value={form.region} onChange={set("region")} error={errors.region} list="distributor-states" />
            ) : (
              <Input label="State" required value={form.region} onChange={set("region")} error={errors.region} />
            )}
            <datalist id="distributor-states">{stateOptions.map((o) => <option key={o.value} value={o.value} />)}</datalist>
            <Input label="Postal code" required value={form.postal_code} onChange={set("postal_code")} error={errors.postal_code} inputMode="numeric" maxLength={6} />
            <Input label="Country" value={form.country} onChange={set("country")} error={errors.country} />
            <Input label="Territory" value={form.territory} onChange={set("territory")} error={errors.territory} list="distributor-territories" hint="Leave blank to use the city / state as the territory" wrapperClassName="sm:col-span-2" />
            <datalist id="distributor-territories">{(lookups.territories || []).map((v) => <option key={v} value={v} />)}</datalist>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tax & commercial terms" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="GSTIN" value={form.tax_no} onChange={set("tax_no")} error={errors.tax_no} maxLength={15} hint="15 characters, e.g. 27ABCDE1234F1Z5" />
            <Input label="PAN" value={form.pan} onChange={set("pan")} error={errors.pan} maxLength={10} hint="10 characters, e.g. ABCDE1234F" />
            <Input label="Credit limit (₹)" type="number" min="0" step="0.01" value={form.credit_limit} onChange={set("credit_limit")} error={errors.credit_limit} hint="Recorded for reference — not yet enforced on orders" />
            <Select label="Payment terms" value={form.payment_terms} onChange={set("payment_terms")} placeholder="Not set" options={termOptions} error={errors.payment_terms} />
            {!isEdit ? (
              <Select
                label="Account status" value={form.status} onChange={set("status")} error={errors.status}
                options={[{ value: "pending", label: "Pending" }, { value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]}
                hint="Only Active distributors can sign in and create orders"
              />
            ) : null}
          </CardBody>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={back} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{isEdit ? "Save changes" : "Create distributor"}</Button>
        </div>
      </div>
    </div>
  );
}
