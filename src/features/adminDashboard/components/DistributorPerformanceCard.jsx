import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import ChartCard from "../../../components/dashboard/ChartCard";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useBreakpoint } from "../../../hooks/useMediaQuery";
import { brand, chartAxis, chartGrid } from "../../../styles/tokens";
import { formatINRCompact, formatINRWhole, formatNumber, formatPercent } from "../../../utils/format";
import ChartDataTable from "./ChartDataTable";

const MAX_BARS = 8;
const short = (name, n) => (name.length > n ? `${name.slice(0, n - 1)}…` : name);

function DistributorTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-control border border-line bg-surface px-3 py-2 shadow-popover">
      <p className="text-table font-semibold text-ink">{d.name}</p>
      <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-table">
        <dt className="text-ink-muted">Sales</dt>
        <dd className="text-right font-medium tabular-nums">{formatINRWhole(d.sales)}</dd>
        <dt className="text-ink-muted">Orders</dt>
        <dd className="text-right font-medium tabular-nums">{formatNumber(d.orders)}</dd>
        <dt className="text-ink-muted">Growth</dt>
        <dd className="text-right font-medium tabular-nums">{d.growthPct === null ? "—" : formatPercent(d.growthPct)}</dd>
      </dl>
      <div className="mt-1.5">
        <StatusBadge status={d.status} domain="generic" size="sm" />
      </div>
    </div>
  );
}

/** DistributorPerformanceCard — top distributors by sales (bars); orders, growth and status in the tooltip and the hidden table. */
export default function DistributorPerformanceCard({ data, loading }) {
  const bp = useBreakpoint();
  const rows = (data?.distributors || []).slice(0, MAX_BARS);
  const nameWidth = bp === "mobile" ? 96 : 150;
  const height = Math.max(220, rows.length * 38 + 28);

  return (
    <ChartCard
      className="min-w-0"
      title="Distributor Sales Performance"
      subtitle={`Top ${MAX_BARS} distributors by sales in the selected period`}
      loading={loading || !data}
      empty={!loading && data && rows.length === 0}
      emptyTitle="No distributor sales in this period"
      height={loading || !data ? 300 : height}
    >
      {data ? (
        <>
          <div role="img" aria-label={`Bar chart of sales for the top ${rows.length} distributors. Details are in the Top Distributors table.`} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={chartGrid} horizontal={false} />
                <XAxis type="number" tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatINRCompact(v)} />
                <YAxis type="category" dataKey="name" width={nameWidth} tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => short(v, bp === "mobile" ? 14 : 22)} />
                <RechartsTooltip content={<DistributorTooltip />} cursor={{ fill: "rgba(0,102,204,0.06)" }} />
                <Bar dataKey="sales" name="Sales" fill={brand[600]} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ChartDataTable
            caption="Top distributors by sales"
            columns={[
              { key: "name", header: "Distributor" },
              { key: "sales", header: "Sales (₹)", format: formatINRWhole },
              { key: "orders", header: "Orders", format: formatNumber },
              { key: "growthPct", header: "Growth", format: (v) => (v === null ? "No previous data" : formatPercent(v)) },
              { key: "status", header: "Status" },
            ]}
            rows={rows}
          />
        </>
      ) : null}
    </ChartCard>
  );
}
