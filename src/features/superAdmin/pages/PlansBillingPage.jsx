import { Check, CreditCard, IndianRupee, Receipt, TriangleAlert } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import KpiCard from "../../../components/ui/KpiCard";
import PageHeader from "../../../components/ui/PageHeader";
import DataTable from "../../../components/tables/DataTable";
import { cn } from "../../../utils/cn";
import { formatDate, formatINR, formatNumber } from "../../../utils/format";
import DemoNotice from "../components/DemoNotice";
import { PLANS, SUBSCRIPTION_INVOICES } from "../demoData";

const STATUS_TONE = { Paid: "success", Due: "info", Overdue: "error" };

/** Super Admin → Plans & Billing (sample data): subscription plans and the invoices raised to distributors. */
export default function PlansBillingPage() {
  const collected = SUBSCRIPTION_INVOICES.filter((i) => i.status === "Paid").reduce((a, i) => a + i.amount, 0);
  const outstanding = SUBSCRIPTION_INVOICES.filter((i) => i.status !== "Paid").reduce((a, i) => a + i.amount, 0);
  const overdue = SUBSCRIPTION_INVOICES.filter((i) => i.status === "Overdue").length;

  const columns = [
    { key: "id", header: "Invoice", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { key: "distributor", header: "Distributor", sortable: true },
    { key: "plan", header: "Plan", sortable: true },
    { key: "issuedAt", header: "Issued", sortable: true, render: (v) => formatDate(v) },
    { key: "dueAt", header: "Due", sortable: true, render: (v) => formatDate(v) },
    { key: "amount", header: "Amount", sortable: true, align: "right", render: (v) => <span className="font-medium tabular-nums">{formatINR(v)}</span> },
    { key: "status", header: "Status", sortable: true, render: (v) => <Badge tone={STATUS_TONE[v]} dot>{v}</Badge> },
  ];

  return (
    <div>
      <PageHeader title="Plans & Billing" description="Subscription plans offered to distributors and the invoices raised against them." />
      <DemoNotice />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Collected this cycle" icon={IndianRupee} status="success" value={formatINR(collected)} />
        <KpiCard title="Outstanding" icon={Receipt} status="warning" value={formatINR(outstanding)} />
        <KpiCard title="Overdue invoices" icon={TriangleAlert} status="error" value={formatNumber(overdue)} />
        <KpiCard title="Active subscriptions" icon={CreditCard} status="brand" value={formatNumber(PLANS.reduce((a, p) => a + p.distributors, 0))} />
      </div>

      <section aria-label="Plans" className="mb-6 grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.id} className={cn("min-w-0", p.popular && "ring-2 ring-brand-500")}>
            <CardBody className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-card-title font-semibold text-ink">{p.name}</h2>
                  <p className="text-body text-ink-muted">{p.blurb}</p>
                </div>
                {p.popular ? <Badge tone="brand">Most popular</Badge> : null}
              </div>
              <p className="text-ink">
                <span className="text-2xl font-semibold tabular-nums">{formatINR(p.price)}</span>
                <span className="text-body text-ink-muted"> / month</span>
              </p>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-body text-ink">
                    <Check className="mt-0.5 size-4 shrink-0 text-success-700" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
              <p className="border-t border-line pt-3 text-caption text-ink-subtle">{formatNumber(p.distributors)} distributors on this plan</p>
            </CardBody>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader title="Subscription invoices" subtitle="Latest billing cycle" />
        <DataTable bare rowKey="id" caption="Subscription invoices" columns={columns} data={SUBSCRIPTION_INVOICES} searchable searchPlaceholder="Search invoice or distributor" searchKeys={["id", "distributor", "plan", "status"]} responsive="cards" cardTitleKey="id" emptyIcon={Receipt} emptyTitle="No invoices" />
      </Card>
    </div>
  );
}
