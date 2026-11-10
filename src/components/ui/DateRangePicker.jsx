import { useEffect, useId, useRef, useState } from "react";
import { CalendarRange, ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";
import { DEFAULT_RANGE_PRESETS, formatRange } from "../../utils/dateRanges";
import Button from "./Button";
import DatePicker from "./DatePicker";
import Popover from "./Popover";

/**
 * DateRangePicker — preset list + custom from/to dates in a popover.
 * value: { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', presetId? }   onChange(nextValue)
 */
export default function DateRangePicker({ value, onChange, presets = DEFAULT_RANGE_PRESETS, label = "Date range", placeholder = "Select dates", className, align = "end", compact = false }) {
  const anchorRef = useRef(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ from: "", to: "" });

  useEffect(() => {
    if (open) setDraft({ from: value?.from || "", to: value?.to || "" });
  }, [open, value]);

  const activePreset = presets.find((p) => p.id === value?.presetId);
  const text = activePreset ? activePreset.label : formatRange(value) || placeholder;
  const invalid = draft.from && draft.to && draft.from > draft.to;

  const apply = (next) => {
    onChange?.(next);
    setOpen(false);
  };

  return (
    <div ref={anchorRef} className={cn("inline-block", className)}>
      <button
        type="button"
        aria-label={`${label}: ${text}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-2 rounded-control border border-line-strong bg-surface px-3 text-body text-ink transition-colors duration-150 hover:border-ink-subtle"
      >
        <CalendarRange className="size-4 text-ink-subtle" aria-hidden="true" />
        <span className={cn("truncate", compact ? "max-w-28" : "max-w-44")}>{text}</span>
        <ChevronDown className="size-4 text-ink-subtle" aria-hidden="true" />
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} placement={align === "end" ? "bottom-end" : "bottom-start"} role="dialog" id={panelId} ariaLabel={label} className="w-[min(22rem,calc(100vw-1rem))]">
        <div className="p-2">
          <ul className="grid grid-cols-2 gap-1">
            {presets.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => apply({ ...p.range(), presetId: p.id })}
                  aria-pressed={value?.presetId === p.id}
                  className={cn(
                    "w-full rounded-md px-2.5 py-1.5 text-left text-body transition-colors duration-150",
                    value?.presetId === p.id ? "bg-brand-50 font-medium text-brand-700" : "text-ink-muted hover:bg-neutral-100 hover:text-ink",
                  )}
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-line p-3">
          <p className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-subtle">Custom range</p>
          <div className="grid grid-cols-2 gap-2">
            <DatePicker label="From" value={draft.from} max={draft.to || undefined} onChange={(v) => setDraft((d) => ({ ...d, from: v }))} />
            <DatePicker label="To" value={draft.to} min={draft.from || undefined} onChange={(v) => setDraft((d) => ({ ...d, to: v }))} />
          </div>
          {invalid ? <p className="mt-2 text-caption text-error-700">The start date must be on or before the end date.</p> : null}
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => apply({ from: "", to: "" })}>
              Clear
            </Button>
            <Button size="sm" disabled={!draft.from || !draft.to || invalid} onClick={() => apply({ from: draft.from, to: draft.to })}>
              Apply
            </Button>
          </div>
        </div>
      </Popover>
    </div>
  );
}
