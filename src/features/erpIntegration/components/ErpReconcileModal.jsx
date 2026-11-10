import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Alert from "../../../components/ui/Alert";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import { mastersApi } from "../../adminMasters/api/mastersApi";
import { erpApi, erpBusinessApi } from "../api/erpApi";
import { errorText } from "../erpDisplay";
import { RECON_META, RECONCILABLE } from "../erpBusinessDisplay";
import ErpScopeFields from "./ErpScopeFields";
import { emptyScope, scopeError, toScope } from "../scopeUtils";

/** Compare ERP data with the DMS for one connection + capability. READ-ONLY: it reports differences, it never changes a record. */
export default function ErpReconcileModal({ open, onClose, connection, capability: initial }) {
  const caps = (connection?.capabilities || []).filter((c) => c.enabled && RECONCILABLE.includes(c.capability));
  const [capability, setCapability] = useState("");
  const [masters, setMasters] = useState(null);
  const [targets, setTargets] = useState([]);
  const [scope, setScope] = useState(emptyScope());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setCapability(initial || caps[0]?.capability || ""); setScope(emptyScope()); setErr(""); setResult(null);
    mastersApi.lookups(null).then(setMasters).catch(() => setMasters({ distributors: [], hsnOptions: [], customerGroups: [] }));
    erpApi.lookups().then((l) => setTargets(l.syncTargets || [])).catch(() => setTargets([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, connection, initial]);

  const target = targets.find((t) => t.capability === capability);
  async function go() {
    setErr(""); setResult(null);
    if (!capability) { setErr("Choose what to compare."); return; }
    const e = scopeError(target, scope); if (e) { setErr(e); return; }
    setBusy(true);
    try { setResult(await erpBusinessApi.reconcile({ connectionId: connection.id, capability, scope: toScope(target, scope) })); }
    catch (x) { setErr(errorText(x, "Unable to compare")); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title={`Compare with ${connection?.name || "ERP"}`}
      description="Reads the ERP and compares it with the DMS. Nothing is created, changed or posted — differences are only reported."
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Close</Button><Button onClick={go} loading={busy} disabled={!caps.length}>Compare</Button></>}>
      <div className="space-y-4">
        {!caps.length ? <Alert tone="warning">No enabled capability on this connection can be compared yet.</Alert> : null}
        <Select label="What to compare" value={capability} onChange={(e) => { setCapability(e.target.value); setScope(emptyScope()); setResult(null); }} options={caps.map((c) => ({ value: c.capability, label: c.label }))} />
        <ErpScopeFields target={target} value={scope} onChange={setScope} masters={masters} />
        {err ? <Alert tone="error">{err}</Alert> : null}
        {result ? (
          <div className="space-y-3">
            {!result.ownership.allowsImport ? <Alert tone="warning" title="Differences are blocked">{result.ownership.message}</Alert> : null}
            {result.error ? <Alert tone="error">{result.error.message}</Alert> : null}
            {!result.complete ? <Alert tone="info">{result.truncated ? "Only part of the ERP data was read, so records missing in the ERP are not reported." : "The comparison did not finish, so records missing in the ERP are not reported."}</Alert> : null}
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">{result.counts.total} compared</Badge>
              {Object.entries(RECON_META).map(([k, m]) => (result.counts[k] ? <Badge key={k} tone={m.tone}>{m.label}: {result.counts[k]}</Badge> : null))}
            </div>
            {result.items.length ? (
              <ul className="max-h-64 space-y-1.5 overflow-auto text-body">
                {result.items.map((i, n) => (
                  <li key={`${i.externalId}-${n}`} className="flex items-start gap-2">
                    <Badge tone={(RECON_META[i.status] || {}).tone || "neutral"} size="sm" className="mt-0.5 shrink-0">{(RECON_META[i.status] || {}).label || i.status}</Badge>
                    <span className="min-w-0 text-ink-muted"><span className="font-medium text-ink">{i.externalId || "(no id)"}</span> — {i.detail}</span>
                  </li>
                ))}
              </ul>
            ) : result.counts.total ? <p className="text-body text-ink-muted">Everything compared matches.</p> : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
