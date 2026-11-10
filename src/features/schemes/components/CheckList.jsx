import { useMemo, useState } from "react";

/** Small searchable multi-select (checkbox list). Values are ids; labels come from the lookup — no master data is copied. */
export default function CheckList({ label, options, value, onChange, error, hint, empty = "Nothing to select." }) {
  const [q, setQ] = useState("");
  const chosen = useMemo(() => new Set(value), [value]);
  const shown = useMemo(() => options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())), [options, q]);
  const toggle = (id) => onChange(chosen.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-1 text-caption font-medium text-ink">{label} <span className="font-normal text-ink-subtle">({value.length} selected)</span></legend>
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label={`Search ${label}`} className="mb-2 h-9 w-full rounded-control border border-line px-3 text-body" />
      <div className={`max-h-48 overflow-y-auto rounded-control border p-2 ${error ? "border-red-400" : "border-line"}`}>
        {shown.length === 0 ? <p className="p-2 text-body text-ink-muted">{empty}</p> : shown.map((o) => (
          <label key={o.id} className="flex items-center gap-2 px-1 py-1 text-body text-ink">
            <input type="checkbox" className="h-4 w-4 rounded border-line" checked={chosen.has(o.id)} onChange={() => toggle(o.id)} />
            <span className="min-w-0 break-words">{o.label}</span>
          </label>
        ))}
      </div>
      {error ? <p role="alert" className="mt-1 text-caption text-red-600">{error}</p> : hint ? <p className="mt-1 text-caption text-ink-subtle">{hint}</p> : null}
    </fieldset>
  );
}
