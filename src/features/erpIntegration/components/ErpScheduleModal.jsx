import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import Alert from "../../../components/ui/Alert";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import LoadingState from "../../../components/ui/LoadingState";
import { useToast } from "../../../components/feedback";
import { formatDateTime } from "../../../utils/format";
import { mastersApi } from "../../adminMasters/api/mastersApi";
import { erpApi, erpSyncApi } from "../api/erpApi";
import { SCHEDULE_STATUS_LABEL, errorText, syncableCaps } from "../erpDisplay";
import ErpScopeFields from "./ErpScopeFields";
import { emptyScope, fromScope, scopeError, toScope } from "../scopeUtils";

const tone = (s) => ({ SUCCESS: "success", PARTIAL: "warning", FAILED: "error", SKIPPED: "warning", QUEUED: "info", RUNNING: "info" }[s] || "neutral");

/** Recurring schedule for one connection + capability. The scheduler only CREATES jobs; the same sync engine runs them. */
export default function ErpScheduleModal({ open, onClose, connection, onChanged }) {
  const toast = useToast();
  const caps = syncableCaps(connection);
  const [capability, setCapability] = useState("");
  const [lookups, setLookups] = useState(null);
  const [masters, setMasters] = useState(null);
  const [schedules, setSchedules] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState("HOURLY");
  const [scope, setScope] = useState(emptyScope());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const load = () => erpSyncApi.schedules({ connectionId: connection.id }).then((r) => setSchedules(r.items)).catch(() => setSchedules([]));
  useEffect(() => {
    if (!open || !connection) return;
    setCapability(syncableCaps(connection)[0]?.capability || ""); setErr(""); setSchedules(null);
    erpApi.lookups().then(setLookups).catch(() => setLookups({ syncTargets: [], scheduleFrequencies: [] }));
    mastersApi.lookups(null).then(setMasters).catch(() => setMasters({ distributors: [], hsnOptions: [], customerGroups: [] }));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, connection]);

  const current = (schedules || []).find((s) => s.capability === capability) || null;
  useEffect(() => { // show what is stored for the chosen capability
    setEnabled(Boolean(current?.enabled)); setFrequency(current?.frequency || "HOURLY"); setScope(fromScope(current?.scope));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capability, schedules]);

  const target = (lookups?.syncTargets || []).find((t) => t.capability === capability);
  async function save() {
    setErr("");
    if (enabled) { const e = scopeError(target, scope); if (e) { setErr(e); return; } }
    setBusy(true);
    try {
      await erpApi.saveSchedule(connection.id, capability, { enabled, frequency, scope: toScope(target, scope) });
      toast.success(enabled ? "Schedule saved" : "Schedule disabled"); await load(); onChanged?.();
    } catch (x) { setErr(errorText(x, "Unable to save the schedule")); }
    finally { setBusy(false); }
  }
  async function runNow() {
    setErr(""); setBusy(true);
    try { await erpSyncApi.runSchedule(current.id); toast.success("Run queued — follow it in ERP Sync History"); await load(); onChanged?.(); }
    catch (x) { setErr(errorText(x, "Unable to queue the run")); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={busy ? undefined : onClose} size="lg" title={`Schedule — ${connection?.name || "ERP"}`}
      description="Run a synchronisation automatically. The shortest interval is 15 minutes; a run never starts while the previous one is still active."
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Close</Button><Button onClick={save} loading={busy} disabled={!caps.length || !capability}>Save schedule</Button></>}>
      {schedules === null || !lookups ? <LoadingState label="Loading schedule…" /> : (
        <div className="space-y-4">
          {caps.length === 0 ? <Alert tone="warning">Nothing on this connection can be scheduled yet: enable a supported capability (ERP → DMS) with an endpoint and a saved mapping.</Alert> : null}
          <Select label="What to synchronise" value={capability} onChange={(e) => setCapability(e.target.value)} options={caps.map((c) => ({ value: c.capability, label: c.label }))} />
          <label className="flex items-center gap-2 text-body text-ink">
            <input type="checkbox" className="size-4" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Run this synchronisation automatically
          </label>
          <Select label="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} disabled={!enabled}
            options={(lookups.scheduleFrequencies || []).map((f) => ({ value: f.value, label: f.label }))} />
          {enabled ? <ErpScopeFields target={target} value={scope} onChange={setScope} masters={masters} /> : null}

          {current ? (
            <dl className="grid grid-cols-3 gap-2 rounded-card border border-line p-3 text-body">
              <dt className="text-ink-subtle">Status</dt><dd className="col-span-2">{current.enabled ? <Badge tone="success" size="sm" dot>Enabled</Badge> : <Badge size="sm">Disabled</Badge>}</dd>
              <dt className="text-ink-subtle">Next run</dt><dd className="col-span-2">{current.nextRunAt ? `${formatDateTime(current.nextRunAt)}${current.nextRetryAt ? " (automatic retry)" : ""}` : "—"}</dd>
              <dt className="text-ink-subtle">Last run</dt><dd className="col-span-2">{current.lastRunAt ? formatDateTime(current.lastRunAt) : "Never"}{current.lastStatus ? <> · <Badge tone={tone(current.lastStatus)} size="sm">{SCHEDULE_STATUS_LABEL[current.lastStatus] || current.lastStatus}</Badge></> : null}</dd>
              {current.lastError ? <><dt className="text-ink-subtle">Last error</dt><dd className="col-span-2 text-error-700">{current.lastError.code}: {current.lastError.message} {current.lastError.retryable ? "(retryable)" : "(not retryable)"}</dd></> : null}
              <dt className="text-ink-subtle">Automatic retries</dt><dd className="col-span-2">{current.retryCount} of {current.maxAutoRetries} used{current.lastRetryAt ? ` · last ${formatDateTime(current.lastRetryAt)}` : ""}</dd>
              {current.enabled ? <dd className="col-span-3"><Button size="sm" variant="secondary" leftIcon={Play} loading={busy} onClick={runNow}>Run now</Button></dd> : null}
            </dl>
          ) : null}
          {err ? <Alert tone="error">{err}</Alert> : null}
        </div>
      )}
    </Modal>
  );
}
