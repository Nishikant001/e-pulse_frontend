import { CalendarClock, Eye, FlaskConical, ListTree, Pencil, Power, PowerOff, RefreshCw, Star } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { cn } from "../../../utils/cn";
import { formatDateTime } from "../../../utils/format";
import { CRED_META, ENV_LABEL, ERP_TYPE_LABEL, PROVIDER_STATUS_META, STATUS_META, enabledCaps, healthMeta } from "../erpDisplay";
import { useErpPermissions } from "../erpPermissions";

/** One ERP connection. A tenant has MANY of these side by side; the default one is marked, never implied. */
export default function ErpConnectionCard({ connection: c, testing, busy, onView, onEdit, onTest, onSetDefault, onToggleStatus, onMap, onSync, onSchedule, onCodes }) {
  const status = STATUS_META[c.status] || STATUS_META.INACTIVE;
  const perm = useErpPermissions();
  const health = healthMeta(c.health);
  const cred = CRED_META[c.credentials.status] || CRED_META.NOT_SET;
  const caps = enabledCaps(c);
  const inactive = c.status === "INACTIVE";
  const syncable = c.provider?.status === "IMPLEMENTED" && caps.some((x) => x.syncSupported && x.direction !== "DMS_TO_ERP");

  return (
    <Card className={cn("flex flex-col p-5", c.isDefault && "border-brand-300 ring-1 ring-brand-200", inactive && "bg-neutral-50")} aria-label={`${c.name} ERP connection`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button type="button" onClick={() => onView(c)} className="block max-w-full truncate text-left text-section font-semibold text-brand-700 underline-offset-2 hover:underline">{c.name}</button>
          <p className="text-caption text-ink-subtle">{c.code} · {ERP_TYPE_LABEL[c.erpType] || c.erpType} · {ENV_LABEL[c.environment] || c.environment}</p>
          <p className="mt-0.5 text-caption text-ink-subtle">Provider: {c.provider?.label || "not selected"}{c.provider && c.provider.status !== "IMPLEMENTED" ? ` (${(PROVIDER_STATUS_META[c.provider.status] || {}).label})` : ""}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {c.isDefault ? <Badge tone="brand" icon={Star}>DEFAULT</Badge> : null}
          <Badge tone={status.tone} dot>{status.label}</Badge>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-body sm:grid-cols-2">
        <div>
          <dt className="text-caption text-ink-subtle">Last connection test</dt>
          <dd className="flex flex-wrap items-center gap-2">
            <Badge tone={health.tone} size="sm" dot>{health.label}</Badge>
            <span className="text-caption text-ink-muted">{c.health.testedAt ? formatDateTime(c.health.testedAt) : "Never"}</span>
          </dd>
          {c.health.status === "FAILED" || c.health.state === "FAILED" ? <dd className="mt-1 text-caption text-error-700">{c.health.message}</dd> : null}
          {c.health.status === "DEGRADED" && c.health.reason ? <dd className="mt-1 text-caption text-warning-700">{c.health.reason}</dd> : null}
        </div>
        <div>
          <dt className="text-caption text-ink-subtle">Credentials</dt>
          <dd><Badge tone={cred.tone} size="sm">{cred.label}</Badge></dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-caption text-ink-subtle">Capabilities</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {caps.length ? caps.map((x) => <Badge key={x.capability} size="sm" tone="info">{x.label}</Badge>) : <span className="text-caption text-ink-subtle">None enabled yet</span>}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        {perm.can(["ERP_MANAGE", "ERP_SYNC"]) ? <Button size="sm" variant="secondary" leftIcon={FlaskConical} loading={testing} disabled={busy} onClick={() => onTest(c)}>Test</Button> : null}
        {syncable && perm.manage ? <Button size="sm" variant="secondary" leftIcon={ListTree} onClick={() => onMap(c)}>Mapping</Button> : null}
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => onCodes?.(c)}>Code mappings</Button>
        {syncable && perm.schedule ? <Button size="sm" variant="secondary" leftIcon={CalendarClock} disabled={busy || inactive} title={inactive ? "Activate the connection first" : undefined} onClick={() => onSchedule(c)}>Schedule</Button> : null}
        {syncable && perm.sync ? <Button size="sm" leftIcon={RefreshCw} disabled={busy || inactive} title={inactive ? "Activate the connection first" : undefined} onClick={() => onSync(c)}>Sync</Button> : null}
        <Button size="sm" variant="secondary" leftIcon={Eye} onClick={() => onView(c)}>View</Button>
        {perm.manage ? <Button size="sm" variant="secondary" leftIcon={Pencil} onClick={() => onEdit(c)}>Edit</Button> : null}
        {perm.manage && !c.isDefault ? <Button size="sm" variant="subtle" leftIcon={Star} disabled={busy || inactive} title={inactive ? "Activate the connection first" : undefined} onClick={() => onSetDefault(c)}>Set default</Button> : null}
        {perm.manage ? <Button size="sm" variant={inactive ? "subtle" : "ghost"} leftIcon={inactive ? Power : PowerOff} disabled={busy} onClick={() => onToggleStatus(c)}>{inactive ? "Activate" : "Deactivate"}</Button> : null}
      </div>
    </Card>
  );
}
