import Alert from "../../../components/ui/Alert";
import Badge from "../../../components/ui/Badge";
import Drawer from "../../../components/ui/Drawer";
import { formatDateTime } from "../../../utils/format";
import { AUTH_LABEL, CRED_META, DIRECTION_LABEL, ENV_LABEL, ERP_TYPE_LABEL, HEALTH_META, PROVIDER_STATUS_META, STATUS_META } from "../erpDisplay";

const Row = ({ label, children }) => (
  <div className="grid grid-cols-3 gap-3 border-b border-line py-2 text-body last:border-0">
    <dt className="text-ink-subtle">{label}</dt>
    <dd className="col-span-2 min-w-0 break-words text-ink">{children ?? <span className="text-ink-subtle">—</span>}</dd>
  </div>
);

/** Read-only view of one connection. Shows a masked credential line — never a secret. */
export default function ErpDetailDrawer({ connection: c, open, onClose }) {
  if (!c) return null;
  const health = HEALTH_META[c.health.state];
  return (
    <Drawer open={open} onClose={onClose} size="md" title={c.name} description={`${c.code} · ${ERP_TYPE_LABEL[c.erpType] || c.erpType}`}>
      <div className="mb-4 flex flex-wrap gap-2">
        {c.isDefault ? <Badge tone="brand">DEFAULT</Badge> : null}
        <Badge tone={STATUS_META[c.status].tone} dot>{STATUS_META[c.status].label}</Badge>
        <Badge tone={health.tone} dot>{health.label}</Badge>
      </div>
      {c.health.state === "FAILED" ? <Alert tone="error" title={c.health.code} className="mb-4">{c.health.message}</Alert> : null}
      {c.health.state === "NOT_TESTED" ? <Alert tone="info" className="mb-4">This connection has never been tested. Saved configuration does not prove the ERP is reachable.</Alert> : null}
      <dl>
        <Row label="Environment">{ENV_LABEL[c.environment] || c.environment}</Row>
        <Row label="Base URL">{c.baseUrl}</Row>
        <Row label="Provider">{c.provider?.label ? <span>{c.provider.label} <Badge size="sm" tone={(PROVIDER_STATUS_META[c.provider.status] || {}).tone}>{(PROVIDER_STATUS_META[c.provider.status] || {}).label}</Badge></span> : null}</Row>
        <Row label="Service / API path">{c.odataServicePath}</Row>
        {c.provider?.protocol === "ODATA" ? <><Row label="OData version">{c.odataVersion}</Row><Row label="SAP client">{c.sapClient}</Row><Row label="Company code">{c.companyCode}</Row></> : null}
        <Row label="Authentication">{AUTH_LABEL[c.authType] || c.authType}{c.authHeaderName ? ` (${c.authHeaderName})` : ""}</Row>
        <Row label="Credential reference">{c.credentials.reference}</Row>
        <Row label="Secret">••••••••</Row>
        <Row label="Credential status">{CRED_META[c.credentials.status].label}</Row>
        <Row label="Timeout">{c.timeoutMs} ms</Row>
        <Row label="Last test">{c.health.testedAt ? `${formatDateTime(c.health.testedAt)}${c.health.latencyMs != null ? ` · ${c.health.latencyMs} ms` : ""}` : null}</Row>
        <Row label="Description">{c.description}</Row>
      </dl>
      <h3 className="mb-2 mt-5 text-body font-semibold text-ink">Capabilities</h3>
      {c.capabilities.length ? (
        <ul className="divide-y divide-line rounded-card border border-line">
          {c.capabilities.map((x) => (
            <li key={x.capability} className="flex items-center justify-between gap-3 px-3 py-2 text-body">
              <span>{x.label}{x.endpointPath ? <span className="ml-2 text-caption text-ink-subtle">{x.endpointPath}</span> : null}</span>
              <span className="flex items-center gap-2 text-caption text-ink-muted">{DIRECTION_LABEL[x.direction]}{x.enabled ? null : <Badge size="sm">Disabled</Badge>}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-body text-ink-subtle">No capabilities configured.</p>}
    </Drawer>
  );
}
