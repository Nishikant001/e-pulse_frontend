import { useOptionalAdminSession } from "../../adminAuth/adminSessionContext";
import WelcomeBanner from "../../../components/dashboard/WelcomeBanner";
import { Activity, Building2, CircleCheck, IndianRupee, ShieldCheck, Store, TriangleAlert, Users, Megaphone, ScrollText } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import ActivityCard from "../../../components/dashboard/ActivityCard";
import ChartCard from "../../../components/dashboard/ChartCard";
import ChartTooltip from "../../../components/dashboard/ChartTooltip";
import Badge from "../../../components/ui/Badge";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import KpiCard from "../../../components/ui/KpiCard";
import PageHeader from "../../../components/ui/PageHeader";
import ProgressBar from "../../../components/ui/ProgressBar";
import { brand, chartAxis, chartGrid, statusColors } from "../../../styles/tokens";
import { formatINR, formatNumber, formatDateTime } from "../../../utils/format";
import DemoNotice from "../components/DemoNotice";
import { DASHBOARD_KPIS as K, ONBOARDING_BY_MONTH, PLAN_MIX, RECENT_ACTIVITY, SYSTEM_HEALTH } from "../demoData";

const ACTIVITY_ICON = { success: CircleCheck, info: Users, brand: Building2, warning: TriangleAlert, error: ShieldCheck };

/** Super Admin → Dashboard. Sample data (design preview): platform KPIs, onboarding trend, plan mix, system health, recent activity. */
export default function SuperAdminHomePage() {
  const admin = useOptionalAdminSession()?.admin;
  const totalPlans = PLAN_MIX.reduce((a, p) => a + p.count, 0);
  const activity = RECENT_ACTIVITY.map((a) => ({
    id: a.id,
    title: a.title,
    tone: a.tone,
    icon: ACTIVITY_ICON[a.tone] || Activity,
    description: a.detail,
    time: <time dateTime={a.at}>{formatDateTime(a.at)}</time>,
  }));

  return (
    <div>
      <WelcomeBanner
        tone="super"
        name={admin?.name}
        subtitle="Your whole platform at a glance — admins, distributors, revenue and health."
        actions={[
          { label: "Admins & Users", to: "/admin/super-admin", icon: Users },
          { label: "Audit logs", to: "/admin/super-admin/audit-logs", icon: ScrollText },
          { label: "Announce", to: "/admin/super-admin/announcements", icon: Megaphone },
        ]}
      />
      <PageHeader title="Platform Dashboard" description="The whole network at a glance — admin accounts, distributors, subscription revenue and platform health." />
      <DemoNotice>The figures, chart, health checks and activity on this dashboard are sample data. Use Admins &amp; Users for live account data.</DemoNotice>

      <section aria-label="Platform totals" className="mb-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Admin accounts" icon={Users} status="brand" value={formatNumber(K.admins.value)} trend={{ direction: "up", value: K.admins.trend }} comparison={K.admins.comparison} footer={`${formatNumber(K.admins.active)} active`} />
        <KpiCard title="Distributors" icon={Building2} status="info" value={formatNumber(K.distributors.value)} trend={{ direction: "up", value: K.distributors.trend }} comparison={K.distributors.comparison} footer={`${formatNumber(K.distributors.active)} active`} />
        <KpiCard title="Retailers on platform" icon={Store} status="success" value={formatNumber(K.retailers.value)} trend={{ direction: "up", value: K.retailers.trend }} comparison={K.retailers.comparison} />
        <KpiCard title="Monthly recurring revenue" icon={IndianRupee} status="warning" value={formatINR(K.mrr.value)} trend={{ direction: "up", value: K.mrr.trend }} comparison={K.mrr.comparison} />
      </section>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <ChartCard className="min-w-0 lg:col-span-2" title="Distributor onboarding" subtitle="New distributors vs. churned, last 6 months" height={280}>
          <div role="img" aria-label="Bar chart of distributors added and churned per month" className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ONBOARDING_BY_MONTH} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={chartGrid} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                <RechartsTooltip content={<ChartTooltip valueFormatter={formatNumber} />} cursor={{ fill: "rgba(148,163,184,0.12)" }} />
                <Bar dataKey="added" name="Added" fill={brand[600]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="churned" name="Churned" fill={statusColors.neutral} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <Card className="min-w-0">
          <CardHeader title="Plan mix" subtitle={`${formatNumber(totalPlans)} subscribed distributors`} />
          <CardBody className="space-y-4">
            {PLAN_MIX.map((p) => (
              <ProgressBar key={p.name} label={`${p.name} · ${formatNumber(p.count)} distributors`} showValue value={(p.count / totalPlans) * 100} />
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="min-w-0">
          <CardHeader title="System health" subtitle="Status of platform services" />
          <ul className="divide-y divide-line">
            {SYSTEM_HEALTH.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{s.name}</span>
                  <span className="block truncate text-caption text-ink-subtle">{s.detail}</span>
                </span>
                <Badge tone={s.status === "Operational" ? "success" : "warning"} dot>{s.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <ActivityCard className="min-w-0 lg:col-span-2" title="Recent activity" subtitle="Latest platform events" items={activity} />
      </div>
    </div>
  );
}
