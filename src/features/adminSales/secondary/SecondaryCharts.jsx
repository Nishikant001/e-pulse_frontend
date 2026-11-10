import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import ChartCard from "../../../components/dashboard/ChartCard";
import ChartTooltip from "../../../components/dashboard/ChartTooltip";
import { useBreakpoint } from "../../../hooks/useMediaQuery";
import { brand, chartAxis, chartGrid, chartPalette } from "../../../styles/tokens";
import { formatINRCompact, formatINRWhole, formatNumber } from "../../../utils/format";
import ChartDataTable from "../../adminDashboard/components/ChartDataTable";
import { shortDate } from "../../adminDashboard/dashboardModel";

const cut = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const GRAIN = { 1: "by day", 7: "by week", 30: "in 30-day periods" };

/** Secondary Sales Trend — sales value over the selected range (daily / weekly / 30-day grouping chosen by the server). */
export function TrendChart({ summary, loading }) {
  const points = (summary?.trend.points || []).map((p) => ({ ...p, label: shortDate(p.date) }));
  const total = points.reduce((a, p) => a + p.value, 0);
  return (
    <ChartCard className="min-w-0" title="Secondary Sales Trend" subtitle={`Net sales value (₹, before GST) ${GRAIN[summary?.trend.granularityDays] || ""}`} loading={loading || !summary} empty={!loading && summary && total === 0} emptyTitle="No secondary sales in this period" height={280}>
      {summary ? (
        <>
          <div role="img" aria-label={`Secondary sales trend. Total ${formatINRWhole(total)} across ${points.length} periods.`} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="secSalesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={brand[600]} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={brand[600]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartGrid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => formatINRCompact(v)} />
                <RechartsTooltip content={<ChartTooltip valueFormatter={formatINRWhole} />} />
                <Area type="monotone" dataKey="value" name="Sales value" stroke={brand[600]} strokeWidth={2} fill="url(#secSalesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <ChartDataTable caption="Secondary sales by period" columns={[{ key: "label", header: "Period" }, { key: "value", header: "Sales value (₹)", format: formatINRWhole }]} rows={points} />
        </>
      ) : null}
    </ChartCard>
  );
}

function HBar({ title, subtitle, loading, rows, summary, nameKey, tooltip, caption, emptyTitle, color }) {
  const bp = useBreakpoint();
  const height = Math.max(220, rows.length * 34 + 28);
  return (
    <ChartCard className="min-w-0" title={title} subtitle={subtitle} loading={loading || !summary} empty={!loading && summary && rows.length === 0} emptyTitle={emptyTitle} height={loading || !summary ? 280 : height}>
      {summary ? (
        <>
          <div role="img" aria-label={`${caption}. Values are listed in the hidden table for screen readers.`} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={chartGrid} horizontal={false} />
                <XAxis type="number" tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatINRCompact(v)} />
                <YAxis type="category" dataKey={nameKey} width={bp === "mobile" ? 96 : 150} tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => cut(String(v), bp === "mobile" ? 14 : 22)} />
                <RechartsTooltip content={tooltip} cursor={{ fill: "rgba(0,102,204,0.06)" }} />
                <Bar dataKey="value" name="Sales value" fill={color} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartDataTable
            caption={caption}
            columns={[{ key: nameKey, header: nameKey === "name" ? "Name" : "Item" }, ...(rows[0] && "quantity" in rows[0] ? [{ key: "quantity", header: "Quantity", format: formatNumber }] : []), { key: "value", header: "Sales value (₹)", format: formatINRWhole }]}
            rows={rows}
          />
        </>
      ) : null}
    </ChartCard>
  );
}

/** Distributor Sales — top distributors by net sales value in the filtered set. */
export function DistributorChart({ summary, loading }) {
  return <HBar title="Distributor Sales" subtitle="Top 10 distributors by sales value" loading={loading} summary={summary} rows={summary?.distributors || []} nameKey="name" tooltip={<ChartTooltip valueFormatter={formatINRWhole} />} caption="Sales value by distributor" emptyTitle="No distributor sales in this period" color={brand[600]} />;
}

function ProductTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2 shadow-popover">
      <p className="text-table font-semibold text-ink">{d.name}</p>
      <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-table">
        <dt className="text-ink-muted">Sales value</dt>
        <dd className="text-right font-medium tabular-nums">{formatINRWhole(d.value)}</dd>
        <dt className="text-ink-muted">Quantity</dt>
        <dd className="text-right font-medium tabular-nums">{formatNumber(d.quantity)}</dd>
      </dl>
    </div>
  );
}

/** Product Sales — top products by sales value, with the quantity sold in the tooltip. */
export function ProductChart({ summary, loading }) {
  return (
    <HBar
      title="Product Sales"
      subtitle="Top 10 products by sales value (quantity in the tooltip)"
      loading={loading}
      summary={summary}
      rows={summary?.products || []}
      nameKey="name"
      tooltip={<ProductTooltip />}
      caption="Sales value and quantity by product"
      emptyTitle="No product sales in this period"
      color={chartPalette[1]}
    />
  );
}
