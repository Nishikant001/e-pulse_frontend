import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import ChartCard from "../../../components/dashboard/ChartCard";
import ChartTooltip from "../../../components/dashboard/ChartTooltip";
import { categoryPalette } from "../../../styles/tokens";
import { formatINRCompact, formatINRWhole } from "../../../utils/format";
import ChartDataTable from "./ChartDataTable";

/** CategorySalesCard — sales by product category: donut + a legend that always shows the name, amount and % share. */
export default function CategorySalesCard({ data, loading }) {
  const rows = data?.categories || [];
  const total = rows.reduce((a, c) => a + c.sales, 0);

  return (
    <ChartCard
      className="min-w-0"
      title="Product Category Sales"
      subtitle="Share of secondary sales in the selected period"
      loading={loading || !data}
      empty={!loading && data && total === 0}
      emptyTitle="No category sales in this period"
      height="auto"
    >
      {data ? (
        <>
          <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
            <div role="img" aria-label={`Donut chart of category sales, total ${formatINRWhole(total)}. The list beside it gives every value.`} className="mx-auto h-52 w-full max-w-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={rows} dataKey="sales" nameKey="name" innerRadius="58%" outerRadius="92%" paddingAngle={2} stroke="#ffffff" strokeWidth={2}>
                    {rows.map((c, i) => (
                      <Cell key={c.name} fill={categoryPalette[i % categoryPalette.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<ChartTooltip valueFormatter={formatINRWhole} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="min-w-0 divide-y divide-line">
              {rows.map((c, i) => (
                <li key={c.name} className="flex items-center gap-3 py-2 text-table">
                  <span className="size-3 shrink-0 rounded-sm" style={{ backgroundColor: categoryPalette[i % categoryPalette.length] }} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-ink">{c.name}</span>
                  <span className="tabular-nums text-ink-muted">{formatINRCompact(c.sales)}</span>
                  <span className="w-12 text-right font-medium tabular-nums text-ink">{c.share}%</span>
                </li>
              ))}
            </ul>
          </div>
          <ChartDataTable
            caption="Sales by product category"
            columns={[
              { key: "name", header: "Category" },
              { key: "sales", header: "Sales (₹)", format: formatINRWhole },
              { key: "share", header: "Share of sales", format: (v) => `${v}%` },
            ]}
            rows={rows}
          />
        </>
      ) : null}
    </ChartCard>
  );
}
