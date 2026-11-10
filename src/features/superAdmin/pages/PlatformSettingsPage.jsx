import { useState } from "react";
import { Bell, Settings, ShieldCheck } from "lucide-react";
import Button from "../../../components/ui/Button";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";
import PageHeader from "../../../components/ui/PageHeader";
import Select from "../../../components/ui/Select";
import Tabs from "../../../components/ui/Tabs";
import { useToast } from "../../../components/feedback";
import DemoNotice from "../components/DemoNotice";
import { SETTINGS_DEFAULTS } from "../demoData";

function Toggle({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-control border border-line p-3 hover:bg-surface-muted">
      <span>
        <span className="block font-medium text-ink">{label}</span>
        <span className="block text-caption text-ink-subtle">{description}</span>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 size-4 shrink-0 accent-brand-600" />
    </label>
  );
}

/** Super Admin → Platform Settings (sample data). "Save" only confirms in the UI. */
export default function PlatformSettingsPage() {
  const toast = useToast();
  const [tab, setTab] = useState("general");
  const [s, setS] = useState(SETTINGS_DEFAULTS);
  const update = (group, key) => (e) => setS((p) => ({ ...p, [group]: { ...p[group], [key]: e.target.type === "number" ? Number(e.target.value) : e.target.value } }));
  const toggle = (group, key) => (v) => setS((p) => ({ ...p, [group]: { ...p[group], [key]: v } }));
  const save = () => toast.success("Settings saved (preview only — nothing was sent to the server).");

  const general = (
    <Card className="mt-4">
      <CardHeader title="General" subtitle="How the platform identifies itself." />
      <CardBody className="grid gap-4 md:grid-cols-2">
        <Input label="Platform name" value={s.general.platformName} onChange={update("general", "platformName")} />
        <Input label="Support email" type="email" value={s.general.supportEmail} onChange={update("general", "supportEmail")} />
        <Select label="Time zone" value={s.general.timezone} onChange={update("general", "timezone")} options={[{ value: "Asia/Kolkata", label: "India Standard Time (IST)" }, { value: "UTC", label: "UTC" }]} />
        <Select label="Currency" value={s.general.currency} onChange={update("general", "currency")} options={[{ value: "INR", label: "Indian Rupee (₹)" }]} />
      </CardBody>
    </Card>
  );
  const security = (
    <Card className="mt-4">
      <CardHeader title="Security" subtitle="Sign-in and session rules for every admin account." />
      <CardBody className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Input label="Session timeout (minutes)" type="number" min="5" value={s.security.sessionMinutes} onChange={update("security", "sessionMinutes")} />
          <Input label="Minimum password length" type="number" min="8" value={s.security.passwordMinLength} onChange={update("security", "passwordMinLength")} />
          <Input label="Lock account after failed sign-ins" type="number" min="3" value={s.security.lockAfterFailures} onChange={update("security", "lockAfterFailures")} />
        </div>
        <Toggle label="Require two-factor authentication" description="Every admin must verify with a second factor at sign-in." checked={s.security.requireTwoFactor} onChange={toggle("security", "requireTwoFactor")} />
      </CardBody>
    </Card>
  );
  const notifications = (
    <Card className="mt-4">
      <CardHeader title="Notifications" subtitle="What the platform emails Super Admins about." />
      <CardBody className="space-y-3">
        <Toggle label="Daily email digest" description="A morning summary of new distributors, requests and issues." checked={s.notifications.emailDigest} onChange={toggle("notifications", "emailDigest")} />
        <Toggle label="Failed sign-in alerts" description="Alert after repeated failed sign-ins on any admin account." checked={s.notifications.failedLoginAlerts} onChange={toggle("notifications", "failedLoginAlerts")} />
        <Toggle label="Overdue subscription alerts" description="Alert when a distributor's subscription invoice becomes overdue." checked={s.notifications.overdueInvoiceAlerts} onChange={toggle("notifications", "overdueInvoiceAlerts")} />
        <Toggle label="SAP sync alerts" description="Alert when a scheduled SAP sync fails or is delayed." checked={s.notifications.sapSyncAlerts} onChange={toggle("notifications", "sapSyncAlerts")} />
      </CardBody>
    </Card>
  );

  return (
    <div>
      <PageHeader title="Platform Settings" description="Platform-wide configuration for every admin and distributor." actions={<Button onClick={save}>Save changes</Button>} />
      <DemoNotice />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "general", label: "General", icon: Settings, content: general },
          { id: "security", label: "Security", icon: ShieldCheck, content: security },
          { id: "notifications", label: "Notifications", icon: Bell, content: notifications },
        ]}
      />
    </div>
  );
}
