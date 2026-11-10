import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import ChartCard from "../../../components/dashboard/ChartCard";
import ChartTooltip from "../../../components/dashboard/ChartTooltip";
import { chartAxis, chartGrid, chartPalette } from "../../../styles/tokens";
import { formatNumber } from "../../../utils/format";
import { compressSeries } from "../dashboardModel";
import ChartDataTable from "./ChartDataTable";

const SERIES = [
  { key: "stockIn", name: "Stock In", color: chartPalette[0] },
  { key: "stockOut", name: "Stock Out", color: chartPalette[1] },
  { key: "salesReturns", name: "Sales Returns", color: chartPalette[3] },
  { key: "adjustments", name: "Adjustments", color: chartPalette[5] },
];

/** StockMovementCard — units moving through inventory: in, out, sales returns and adjustments. */
export default function StockMovementCard({ data, loading }) {
  const movement = data?.stockMovement;
  const points = movement ? compressSeries(movement.points, SERIES.map((s) => s.key), 12) : [];
  const grouped = movement && points.length < movement.points.length;

  return (
    <ChartCard
      className="min-w-0"
      title="Stock Movement"
      subtitle={`Units by movement type${grouped ? " · days grouped for readability" : ""}`}
      loading={loading || !data}
      empty={!loading && data && !movement.hasData}
      emptyTitle="No stock movement in this period"
      height={300}
      actions={
        <ul className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-caption text-ink-muted" aria-label="Chart legend">
          {SERIES.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: s.color }} aria-hidden="true" />
              {s.name}
            </li>
          ))}
        </ul>
      }
    >
      {data ? (
        <>
          <div role="img" aria-label="Grouped bar chart of stock in, stock out, sales returns and adjustments in units. The hidden table lists every value." className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid stroke={chartGrid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={16} />
                <YAxis tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => formatNumber(v)} />
                <RechartsTooltip content={<ChartTooltip valueFormatter={(v) => `${formatNumber(v)} units`} />} cursor={{ fill: "rgba(15,23,42,0.04)" }} />
                {SERIES.map((s) => (
                  <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartDataTable
            caption="Stock movement in units"
            columns={[{ key: "label", header: "Period" }, ...SERIES.map((s) => ({ key: s.key, header: s.name, format: formatNumber }))]}
            rows={points}
          />
        </>
      ) : null}
    </ChartCard>
  );
}
