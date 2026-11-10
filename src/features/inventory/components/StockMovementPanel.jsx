import { useState } from "react";
import Select from "../../../components/ui/Select";
import { SkeletonText } from "../../../components/ui/Skeleton";
import ErrorState from "../../../components/ui/ErrorState";
import { formatNumber } from "../../../utils/format";
import { toISODate } from "../../../utils/dateRanges";
import { useAsyncData } from "../hooks/useAsyncData";
import { inventoryErrorMessage } from "../api/inventoryErrors";

const PERIODS = [
  { value: "all", label: "All time" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];
function periodRange(v) {
  if (v === "all") return {};
  const to = new Date();
  const from = new Date(to.getFullYear(), to.getMonth(), to.getDate() - Number(v));
  return { from: toISODate(from), to: toISODate(to) };
}

/**
 * Stock movement for one product or batch: Opening → Stock in → Stock out → Returns → Adjustments → Closing.
 * Derived on the server from the stock ledger (opening + movements = closing) — nothing is stored as a counter here.
 * `scope` = { productId } | { batchId } (+ optional warehouseId).
 */
export default function StockMovementPanel({ api, scope }) {
  const [period, setPeriod] = useState("all");
  const params = { ...scope, ...periodRange(period) };
  const q = useAsyncData((signal) => api.movement(params, signal), [api, JSON.stringify(params)]);
  const m = q.data;
  const sign = (n) => (n > 0 ? `+${formatNumber(n)}` : n < 0 ? `−${formatNumber(Math.abs(n))}` : "0");

  const rows = m
    ? [
        { label: "Stock in", hint: "Purchases and opening stock", value: `+${formatNumber(m.stockIn)}` },
        { label: "Stock out", hint: "Sales", value: m.stockOut ? `−${formatNumber(m.stockOut)}` : "0" },
        { label: "Returns", hint: `Sales returns ${formatNumber(m.returnsIn)} · purchase returns ${formatNumber(m.returnsOut)}`, value: sign(m.returns) },
        { label: "Adjustments", hint: "Damage, breakage, corrections, counts", value: sign(m.adjustments) },
        ...(m.transfers !== 0 ? [{ label: "Transfers", hint: "Net of warehouse transfers", value: sign(m.transfers) }] : []),
        ...(m.other !== 0 ? [{ label: "Other", hint: "Anything else on the ledger", value: sign(m.other) }] : []),
      ]
    : [];

  return (
    <div>
      <Select label="Period" size="sm" value={period} onChange={(e) => setPeriod(e.target.value)} options={PERIODS} wrapperClassName="mb-3 w-48" />
      {q.status === "error" ? (
        <ErrorState compact title="Unable to load stock movement" message={inventoryErrorMessage(q.error, "Unable to load stock movement. Please try again.")} onRetry={q.reload} />
      ) : !m ? (
        <SkeletonText lines={6} />
      ) : (
        <dl className="divide-y divide-line rounded-card border border-line">
          <MovementRow label="Opening" hint={period === "all" ? "Start of the ledger" : "Balance at start of period"} value={formatNumber(m.opening)} strong />
          {rows.map((r) => (
            <MovementRow key={r.label} {...r} />
          ))}
          <MovementRow label="Closing" hint="Opening plus all movements" value={formatNumber(m.closing)} strong />
        </dl>
      )}
    </div>
  );
}

function MovementRow({ label, hint, value, strong }) {
  return (
    <div className={`flex items-center justify-between gap-4 px-3 py-2 ${strong ? "bg-surface-muted" : ""}`}>
      <div className="min-w-0">
        <dt className={`text-body ${strong ? "font-semibold" : "font-medium"} text-ink`}>{label}</dt>
        {hint ? <dd className="text-caption text-ink-subtle">{hint}</dd> : null}
      </div>
      <dd className={`shrink-0 tabular-nums text-body ${strong ? "font-semibold" : ""} text-ink`}>{value}</dd>
    </div>
  );
}
