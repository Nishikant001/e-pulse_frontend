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
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useToast, useConfirm } from "../../../components/feedback";
import { RETAILER_PORTALS, retailerLabels, retailersApi } from "../api/retailersApi";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9][0-9\s-]{7,14}$/;
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const PINCODE = /^[1-9][0-9]{5}$/;

const EMPTY = {
  name: "", contact_person: "", phone_number: "", alternatePhone: "", email: "", street1: "", street2: "", street3: "", city: "", region: "", pincode: "",
  territory: "", taxNumber: "", pan: "", customer_group_id: "", distributor_id: "", status: "active",
  sameShipping: true, ship: { street1: "", street2: "", city: "", region: "", pincode: "" },
};

// Mirrors the server rules; the server remains the authority and returns the same field keys.
function validate(f, { needsDistributor }) {
  const e = {};
  if (needsDistributor && !f.distributor_id) e.distributor_id = "Select a distributor";
  if (!f.name.trim()) e.name = "Business name is required";
  if (!f.phone_number.trim()) e.phone_number = "Phone number is required";
  else if (!PHONE.test(f.phone_number.trim())) e.phone_number = "Enter a valid phone number (8–15 digits)";
  if (f.alternatePhone.trim() && !PHONE.test(f.alternatePhone.trim())) e.alternatePhone = "Enter a valid phone number (8–15 digits)";
  if (f.email.trim() && !EMAIL.test(f.email.trim())) e.email = "Enter a valid email address";
  if (!f.street1.trim()) e.street1 = "Address line 1 is required";
  if (!f.city.trim()) e.city = "City is required";
  if (!f.region.trim()) e.region = "State is required";
  if (!f.pincode.trim()) e.pincode = "PIN code is required";
  else if (!PINCODE.test(f.pincode.trim())) e.pincode = "Enter a valid 6-digit PIN code";
  if (f.taxNumber.trim() && !GSTIN.test(f.taxNumber.trim().toUpperCase())) e.taxNumber = "Enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5)";
  if (f.pan.trim() && !PAN.test(f.pan.trim().toUpperCase())) e.pan = "Enter a valid 10-character PAN (e.g. ABCDE1234F)";
  if (!f.customer_group_id) e.customer_group_id = "Select a customer group";
  if (!f.sameShipping) {
    if (!f.ship.street1.trim()) e["shipping.street1"] = "Shipping address line 1 is required";
    if (!f.ship.city.trim()) e["shipping.city"] = "Shipping city is required";
    if (!f.ship.region.trim()) e["shipping.region"] = "Shipping state is required";
    if (!PINCODE.test(f.ship.pincode.trim())) e["shipping.pincode"] = "Enter a valid 6-digit PIN code";
  }
  return e;
}

const fromDetail = (d) => ({
  name: d.name || "", contact_person: d.contactPerson || "", phone_number: d.phone || "", alternatePhone: d.alternatePhone || "", email: d.email || "",
  street1: d.address.street1 || "", street2: d.address.street2 || "", street3: d.address.street3 || "", city: d.address.city || "", region: d.address.state || "",
  pincode: d.address.pincode || "", territory: d.territory || "", taxNumber: d.gstin || "", pan: d.pan || "", customer_group_id: d.customerGroup ? String(d.customerGroup.id) : "",
  distributor_id: String(d.distributor?.id || ""), status: d.status,
  sameShipping: !d.shipping,
  ship: d.shipping ? { street1: d.shipping.street1 || "", street2: d.shipping.street2 || "", city: d.shipping.city || "", region: d.shipping.state || "", pincode: d.shipping.pincode || "" } : EMPTY.ship,
});

/** Add / Edit customer — /admin/masters/customers/new|:id/edit and /dashboard/customers/new|:id/edit */
export default function RetailerFormPage({ portal = "distributor" }) {
  const cfg = RETAILER_PORTALS[portal];
  const L = retailerLabels(portal);
  const { id } = useParams();
  const isEdit = Boolean(id);
  const isAdmin = portal === "admin";
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const api = useMemo(() => retailersApi(portal), [portal]);
  const [form, setForm] = useState(EMPTY);
  const [original, setOriginal] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [lookups, setLookups] = useState({});
  const [load, setLoad] = useState({ status: isEdit ? "loading" : "ready", error: null });

  const fetchRetailer = useCallback(() => {
    if (!isEdit) return undefined;
    const c = new AbortController();
    setLoad({ status: "loading", error: null });
    api
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
  }, [api, id, isEdit]);
  useEffect(() => fetchRetailer(), [fetchRetailer]);
  useEffect(() => {
    const c = new AbortController();
    api.lookups(c.signal).then(setLookups).catch(() => {});
    return () => c.abort();
  }, [api]);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value, ...(key === "distributor_id" ? { customer_group_id: "" } : {}) }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };
  const setShip = (key) => (e) => {
    setForm((f) => ({ ...f, ship: { ...f.ship, [key]: e.target.value } }));
    setErrors((prev) => (prev[`shipping.${key}`] ? { ...prev, [`shipping.${key}`]: undefined } : prev));
  };

  // Which distributor's customer groups may be chosen: the picked one (admin, create) or the current owner (edit / distributor portal).
  const ownerId = isAdmin ? (isEdit ? original?.distributor?.id : form.distributor_id) : undefined;
  const groupOptions = useMemo(
    () => (lookups.customerGroups || []).filter((g) => (isAdmin ? String(g.distributorId) === String(ownerId || "") : true)).map((g) => ({ value: String(g.id), label: `${g.name} (${g.code})` })),
    [lookups, isAdmin, ownerId],
  );

  async function handleSave() {
    const found = validate(form, { needsDistributor: isAdmin && !isEdit });
    setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Please fix the highlighted fields", { title: "Check the form" });
      return;
    }
    const ok = await confirm({
      title: isEdit ? "Save changes?" : `Create ${L.noun}?`,
      message: isEdit ? `Update the details of ${form.name.trim()}?` : `${form.name.trim()} will be added${isAdmin ? "" : " to your retailers"}. No login is created — retailers do not sign in.`,
      confirmLabel: isEdit ? "Save changes" : `Create ${L.noun}`,
    });
    if (!ok) return;

    const payload = {
      name: form.name.trim(), contact_person: form.contact_person.trim(), phone_number: form.phone_number.trim(), alternatePhone: form.alternatePhone.trim(),
      email: form.email.trim(), street1: form.street1.trim(), street2: form.street2.trim(), street3: form.street3.trim(), city: form.city.trim(), region: form.region.trim(),
      pincode: form.pincode.trim(), territory: form.territory.trim(), taxNumber: form.taxNumber.trim().toUpperCase(), pan: form.pan.trim().toUpperCase(),
      customer_group_id: Number(form.customer_group_id),
      shipping: form.sameShipping ? null : { street1: form.ship.street1.trim(), street2: form.ship.street2.trim(), city: form.ship.city.trim(), region: form.ship.region.trim(), pincode: form.ship.pincode.trim() },
    };
    // Ownership is never sent from the distributor portal, and never sent on edit: the server derives it (distributor) or uses the
    // dedicated "Change distributor" action (admin).
    if (isAdmin && !isEdit) {
      payload.distributor_id = Number(form.distributor_id);
      payload.status = form.status;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await api.update(id, payload);
        toast.success(`${L.Noun} updated`);
        navigate(`${cfg.base}/${id}`);
      } else {
        const created = await api.create(payload);
        toast.success(`${L.Noun} ${created.code} created`);
        navigate(`${cfg.base}/${created.id}`);
      }
    } catch (err) {
      if (err?.details && typeof err.details === "object") setErrors((prev) => ({ ...prev, ...err.details }));
      toast.error(err.message || `Unable to save ${L.noun}`, { title: "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  const back = () => navigate(isEdit ? `${cfg.base}/${id}` : cfg.base);
  if (load.status === "loading") return <LoadingState label={`Loading ${L.noun}…`} />;
  if (load.status === "error") {
    const s = load.error?.status;
    return <ErrorState message={s === 404 ? "This retailer does not exist." : s === 403 ? "You do not have access to this retailer." : load.error?.message || "Unable to load this retailer."} onRetry={fetchRetailer} />;
  }

  const distributorOptions = (lookups.distributors || []).filter((d) => d.status !== "inactive").map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }));
  const noGroups = lookups.customerGroups && groupOptions.length === 0 && (!isAdmin || ownerId);

  return (
    <div>
      <PageHeader
        title={isEdit ? `Edit ${original?.name || L.noun}` : `Add ${L.noun}`}
        description={isEdit ? "Update business, contact, address and tax details. Status is changed from the retailer page." : "Create a retailer record. Retailers have no login — they are business records only."}
        actions={<IconButton icon={ArrowLeft} label="Back" variant="outline" onClick={back} />}
      />

      <div className="space-y-4">
        <Card>
          <CardHeader title="Business & contact" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={`${L.Noun} code`} value={isEdit ? original?.code || "" : "Assigned automatically"} disabled hint="System-generated and unique — it cannot be edited" />
            {isAdmin && !isEdit ? (
              <Select label="Distributor" required value={form.distributor_id} onChange={set("distributor_id")} error={errors.distributor_id} placeholder="Select distributor" options={distributorOptions} hint="The distributor that owns this retailer" />
            ) : isAdmin ? (
              <Input label="Distributor" value={original?.distributor ? `${original.distributor.name} (${original.distributor.code})` : ""} disabled hint="Use “Change distributor” on the retailer page to move it" />
            ) : (
              <Input label="Distributor" value="Your distributorship" disabled hint="Retailers you add are automatically assigned to you" />
            )}
            <Input label="Business name" required value={form.name} onChange={set("name")} error={errors.name} wrapperClassName="sm:col-span-2" />
            <Input label="Contact person" value={form.contact_person} onChange={set("contact_person")} error={errors.contact_person} />
            <Input label="Phone number" required value={form.phone_number} onChange={set("phone_number")} error={errors.phone_number} inputMode="tel" />
            <Input label="Alternate phone" value={form.alternatePhone} onChange={set("alternatePhone")} error={errors.alternatePhone} inputMode="tel" />
            <Input label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} />
            {noGroups ? (
              <Alert tone="warning" className="sm:col-span-2">
                No customer group exists for this distributor yet. A retailer needs one for pricing.{!isAdmin ? <> Customer groups are managed by your administrator — ask them to create one first.</> : null}
              </Alert>
            ) : null}
            <Select
              label="Customer group" required value={form.customer_group_id} onChange={set("customer_group_id")} error={errors.customer_group_id}
              disabled={isAdmin && !isEdit && !form.distributor_id} placeholder={isAdmin && !isEdit && !form.distributor_id ? "Select a distributor first" : "Select group"}
              options={groupOptions} hint="Used for pricing" wrapperClassName="sm:col-span-2"
            />
            {isAdmin && !isEdit ? (
              <Select label="Status" value={form.status} onChange={set("status")} error={errors.status} options={[{ value: "active", label: "Active" }, { value: "pending", label: "Pending" }, { value: "inactive", label: "Inactive" }]} hint="Only active retailers can receive new orders" />
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Billing address & territory" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Address line 1" required value={form.street1} onChange={set("street1")} error={errors.street1} wrapperClassName="sm:col-span-2" />
            <Input label="Address line 2" value={form.street2} onChange={set("street2")} error={errors.street2} />
            <Input label="Address line 3" value={form.street3} onChange={set("street3")} error={errors.street3} />
            <Input label="City" required value={form.city} onChange={set("city")} error={errors.city} />
            <Input label="State" required value={form.region} onChange={set("region")} error={errors.region} list="retailer-states" />
            <datalist id="retailer-states">{(lookups.states || []).map((v) => <option key={v} value={v} />)}</datalist>
            <Input label="PIN code" required value={form.pincode} onChange={set("pincode")} error={errors.pincode} inputMode="numeric" maxLength={6} />
            <Input label="Territory" value={form.territory} onChange={set("territory")} error={errors.territory} list="retailer-territories" hint="Leave blank to use the city / state" />
            <datalist id="retailer-territories">{(lookups.territories || []).map((v) => <option key={v} value={v} />)}</datalist>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Shipping address" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-body text-ink sm:col-span-2">
              <input type="checkbox" className="h-4 w-4 rounded border-line" checked={form.sameShipping} onChange={(e) => setForm((f) => ({ ...f, sameShipping: e.target.checked }))} />
              Shipping address is the same as the billing address
            </label>
            {!form.sameShipping ? (
              <>
                <Input label="Address line 1" required value={form.ship.street1} onChange={setShip("street1")} error={errors["shipping.street1"]} wrapperClassName="sm:col-span-2" />
                <Input label="Address line 2" value={form.ship.street2} onChange={setShip("street2")} />
                <Input label="City" required value={form.ship.city} onChange={setShip("city")} error={errors["shipping.city"]} />
                <Input label="State" required value={form.ship.region} onChange={setShip("region")} error={errors["shipping.region"]} />
                <Input label="PIN code" required value={form.ship.pincode} onChange={setShip("pincode")} error={errors["shipping.pincode"]} inputMode="numeric" maxLength={6} />
              </>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Tax details" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="GSTIN" value={form.taxNumber} onChange={set("taxNumber")} error={errors.taxNumber} maxLength={15} hint="15 characters, e.g. 27ABCDE1234F1Z5" />
            <Input label="PAN" value={form.pan} onChange={set("pan")} error={errors.pan} maxLength={10} hint="10 characters, e.g. ABCDE1234F" />
          </CardBody>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={back} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{isEdit ? "Save changes" : `Create ${L.noun}`}</Button>
        </div>
      </div>
    </div>
  );
}
