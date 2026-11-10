// Recharts tooltip in the design-system style:  <Tooltip content={<ChartTooltip valueFormatter={formatINRCompact} />} />
export default function ChartTooltip({ active, payload, label, valueFormatter = (v) => v }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2 shadow-popover">
      {label !== undefined ? <p className="mb-1 text-caption font-medium text-ink-muted">{label}</p> : null}
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={p.dataKey || p.name} className="flex items-center gap-2 text-table text-ink">
            <span className="size-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} aria-hidden="true" />
            <span className="text-ink-muted">{p.name}</span>
            <span className="ml-auto pl-3 font-medium tabular-nums">{valueFormatter(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
