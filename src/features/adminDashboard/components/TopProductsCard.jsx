import DataTableCard from "../../../components/dashboard/DataTableCard";
import TrendIndicator from "../../../components/ui/TrendIndicator";
import { formatINRWhole, formatNumber, formatPercent } from "../../../utils/format";

export function GrowthCell({ value }) {
  if (value === null || value === undefined) return <span className="text-ink-subtle">—<span className="sr-only">No previous-period data</span></span>;
  return <TrendIndicator direction={value > 0 ? "up" : value < 0 ? "down" : "flat"} value={formatPercent(value)} />;
}

const COLUMNS = [
  { key: "rank", header: "Rank", align: "center", width: "4.5rem", cellClassName: "tabular-nums text-ink-muted" },
  { key: "name", header: "Product", sortable: true, cellClassName: "font-medium" },
  { key: "category", header: "Category", sortable: true },
  { key: "sales", header: "Sales", align: "right", sortable: true, render: (v) => <span className="tabular-nums">{formatINRWhole(v)}</span> },
  { key: "quantity", header: "Quantity", align: "right", sortable: true, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
  { key: "growthPct", header: "Growth", align: "right", sortable: true, sortValue: (r) => (r.growthPct === null ? -1e9 : r.growthPct), render: (v) => <GrowthCell value={v} /> },
];

/** TopProductsCard — Top 10 products by sales, using the shared DataTable. */
export default function TopProductsCard({ data, loading }) {
  const rows = (data?.topProducts || []).map((p) => ({ ...p, id: `${p.rank}-${p.name}` }));
  return (
    <DataTableCard
      className="min-w-0"
      title="Top 10 Products"
      subtitle="By sales value in the selected period"
      columns={COLUMNS}
      data={rows}
      loading={loading || !data}
      pagination={false}
      responsive="cards"
      cardTitleKey="name"
      emptyTitle="No product sales in this period"
      emptyDescription="Try a wider date range."
      caption="Top 10 products by sales"
    />
  );
}
