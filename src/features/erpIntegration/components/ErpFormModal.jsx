import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import Input, { Textarea } from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useToast } from "../../../components/feedback";
import { erpApi } from "../api/erpApi";
import { AUTH_LABEL, CRED_META, PAGINATION_LABEL, errorText } from "../erpDisplay";

const empty = { name: "", erpType: "SAP_S4HANA", provider: "", environment: "PRODUCTION", odataVersion: "V2", baseUrl: "", odataServicePath: "", sapClient: "", companyCode: "", authType: "BASIC", authHeaderName: "", credentialRef: "", timeoutMs: "10000", description: "" };
const MASK = "••••••••";
const emptyCap = (d) => ({ enabled: false, direction: d.defaultDirection, ownership: "", idempotency: false, externalIdPath: "", baseConfig: null, endpointPath: "", responsePath: "", pagination: "NONE", pageSize: "", pageParam: "", sizeParam: "", offsetParam: "", limitParam: "", cursorParam: "", nextPath: "", cursorPath: "", totalPath: "" });

function capFromConnection(x) {
  const p = x.config?.pagination || {};
  return { enabled: x.enabled, direction: x.direction, ownership: x.ownership || "", idempotency: Boolean(x.config?.outbound?.idempotencySupported), externalIdPath: x.config?.outbound?.externalIdPath || "", baseConfig: x.config || null, endpointPath: x.endpointPath || "", responsePath: x.config?.responsePath || "", pagination: p.type || "NONE",
    pageSize: p.pageSize ? String(p.pageSize) : "", pageParam: p.pageParam || "", sizeParam: p.sizeParam || "", offsetParam: p.offsetParam || "", limitParam: p.limitParam || "", cursorParam: p.cursorParam || "", nextPath: p.nextPath || "", cursorPath: p.cursorPath || "", totalPath: p.totalPath || "" };
}
function capConfig(v) {
  const config = {};
  if (v.responsePath.trim()) config.responsePath = v.responsePath.trim();
  if (v.pagination !== "NONE") {
    const p = { type: v.pagination };
    ["pageSize"].forEach((k) => { if (v[k]) p[k] = Number(v[k]); });
    ["pageParam", "sizeParam", "offsetParam", "limitParam", "cursorParam", "nextPath", "cursorPath", "totalPath"].forEach((k) => { if (v[k].trim()) p[k] = v[k].trim(); });
    config.pagination = p;
  }
  return withOutbound(config, v);
}
// Phase 16: outbound (DMS → ERP) settings live inside the capability config; other settings are kept as they were.
function withOutbound(config, v) {
  const out = { ...config };
  if (v.idempotency || v.externalIdPath.trim()) out.outbound = { ...(v.baseConfig?.outbound || {}), idempotencySupported: Boolean(v.idempotency), ...(v.externalIdPath.trim() ? { externalIdPath: v.externalIdPath.trim() } : {}) };
  return out;
}
const PAG_FIELDS = {
  NONE: [], PAGE_NUMBER: ["pageParam", "sizeParam", "pageSize", "totalPath"], OFFSET_LIMIT: ["offsetParam", "limitParam", "pageSize", "totalPath"],
  NEXT_URL: ["nextPath", "pageSize"], CURSOR: ["cursorParam", "cursorPath", "pageSize"],
};
const PAG_LABEL = { pageParam: "Page parameter", sizeParam: "Page-size parameter", offsetParam: "Offset parameter", limitParam: "Limit parameter", cursorParam: "Cursor parameter", pageSize: "Page size", nextPath: "Next-link field", cursorPath: "Next-cursor field", totalPath: "Total-count field (optional)" };

/**
 * Add / edit an ERP connection. There is NO password field: the secret is never typed into, stored by or shown in the browser.
 * The connection holds only a credential REFERENCE (the name of a secret on the server); the masked line shows whether the
 * server can find it. The provider decides which settings apply (SAP OData needs a service path; Generic REST needs response/pagination
 * settings per capability). Nothing is synchronised until a sync is started on the Sync page.
 */
export default function ErpFormModal({ open, onClose, onSaved, connection, lookups }) {
  const toast = useToast();
  const isEdit = Boolean(connection);
  const [form, setForm] = useState(empty);
  const [caps, setCaps] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const capDefs = useMemo(() => lookups?.capabilities || [], [lookups]);
  const providers = lookups?.providers || [];
  const erpType = (lookups?.erpTypes || []).find((t) => t.value === form.erpType);
  const providerKey = form.provider || erpType?.defaultProvider || null;
  const providerInfo = providers.find((p) => p.key === providerKey);
  const isOData = providerInfo?.protocol === "ODATA";
  const isRest = providerInfo?.protocol === "REST";
  const providerReady = providerInfo?.status === "IMPLEMENTED";
  const authOptions = (lookups?.authTypes || []).filter((a) => !providerInfo || providerInfo.authTypes.includes(a));

  useEffect(() => {
    if (!open) return;
    const base = {};
    capDefs.forEach((d) => { base[d.value] = emptyCap(d); });
    if (connection) {
      (connection.capabilities || []).forEach((x) => { base[x.capability] = { ...base[x.capability], ...capFromConnection(x) }; });
      setForm({ name: connection.name, erpType: connection.erpType, provider: connection.provider?.explicit ? connection.provider.key : "", environment: connection.environment, odataVersion: connection.odataVersion, baseUrl: connection.baseUrl, odataServicePath: connection.odataServicePath || "", sapClient: connection.sapClient || "", companyCode: connection.companyCode || "", authType: connection.authType || "BASIC", authHeaderName: connection.authHeaderName || "", credentialRef: connection.credentials?.reference || "", timeoutMs: String(connection.timeoutMs), description: connection.description || "" });
    } else setForm(empty);
    setCaps(base);
    setErrors({});
  }, [open, connection, capDefs]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));
  const setCap = (k, patch) => setCaps((c) => ({ ...c, [k]: { ...c[k], ...patch } }));

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.baseUrl.trim()) e.baseUrl = "Base URL is required";
    else if (!/^https?:\/\//i.test(form.baseUrl.trim())) e.baseUrl = "Must start with https://";
    else if (/^https?:\/\/[^/]*@/i.test(form.baseUrl.trim())) e.baseUrl = "Do not put a user name or password in the URL";
    if (form.odataServicePath && !form.odataServicePath.startsWith("/")) e.odataServicePath = "Must start with /";
    if (form.sapClient && !/^\d{3}$/.test(form.sapClient)) e.sapClient = "SAP client is 3 digits";
    if (form.credentialRef && !/^[A-Za-z][A-Za-z0-9_]{1,39}$/.test(form.credentialRef)) e.credentialRef = "Letters, digits and _ only (2–40)";
    if (form.authType === "API_KEY" && form.authHeaderName && !/^[A-Za-z0-9-]{1,64}$/.test(form.authHeaderName)) e.authHeaderName = "Letters, digits and - only";
    const t = Number(form.timeoutMs);
    if (!Number.isInteger(t) || t < 1000 || t > 60000) e.timeoutMs = "1000–60000 ms";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(), erpType: form.erpType, provider: form.provider || null, environment: form.environment,
      baseUrl: form.baseUrl.trim(), odataServicePath: form.odataServicePath.trim() || null,
      authType: form.authType, authHeaderName: form.authType === "API_KEY" ? form.authHeaderName.trim() || null : null,
      credentialRef: form.credentialRef.trim() || null, timeoutMs: Number(form.timeoutMs), description: form.description.trim() || null,
      capabilities: Object.entries(caps).filter(([, v]) => v.enabled).map(([capability, v]) => ({
        capability, direction: v.direction, ownership: v.ownership || null, endpointPath: v.endpointPath.trim() || null,
        ...(isRest ? { config: capConfig(v) } : (v.idempotency || v.externalIdPath.trim()) ? { config: withOutbound(v.baseConfig ? { ...v.baseConfig } : {}, v) } : {}),
      })),
    };
    if (isOData) { payload.odataVersion = form.odataVersion; payload.sapClient = form.sapClient.trim() || null; payload.companyCode = form.companyCode.trim() || null; }
    try {
      if (isEdit) await erpApi.update(connection.id, payload); else await erpApi.create(payload);
      toast.success(isEdit ? "ERP connection updated" : "ERP connection created — run a connection test to verify it");
      onSaved?.();
      onClose();
    } catch (err) {
      if (err.details?.field && err.details.field in form) setErrors((x) => ({ ...x, [err.details.field]: err.message }));
      toast.error(errorText(err, "Unable to save the ERP connection"), { title: "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  const credStatus = isEdit ? connection.credentials?.status : null;
  return (
    <Modal open={open} onClose={saving ? undefined : onClose} size="lg" title={isEdit ? `Edit ${connection.name}` : "Add ERP connection"}
      description="A tenant can have several ERP connections of any type. Saving does not contact the ERP — use Test connection afterwards."
      footer={<><Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button onClick={save} loading={saving}>{isEdit ? "Save changes" : "Create connection"}</Button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input wrapperClassName="sm:col-span-2" label="Connection name" required value={form.name} onChange={set("name")} error={errors.name} placeholder="e.g. Production ERP" />
        <Select label="ERP type" required value={form.erpType} onChange={set("erpType")}
          options={(lookups?.erpTypes || []).map((t) => ({ value: t.value, label: t.supported ? t.label : `${t.label} (choose a provider)` }))} />
        <Select label="Connection provider" value={form.provider} onChange={set("provider")}
          hint={providerInfo ? `${providerInfo.label} · ${providerReady ? "available" : providerInfo.status === "FOUNDATION_ONLY" ? "foundation only — sync not available yet" : "planned"}` : "How the DMS talks to this ERP"}
          options={[{ value: "", label: erpType?.defaultProvider ? "Default for this ERP type" : "Not selected" }, ...providers.map((p) => ({ value: p.key, label: p.status === "IMPLEMENTED" ? p.label : `${p.label} (${p.status === "FOUNDATION_ONLY" ? "foundation only" : "planned"})` }))]} />
        <Select label="Environment" required value={form.environment} onChange={set("environment")} options={(lookups?.environments || []).map((v) => ({ value: v.value, label: v.label }))} />
        <Input label="Timeout (ms)" type="number" value={form.timeoutMs} onChange={set("timeoutMs")} error={errors.timeoutMs} />
        {providerInfo && !providerReady ? <div className="sm:col-span-2"><Alert tone="warning">The {providerInfo.label} provider is not implemented yet: the connection can be saved, but it cannot be tested or synchronised. If this ERP exposes a JSON REST API, choose “Generic REST”.</Alert></div> : null}
        <Input wrapperClassName="sm:col-span-2" label="Base URL" required value={form.baseUrl} onChange={set("baseUrl")} error={errors.baseUrl} placeholder="https://erp.company.com" hint="Host only. https is required in production." />
        <Input wrapperClassName="sm:col-span-2" label={isOData ? "OData service path" : "API base path"} value={form.odataServicePath} onChange={set("odataServicePath")} error={errors.odataServicePath}
          placeholder={isOData ? "/sap/opu/odata/sap/API_PRODUCT_SRV" : "/api/v1"} hint={isOData ? "The connection test reads <base URL><service path>/$metadata" : "Prepended to each capability endpoint"} />
        {isOData ? (
          <>
            <Select label="OData version" value={form.odataVersion} onChange={set("odataVersion")} options={(lookups?.odataVersions || []).map((v) => ({ value: v, label: v }))} />
            <Input label="SAP client" value={form.sapClient} onChange={set("sapClient")} error={errors.sapClient} placeholder="100" inputMode="numeric" maxLength={3} />
            <Input label="Company code" value={form.companyCode} onChange={set("companyCode")} placeholder="optional" maxLength={10} />
          </>
        ) : null}

        <div className="sm:col-span-2 rounded-card border border-line p-4">
          <p className="text-body font-semibold text-ink">Authentication & credentials</p>
          <p className="mb-3 text-caption text-ink-subtle">Secrets are never entered here or stored in the database. Enter the <em>reference name</em> of the secret configured on the server (environment variables such as <code>ERP_&lt;REFERENCE&gt;_USERNAME</code> / <code>_PASSWORD</code>, <code>_TOKEN</code> or <code>_API_KEY</code>, or your secret manager).</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Authentication" value={form.authType} onChange={set("authType")} options={authOptions.map((a) => ({ value: a, label: AUTH_LABEL[a] || a }))} />
            {form.authType === "API_KEY" ? <Input label="API key header" value={form.authHeaderName} onChange={set("authHeaderName")} error={errors.authHeaderName} placeholder="X-API-Key" /> : <span className="hidden sm:block" />}
            <Input label="Credential reference" value={form.credentialRef} onChange={set("credentialRef")} error={errors.credentialRef} placeholder="ERP_PROD" />
            <Input label="Secret" value={MASK} disabled readOnly aria-label="Secret (managed on the server, never shown)" hint={credStatus ? CRED_META[credStatus]?.label : "Managed on the server"} />
          </div>
        </div>

        <div className="sm:col-span-2">
          <p className="text-body font-semibold text-ink">Capabilities</p>
          <p className="mb-2 text-caption text-ink-subtle">What this ERP serves and where. Choose the direction AND who owns the data. Stock and Sales need an explicit owner before they can run; Invoice, Return and Document are not synchronised (see the reason in the sync dialog).</p>
          <div className="divide-y divide-line rounded-card border border-line">
            {capDefs.map((d) => {
              const v = caps[d.value] || emptyCap(d);
              const showRest = isRest && v.enabled && d.syncSupported;
              return (
                <div key={d.value} className="px-3 py-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex min-w-44 flex-1 items-center gap-2 text-body">
                      <input type="checkbox" className="size-4" checked={v.enabled} onChange={(e) => setCap(d.value, { enabled: e.target.checked })} />
                      {d.label}{d.syncSupported ? null : <span className="text-caption text-ink-subtle">(config only)</span>}
                    </label>
                    <Select size="sm" aria-label={`${d.label} direction`} disabled={!v.enabled} value={v.direction} onChange={(e) => setCap(d.value, { direction: e.target.value })}
                      options={(lookups?.directions || []).map((x) => ({ value: x.value, label: x.label }))} wrapperClassName="w-40" />
                  </div>
                  {v.enabled ? (
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Select size="sm" label={d.ownershipRequired ? "Data owner (required)" : "Data owner"} value={v.ownership} onChange={(e) => setCap(d.value, { ownership: e.target.value })}
                        options={[{ value: "", label: d.ownershipRequired ? "Not decided — blocks sync" : "Implied by direction" }, ...(lookups?.ownerships || []).map((x) => ({ value: x.value, label: x.label }))]} />
                      {v.direction !== "ERP_TO_DMS" && v.direction !== "DISABLED" && lookups?.outboundCapabilities?.includes(d.value) ? (
                        <label className="flex items-center gap-2 text-body sm:pt-6"><input type="checkbox" className="size-4" checked={v.idempotency} onChange={(e) => setCap(d.value, { idempotency: e.target.checked })} />ERP honours idempotency keys (required to send)</label>
                      ) : null}
                      <Input size="sm" label="Endpoint path" value={v.endpointPath} onChange={(e) => setCap(d.value, { endpointPath: e.target.value })} placeholder={isOData ? "A_Product" : "/products"} wrapperClassName="sm:col-span-2" />
                      {showRest ? (
                        <>
                          <Input size="sm" label="Records field in the response" value={v.responsePath} onChange={(e) => setCap(d.value, { responsePath: e.target.value })} placeholder="data.items (blank = whole body)" />
                          <Select size="sm" label="Pagination" value={v.pagination} onChange={(e) => setCap(d.value, { pagination: e.target.value })} options={(providerInfo?.pagination || []).map((p) => ({ value: p, label: PAGINATION_LABEL[p] || p }))} />
                          {PAG_FIELDS[v.pagination]?.map((k) => <Input key={k} size="sm" label={PAG_LABEL[k]} value={v[k]} onChange={(e) => setCap(d.value, { [k]: e.target.value })} inputMode={k === "pageSize" ? "numeric" : undefined} />)}
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <Textarea wrapperClassName="sm:col-span-2" label="Description" value={form.description} onChange={set("description")} maxLength={500} />
        {isEdit ? <div className="sm:col-span-2"><Alert tone="info">Changing the URL, path, provider, authentication or credential reference clears the last test result — test the connection again.</Alert></div> : null}
      </div>
    </Modal>
  );
}
