import { useEffect, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import { useToast } from "../../../components/feedback";
import { mastersApi } from "../../adminMasters/api/mastersApi";
import { erpApi, erpSyncApi } from "../api/erpApi";
import { errorText, syncableCaps } from "../erpDisplay";
import ErpScopeFields from "./ErpScopeFields";
import { emptyScope, scopeError, toScope } from "../scopeUtils";

/** Start a manual sync for one connection + capability. What the scope asks for depends on the capability's DMS target (lookups.syncTargets). */
export default function ErpStartSyncModal({ open, onClose, connection, onStarted }) {
  const toast = useToast();
  const caps = syncableCaps(connection);
  const [capability, setCapability] = useState("");
  const [masters, setMasters] = useState(null);
  const [targets, setTargets] = useState([]);
  const [scope, setScope] = useState(emptyScope());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setCapability(syncableCaps(connection)[0]?.capability || ""); setScope(emptyScope()); setErr("");
    mastersApi.lookups(null).then(setMasters).catch(() => setMasters({ distributors: [], hsnOptions: [], customerGroups: [] }));
    erpApi.lookups().then((l) => setTargets(l.syncTargets || [])).catch(() => setTargets([]));
  }, [open, connection]);

  const target = targets.find((t) => t.capability === capability);
  async function go() {
    setErr("");
    if (!capability) { setErr("Choose what to synchronise."); return; }
    const e = scopeError(target, scope); if (e) { setErr(e); return; }
    setBusy(true);
    try {
      const job = await erpSyncApi.start({ connectionId: connection.id, capability, scope: toScope(target, scope) });
      toast.success("Sync started — follow it in ERP Sync History");
      onStarted?.(job); onClose();
    } catch (x) { setErr(errorText(x, "Unable to start the sync")); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title={`Sync from ${connection?.name || "ERP"}`}
      description="Reads records from the ERP and creates or updates them in the DMS. Unchanged records are skipped."
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={go} loading={busy} disabled={!caps.length}>Start sync</Button></>}>
      <div className="space-y-4">
        {caps.length === 0 ? <Alert tone="warning">No capability on this connection can be synchronised. Enable a supported capability (direction ERP → DMS) with an endpoint, and save its field mapping first.</Alert> : null}
        <Select label="What to synchronise" value={capability} onChange={(e) => { setCapability(e.target.value); setScope(emptyScope()); }} options={caps.map((c) => ({ value: c.capability, label: c.label }))} />
        <ErpScopeFields target={target} value={scope} onChange={setScope} masters={masters} />
        {target?.ownership ? <Alert tone="info" title="Who owns the data">{target.ownership.rule}</Alert> : null}
        {err ? <Alert tone="error">{err}</Alert> : null}
      </div>
    </Modal>
  );
}
