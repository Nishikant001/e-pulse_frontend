import { useState } from "react";
import Modal from "../../../components/ui/Modal";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useToast } from "../../../components/feedback";
import { useAsyncData } from "../../inventory/hooks/useAsyncData";
import { erpApi } from "../api/erpApi";
import { PAYMENT_MODES, errorText } from "../erpDisplay";

/** ERP code → DMS value lookups (customer group, HSN, plant → warehouse, batch, payment mode). An unmapped code is never guessed by a sync. */
export default function ErpCodeMappingModal({ open, connection, lookups, onClose, readOnly = false }) {
  const toast = useToast();
  const [type, setType] = useState("CUSTOMER_GROUP");
  const [form, setForm] = useState({ externalCode: "", distributorId: "", dmsId: "", dmsValue: "CASH" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const types = lookups?.codeMappingTypes || [];
  const def = types.find((t) => t.type === type);
  const list = useAsyncData((s) => (open && connection ? erpApi.codeMappings(connection.id, { type }, s) : Promise.resolve({ items: [] })), [open, connection?.id, type]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setError(""); setBusy(true);
    try {
      await erpApi.saveCodeMapping(connection.id, { type, externalCode: form.externalCode.trim(), ...(def?.scoped ? { distributorId: Number(form.distributorId), dmsId: Number(form.dmsId) } : { dmsValue: form.dmsValue }) });
      toast.success("Code mapping saved"); setForm((f) => ({ ...f, externalCode: "", dmsId: "" })); list.reload();
    } catch (e) { setError(errorText(e, "Unable to save the mapping.")); } finally { setBusy(false); }
  }
  async function remove(id) {
    try { await erpApi.deleteCodeMapping(connection.id, id); toast.success("Mapping removed"); list.reload(); } catch (e) { setError(errorText(e, "Unable to remove the mapping.")); }
  }
  return (
    <Modal open={open} onClose={onClose} title={`Code mappings — ${connection?.name || ""}`} size="lg">
      <p className="mb-3 text-caption text-ink-subtle">Tell the DMS what an ERP code means. A record whose code has no mapping fails with “business decision required” instead of being guessed.</p>
      {error ? <Alert tone="error" className="mb-3">{error}</Alert> : null}
      {readOnly ? <Alert tone="info" className="mb-3">You can view code mappings but not change them.</Alert> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select label="Type" value={type} onChange={(e) => { setType(e.target.value); setError(""); }} options={types.map((t) => ({ value: t.type, label: t.label }))} />
        {readOnly ? null : <Input label="ERP code" value={form.externalCode} onChange={set("externalCode")} placeholder={type === "BATCH" ? "ERP product id|batch no" : ""} />}
        {readOnly ? null : def?.scoped ? (<>
          <Input label="Distributor ID" inputMode="numeric" value={form.distributorId} onChange={set("distributorId")} />
          <Input label={`DMS ${def.dmsLabel} ID`} inputMode="numeric" value={form.dmsId} onChange={set("dmsId")} />
        </>) : <Select label="DMS payment mode" value={form.dmsValue} onChange={set("dmsValue")} options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))} />}
      </div>
      {readOnly ? null : <div className="mt-3 flex justify-end"><Button onClick={save} loading={busy} disabled={!form.externalCode.trim()}>Save mapping</Button></div>}
      <ul className="mt-4 divide-y divide-line rounded-card border border-line" aria-label="Existing mappings">
        {(list.data?.items || []).length === 0 ? <li className="px-3 py-2 text-body text-ink-subtle">No mappings of this type yet.</li> : null}
        {(list.data?.items || []).map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2 text-body">
            <span><span className="font-mono">{m.externalCode}</span> → {m.dmsValue || `#${m.dmsId}`}{m.distributorId ? ` · distributor ${m.distributorId}` : ""}</span>
            {readOnly ? null : <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>Remove</Button>}
          </li>
        ))}
      </ul>
    </Modal>
  );
}
