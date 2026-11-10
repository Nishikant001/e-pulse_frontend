import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import ChartCard from "../../../components/dashboard/ChartCard";
import ChartTooltip from "../../../components/dashboard/ChartTooltip";
import { brand, chartAxis, chartGrid, statusColors } from "../../../styles/tokens";
import { formatINRCompact, formatINRWhole } from "../../../utils/format";
import ChartDataTable from "./ChartDataTable";

/** SalesTrendCard — secondary sales for the period (area) against the previous period (dashed line). */
export default function SalesTrendCard({ data, loading }) {
  const trend = data?.salesTrend;
  const points = trend?.points || [];
  const total = (key) => points.reduce((a, p) => a + (p[key] || 0), 0);
  const weekly = trend && trend.granularityDays > 1;

  return (
    <ChartCard
      className="min-w-0"
      title="Secondary Sales Trend"
      subtitle={weekly ? `Sales value (₹) · grouped in ${trend.granularityDays}-day periods` : "Sales value (₹) by day"}
      loading={loading || !data}
      empty={!loading && data && !trend.hasData}
      emptyTitle="No secondary sales in this period"
      height={300}
      actions={
        <ul className="flex items-center gap-4 text-caption text-ink-muted" aria-label="Chart legend">
          <li className="flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded bg-brand-600" aria-hidden="true" />
            Current period
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-5 border-t-2 border-dashed border-neutral-500" aria-hidden="true" />
            Previous period
          </li>
        </ul>
      }
    >
      {data ? (
        <>
          <div role="img" aria-label={`Secondary sales trend. Current period total ${formatINRWhole(total("current"))}; previous period total ${formatINRWhole(total("previous"))}.`} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminSalesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={brand[600]} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={brand[600]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartGrid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => formatINRCompact(v)} />
                <RechartsTooltip content={<ChartTooltip valueFormatter={formatINRWhole} />} />
                <Area type="monotone" dataKey="current" name="Current period" stroke={brand[600]} strokeWidth={2} fill="url(#adminSalesFill)" />
                <Line type="monotone" dataKey="previous" name="Previous period" stroke={statusColors.neutral} strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <ChartDataTable
            caption="Secondary sales by period"
            columns={[
              { key: "label", header: "Period" },
              { key: "current", header: "Current period (₹)", format: formatINRWhole },
              { key: "previous", header: "Previous period (₹)", format: formatINRWhole },
            ]}
            rows={points}
          />
        </>
      ) : null}
    </ChartCard>
  );
}
