import { cn } from "../../../utils/cn";

/**
 * DetailTable — compact read-only table for document lines. Scrolls horizontally inside its own container
 * (never the page). columns: [{ key, header, align?, render?(row), className? }]
 */
export default function DetailTable({ columns, rows, caption, rowKey = "id", className }) {
  return (
    <div className={cn("dms-scroll overflow-x-auto rounded-card border border-line", className)}>
      <table className="w-full min-w-max border-collapse text-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("whitespace-nowrap border-b border-line bg-surface-muted px-3 py-2 text-caption font-semibold uppercase tracking-wide text-ink-subtle", c.align === "right" ? "text-right" : "text-left")}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row[rowKey] ?? i} className="border-b border-line last:border-0">
              {columns.map((c) => (
                <td key={c.key} className={cn("px-3 py-2 align-top text-ink", c.align === "right" && "text-right tabular-nums", c.className)}>
                  {c.render ? c.render(row) : row[c.key] ?? <span className="text-ink-subtle">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
