import Select from "../../../components/ui/Select";
import { PAYMENT_MODES } from "../erpDisplay";

// The scope is what the ADMIN decides for a sync or a schedule (which distributor, tax record, customer group …). The server validates it
// against the capability's target; nothing here is guessed or defaulted. Fields come from the target description (lookups.syncTargets).
export default function ErpScopeFields({ target, value, onChange, masters, disabled }) {
  const fields = target?.scopeFields || [];
  if (!fields.length) return <p className="text-caption text-ink-subtle">This capability needs no extra choices.</p>;
  const set = (patch) => onChange({ ...value, ...patch });
  const dist = value.distributorId;
  return (
    <div className="space-y-4">
      {fields.map((f) => {
        if (f.name === "distributorId") return (
          <Select key={f.name} label={f.label} required={f.required} disabled={disabled} value={value.distributorId}
            onChange={(e) => set({ distributorId: e.target.value, hsnId: "", customerGroupId: "" })}
            options={[{ value: "", label: "Choose…" }, ...(masters?.distributors || []).map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }))]} />
        );
        if (f.name === "hsnId") return (
          <Select key={f.name} label={f.label} required={f.required} disabled={disabled || !dist} value={value.hsnId} onChange={(e) => set({ hsnId: e.target.value })}
            options={[{ value: "", label: dist ? "Choose…" : "Choose a distributor first" }, ...(masters?.hsnOptions || []).filter((h) => String(h.distributorId) === dist).map((h) => ({ value: String(h.id), label: `${h.hsnCode} — ${h.description || ""} (${h.gstRate}%)` }))]} />
        );
        if (f.name === "customerGroupId") return (
          <Select key={f.name} label={f.label} required={f.required} disabled={disabled || !dist} value={value.customerGroupId} onChange={(e) => set({ customerGroupId: e.target.value })}
            options={[{ value: "", label: dist ? "Choose…" : "Choose a distributor first" }, ...(masters?.customerGroups || []).filter((g) => String(g.distributorId) === dist).map((g) => ({ value: String(g.id), label: `${g.name} (${g.code})` }))]} />
        );
        if (f.name === "defaultMode") return (
          <Select key={f.name} label={f.label} disabled={disabled} value={value.defaultMode} onChange={(e) => set({ defaultMode: e.target.value })}
            hint="Leave empty to require the mode in the ERP data; the DMS never guesses it."
            options={[{ value: "", label: "None — take it from the ERP record" }, ...PAYMENT_MODES.map((m) => ({ value: m, label: m.replace(/_/g, " ") }))]} />
        );
        return null;
      })}
    </div>
  );
}
