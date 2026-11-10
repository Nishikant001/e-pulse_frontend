import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Modal from "../../../components/ui/Modal";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import LoadingState from "../../../components/ui/LoadingState";
import { useToast } from "../../../components/feedback";
import { erpApi } from "../api/erpApi";
import { errorText, syncableCaps } from "../erpDisplay";

const TRANSFORMS = ["trim", "uppercase", "lowercase", "strip_leading_zeros", "to_number", "to_date", "to_boolean"];
const KEY = "external_id";
const blank = () => ({ sourceField: "", dmsField: "", transform: "" });

/** Field mapping for one connection + capability. Nothing is pre-filled: the ERP's field names are the admin's to enter. */
export default function ErpMappingModal({ open, onClose, connection, capability: initialCapability }) {
  const toast = useToast();
  const caps = syncableCaps(connection);
  const [capability, setCapability] = useState(initialCapability || "");
  useEffect(() => { if (open) setCapability(initialCapability || syncableCaps(connection)[0]?.capability || ""); }, [open, connection, initialCapability]);
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [rows, setRows] = useState([]);
  const [keyField, setKeyField] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open || !connection || !capability) return undefined;
    const ctl = new AbortController();
    setState({ status: "loading", data: null, error: null }); setErr("");
    erpApi.getMappings(connection.id, capability, ctl.signal).then((d) => {
      setState({ status: "ready", data: d, error: null });
      const k = d.mappings.find((m) => m.isKey);
      setKeyField(k ? k.sourceField : "");
      const rest = d.mappings.filter((m) => !m.isKey).map((m) => ({ sourceField: m.sourceField, dmsField: m.dmsField, transform: (m.transform || []).join(",") }));
      setRows(rest.length ? rest : [blank()]);
    }).catch((e) => { if (e?.name !== "AbortError") setState({ status: "error", data: null, error: e }); });
    return () => ctl.abort();
  }, [open, connection, capability]);

  const target = state.data?.target;
  const setRow = (i, patch) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  async function save() {
    setErr("");
    if (!keyField.trim()) { setErr("Enter the ERP field that uniquely identifies a record."); return; }
    const used = rows.filter((r) => r.sourceField.trim() || r.dmsField);
    if (used.some((r) => !r.sourceField.trim() || !r.dmsField)) { setErr("Every mapping row needs both an ERP field and a DMS field."); return; }
    if (new Set(used.map((r) => r.dmsField)).size !== used.length) { setErr("A DMS field can be mapped only once."); return; }
    const mappings = [{ sourceField: keyField.trim(), dmsField: KEY, isKey: true, transform: [] },
      ...used.map((r) => ({ sourceField: r.sourceField.trim(), dmsField: r.dmsField, isKey: false, transform: r.transform ? r.transform.split(",").filter(Boolean) : [] }))];
    setSaving(true);
    try { await erpApi.saveMappings(connection.id, capability, mappings); toast.success("Mapping saved"); onClose(); }
    catch (e) { setErr(errorText(e, "Unable to save the mapping")); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={saving ? undefined : onClose} size="lg" title={`Field mapping — ${connection?.name || ""}`}
      description={target ? `${target.label}: which ERP field fills which DMS field.` : "Map ERP fields to DMS fields."}
      footer={<><Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button><Button onClick={save} loading={saving} disabled={state.status !== "ready" || !target}>Save mapping</Button></>}>
      {state.status === "loading" ? <LoadingState label="Loading mapping…" /> : null}
      {state.status === "error" ? <Alert tone="error">{errorText(state.error, "Unable to load the mapping.")}</Alert> : null}
      {state.status === "ready" && !target ? <Alert tone="info">This capability has no DMS target, so it cannot be mapped or synchronised.</Alert> : null}
      {state.status === "ready" && target ? (
        <div className="space-y-4">
          {caps.length > 1 ? <Select label="Capability" value={capability} onChange={(e) => setCapability(e.target.value)} options={caps.map((c) => ({ value: c.capability, label: c.label }))} /> : null}
          <Alert tone="info">Field names are exactly as the ERP returns them (nested fields like <code>Header.Code</code> are allowed). Only the fields offered in the list can be written; DMS-managed fields cannot be mapped.</Alert>
          {target.ownership ? (
            <div className="rounded-card border border-line p-3 text-caption text-ink-muted">
              <p><strong className="text-ink">ERP-owned (overwritten by a sync):</strong> {target.ownership.erpOwned.join(", ")}</p>
              <p className="mt-1"><strong className="text-ink">DMS-owned (never written):</strong> {target.ownership.dmsOwned.join(", ")}</p>
              <p className="mt-1">{target.ownership.rule}</p>
            </div>
          ) : null}
          <Input label="ERP field that identifies the record (external id)" required value={keyField} onChange={(e) => setKeyField(e.target.value)} placeholder="e.g. the ERP's item number" />
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_1fr_11rem_auto]">
                <Input label={i === 0 ? "ERP field" : undefined} aria-label="ERP field" value={r.sourceField} onChange={(e) => setRow(i, { sourceField: e.target.value })} />
                <Select aria-label="DMS field" label={i === 0 ? "DMS field" : undefined} value={r.dmsField} onChange={(e) => setRow(i, { dmsField: e.target.value })}
                  options={[{ value: "", label: "Choose…" }, ...target.fields.map((f) => ({ value: f.name, label: f.required ? `${f.label} *` : f.label }))]} />
                <Select aria-label="Transform" label={i === 0 ? "Transform" : undefined} value={r.transform} onChange={(e) => setRow(i, { transform: e.target.value })}
                  options={[{ value: "", label: "None" }, ...TRANSFORMS.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))]} />
                <Button variant="ghost" size="sm" aria-label="Remove row" leftIcon={Trash2} onClick={() => setRows((x) => (x.length > 1 ? x.filter((_, j) => j !== i) : [blank()]))} />
              </div>
            ))}
          </div>
          <Button size="sm" variant="secondary" leftIcon={Plus} onClick={() => setRows((r) => [...r, blank()])}>Add field</Button>
          {err ? <Alert tone="error">{err}</Alert> : null}
        </div>
      ) : null}
    </Modal>
  );
}
