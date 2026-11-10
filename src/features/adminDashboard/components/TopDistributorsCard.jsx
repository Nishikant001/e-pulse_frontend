import DataTableCard from "../../../components/dashboard/DataTableCard";
import StatusBadge from "../../../components/ui/StatusBadge";
import { formatINRWhole, formatNumber } from "../../../utils/format";

const COLUMNS = [
  { key: "rank", header: "Rank", align: "center", width: "4.5rem", cellClassName: "tabular-nums text-ink-muted" },
  { key: "name", header: "Distributor", sortable: true, cellClassName: "font-medium" },
  { key: "territory", header: "Territory", sortable: true, render: (v) => v || <span className="text-ink-subtle">—</span> },
  { key: "sales", header: "Sales", align: "right", sortable: true, render: (v) => <span className="tabular-nums">{formatINRWhole(v)}</span> },
  { key: "orders", header: "Orders", align: "right", sortable: true, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
  {
    key: "outstanding",
    header: "Outstanding",
    align: "right",
    sortable: true,
    sortValue: (r) => (r.outstanding === null ? -1e12 : r.outstanding),
    render: (v) => (v === null ? <span className="text-ink-subtle">—<span className="sr-only">Not available</span></span> : <span className="tabular-nums">{formatINRWhole(v)}</span>),
  },
  { key: "status", header: "Status", render: (v) => <StatusBadge status={v} domain="generic" /> },
];

/** TopDistributorsCard — Top 10 distributors by sales, using the shared DataTable. */
export default function TopDistributorsCard({ data, loading }) {
  const rows = (data?.distributors || []).map((d) => ({ ...d, id: `${d.rank}-${d.id}` }));
  return (
    <DataTableCard
      className="min-w-0"
      title="Top 10 Distributors"
      subtitle="By sales value in the selected period"
      columns={COLUMNS}
      data={rows}
      loading={loading || !data}
      pagination={false}
      responsive="cards"
      cardTitleKey="name"
      emptyTitle="No distributor sales in this period"
      emptyDescription="Try a wider date range."
      caption="Top 10 distributors by sales"
    />
  );
}
