import { useEffect, useState } from "react";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import PageHeader from "../../../components/ui/PageHeader";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Alert from "../../../components/ui/Alert";
import LoadingState from "../../../components/ui/LoadingState";
import { useToast } from "../../../components/feedback";
import { authFetch } from "../../../utils/authFetch";

/**
 * e-Pulse Phase 1 — Distributor Settings.
 *  Profile      : read-only business details (the administrator controls these) + two editable contact fields
 *  Security     : change password (needs the current one)
 */
const api = {
  get: () => authFetch("/settings"),
  save: (body) => authFetch("/settings/profile", { method: "PUT", body: JSON.stringify(body) }),
  password: (body) => authFetch("/settings/change-password", { method: "POST", body: JSON.stringify(body) }),
};

const errText = (e, fallback) => (e && e.message) || fallback;

function Row({ label, value }) {
  return (
    <div>
      <dt className="text-caption text-ink-subtle">{label}</dt>
      <dd className="text-body text-ink">{value || <span className="text-ink-subtle">—</span>}</dd>
    </div>
  );
}

export default function DistributorSettingsPage() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [contact, setContact] = useState({ contactPerson: "", phone: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    let live = true;
    api.get().then((d) => { if (live) { setProfile(d); setContact({ contactPerson: d.contactPerson || "", phone: d.phone || "" }); } })
      .catch((e) => live && setLoadError(errText(e, "Unable to load your settings.")));
    return () => { live = false; };
  }, []);

  const saveContact = async (e) => {
    e.preventDefault();
    setSaving(true); setFieldErrors({});
    try {
      const d = await api.save(contact);
      setProfile(d); toast.success("Contact details saved");
    } catch (err) {
      setFieldErrors(err?.details || {});
      toast.error(errText(err, "Could not save. Please check the fields."));
    } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwError("");
    if (pw.newPassword.length < 8) return setPwError("New password must be at least 8 characters.");
    if (pw.newPassword !== pw.confirm) return setPwError("New password and confirmation do not match.");
    setPwSaving(true);
    try {
      await api.password({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed");
    } catch (err) {
      setPwError(errText(err, "Could not change the password."));
    } finally { setPwSaving(false); }
  };

  if (loadError) return <Alert tone="error" title="Settings unavailable">{loadError}</Alert>;
  if (!profile) return <LoadingState label="Loading settings…" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your account details and password." />

      <Card>
        <CardHeader title="Business profile" subtitle="These details are maintained by your administrator. Contact them to change anything other than the contact fields below." />
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Row label="Distributor code" value={profile.code} />
            <Row label="Name" value={profile.name} />
            <Row label="Email" value={profile.email} />
            <Row label="GSTIN" value={profile.gstin} />
            <Row label="PAN" value={profile.pan} />
            <Row label="Status" value={profile.status} />
            <Row label="City" value={profile.city} />
            <Row label="State" value={profile.state} />
            <Row label="Pincode" value={profile.pincode} />
            <Row label="Territory" value={profile.territory} />
            <Row label="Payment terms" value={profile.paymentTerms} />
            <Row label="Address" value={profile.address} />
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Contact details" subtitle="Who we reach at your distributorship." />
        <CardBody>
          <form onSubmit={saveContact} className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <Input label="Contact person" value={contact.contactPerson} maxLength={150} error={fieldErrors.contactPerson} onChange={(e) => setContact((c) => ({ ...c, contactPerson: e.target.value }))} />
            <Input label="Phone number" required value={contact.phone} error={fieldErrors.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} />
            <div className="sm:col-span-2"><Button type="submit" loading={saving}>Save contact details</Button></div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Change password" subtitle="Use at least 8 characters. You stay signed in on this device." />
        <CardBody>
          <form onSubmit={changePassword} className="grid max-w-2xl gap-4 sm:grid-cols-2" autoComplete="off">
            {pwError ? <div className="sm:col-span-2"><Alert tone="error">{pwError}</Alert></div> : null}
            <div className="sm:col-span-2"><Input type="password" label="Current password" required autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} /></div>
            <Input type="password" label="New password" required autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} />
            <Input type="password" label="Confirm new password" required autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />
            <div className="sm:col-span-2"><Button type="submit" loading={pwSaving}>Change password</Button></div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
