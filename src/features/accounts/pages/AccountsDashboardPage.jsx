import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BadgeCheck, Banknote, CalendarDays, Gauge, HandCoins, Landmark, Receipt, RefreshCw, Wallet } from "lucide-react";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import KpiCard from "../../../components/ui/KpiCard";
import PageHeader from "../../../components/ui/PageHeader";
import IconButton from "../../../components/ui/IconButton";
import Alert from "../../../components/ui/Alert";
import { formatINR, formatINRCompact } from "../../../utils/format";
import { ACCOUNT_PORTALS, accountsApi } from "../api/accountsApi";

/** Accounts overview — /admin/accounts (all distributors) and /dashboard/finance (own books). Every figure comes from the API. */
export default function AccountsDashboardPage({ portal = "admin" }) {
  const cfg = ACCOUNT_PORTALS[portal];
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [n, setN] = useState(0);

  useEffect(() => {
    const c = new AbortController();
    setState((s) => ({ ...s, status: "loading" }));
    accountsApi(portal).summary(c.signal).then((data) => setState({ status: "ready", data, error: null })).catch((error) => { if (error?.name !== "AbortError") setState({ status: "error", data: null, error }); });
    return () => c.abort();
  }, [portal, n]);

  const s = state.data;
  const loading = state.status === "loading" && !s;
  const failed = state.status === "error";
  const v = (x, f = formatINRCompact) => (s ? f(x) : "—");
  const links = [["outstanding", "Outstanding", "Invoices, payments, credit notes and what is still owed"], ["ageing", "Ageing", "Receivables by days past due date"], ["ledger", "Ledger", "Debit / credit / running balance"], ["payments", "Payments", cfg.canWrite ? "Record and review payments" : "Payments received"], ["credit", "Credit limits", "Limit, utilisation and available credit"]];

  return (
    <div>
      <PageHeader title="Accounts" description={portal === "admin" ? "Receivables, collections, credit and claim settlement across all distributors." : "Your receivables, collections and credit."} actions={<IconButton icon={RefreshCw} label="Refresh" variant="outline" onClick={() => setN((x) => x + 1)} disabled={state.status === "loading"} />} />
      {failed ? <Alert tone="error" title="Unable to load the accounts summary" className="mb-4">{state.error?.message}</Alert> : null}
      {s && !s.hasData ? <Alert tone="info" title="No financial data yet" className="mb-4">Receivables appear here once invoices are posted. All figures below are ₹0 until then.</Alert> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total receivables" value={v(s?.totalReceivables)} icon={Wallet} loading={loading} footer={s ? `${formatINR(s.totalReceivables)} on the Accounts Receivable ledger` : undefined} />
        <KpiCard title="Retailer outstanding" value={v(s?.retailerOutstanding)} icon={Receipt} status="info" loading={loading} footer={s?.unappliedAdvances > 0 ? `${formatINR(s.unappliedAdvances)} received in advance` : undefined} />
        <KpiCard title="Overdue" value={v(s?.overdueAmount)} icon={AlertTriangle} status={s?.overdueAmount > 0 ? "error" : "success"} loading={loading} />
        {portal === "admin" ? <KpiCard title="Distributors with balance" value={s ? String(s.distributorsWithOutstanding) : "—"} icon={Landmark} status="neutral" loading={loading} /> : <KpiCard title="Credit utilisation" value={s?.creditUtilisationPct == null ? (s ? "No limit set" : "—") : `${s.creditUtilisationPct}%`} icon={Gauge} status="warning" loading={loading} />}
        <KpiCard title="Today's collections" value={v(s?.todayCollections)} icon={Banknote} status="success" loading={loading} />
        <KpiCard title="This month's collections" value={v(s?.monthCollections)} icon={CalendarDays} status="success" loading={loading} />
        {portal === "admin" ? <KpiCard title="Credit limit / utilisation" value={s ? (s.totalCreditLimit > 0 ? `${s.creditUtilisationPct}%` : "No limits set") : "—"} icon={Gauge} status="warning" loading={loading} footer={s?.totalCreditLimit > 0 ? `${formatINR(s.creditUtilised)} of ${formatINR(s.totalCreditLimit)}` : "Limits are shown for information; they do not block orders"} /> : <KpiCard title="Credit limit" value={v(s?.totalCreditLimit)} icon={Gauge} status="neutral" loading={loading} />}
        <KpiCard title="Approved claims pending settlement" value={s ? String(s.claimsPendingSettlement.count) : "—"} icon={HandCoins} status={s?.claimsPendingSettlement.count > 0 ? "warning" : "neutral"} loading={loading} footer={s ? `${formatINR(s.claimsPendingSettlement.amount)} · ${s.claimsSettled.count} settled (${formatINR(s.claimsSettled.amount)})` : undefined} />
      </div>
      <Card className="mt-6">
        <CardHeader title="Go to" />
        <CardBody>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {links.map(([to, title, text]) => (
              <li key={to}><Link to={`${cfg.base}/${to}`} className="block rounded-card border border-line p-3 hover:bg-neutral-50"><span className="flex items-center gap-2 font-medium text-brand-700"><BadgeCheck className="size-4" aria-hidden="true" />{title}</span><span className="mt-1 block text-caption text-ink-subtle">{text}</span></Link></li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
