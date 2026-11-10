import { Link } from "react-router-dom";
import ErrorState from "../../../components/ui/ErrorState";
import { SkeletonTable } from "../../../components/ui/Skeleton";
import { formatDateTime, formatNumber } from "../../../utils/format";
import { useAsyncData } from "../hooks/useAsyncData";
import { inventoryErrorMessage } from "../api/inventoryErrors";

/** The latest stock-ledger entries for a batch / product (real ledger rows — nothing fabricated), with a link to the full ledger. */
export default function MovementHistory({ api, scope, ledgerHref, limit = 10 }) {
  const q = useAsyncData((signal) => api.ledger({ ...scope, pageSize: limit, page: 1, dir: "desc" }, signal), [api, JSON.stringify(scope), limit]);
  if (q.status === "error") return <ErrorState compact title="Unable to load movements" message={inventoryErrorMessage(q.error, "Unable to load stock movements. Please try again.")} onRetry={q.reload} />;
  if (!q.data) return <SkeletonTable rows={4} columns={5} />;
  const rows = q.data.items;
  if (!rows.length) return <p className="rounded-card border border-line px-3 py-6 text-center text-body text-ink-muted">No stock movements recorded yet.</p>;
  return (
    <div>
      <div className="dms-scroll overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[30rem] text-left text-caption">
          <caption className="sr-only">Latest stock movements</caption>
          <thead className="bg-surface-muted text-ink-muted">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Date</th>
              <th scope="col" className="px-3 py-2 font-medium">Type</th>
              <th scope="col" className="px-3 py-2 font-medium">Reference</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">In</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Out</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="whitespace-nowrap px-3 py-2">{formatDateTime(r.date)}</td>
                <td className="px-3 py-2">{r.transactionLabel}{r.stockState === "non_saleable" ? <span className="block text-ink-subtle">non-saleable</span> : null}</td>
                <td className="px-3 py-2">{r.reference}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.inQty != null ? formatNumber(r.inQty) : "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.outQty != null ? formatNumber(r.outQty) : "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.balance != null ? formatNumber(r.balance) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-caption text-ink-subtle">
        Showing the latest {rows.length} of {formatNumber(q.data.total)}. {ledgerHref ? <Link to={ledgerHref} className="font-medium text-brand-700 hover:underline">Open the full stock ledger</Link> : null}
      </p>
    </div>
  );
}
