import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Banknote, CreditCard, Pencil, Power, PowerOff, ReceiptText, RotateCcw, Shuffle, Wallet } from "lucide-react";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import IconButton from "../../../components/ui/IconButton";
import Alert from "../../../components/ui/Alert";
import Tabs from "../../../components/ui/Tabs";
import KpiCard from "../../../components/ui/KpiCard";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import LoadingState from "../../../components/ui/LoadingState";
import ErrorState from "../../../components/ui/ErrorState";
import { formatDate, formatDateTime, formatINR, formatNumber } from "../../../utils/format";
import { RETAILER_PORTALS, retailerLabels, retailersApi } from "../api/retailersApi";
import { ReassignDialog, RetailerStatusDialog } from "../components/RetailerDialogs";

const Dash = () => <span className="text-ink-subtle">—</span>;
const money = (v) => (v == null ? "—" : formatINR(v));

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <div className="text-caption text-ink-subtle">{label}</div>
      <div className="break-words text-body text-ink">{children || <Dash />}</div>
    </div>
  );
}

// Small read-only table; scrolls sideways inside its own container on narrow screens.
function MiniTable({ columns, rows, empty }) {
  if (!rows?.length) return <p className="px-5 py-6 text-body text-ink-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-left text-body">
        <thead>
          <tr className="border-b border-line text-caption text-ink-subtle">
            {columns.map((c) => <th key={c.key} scope="col" className={`px-5 py-2 font-medium ${c.right ? "text-right" : ""}`}>{c.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0">
              {columns.map((c) => <td key={c.key} className={`px-5 py-2 ${c.right ? "text-right tabular-nums" : ""}`}>{c.render ? c.render(r) : r[c.key] ?? <Dash />}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const dateCol = { key: "date", header: "Date", render: (r) => formatDate(r.date) };
const orderCols = [{ key: "number", header: "Order" }, dateCol, { key: "status", header: "Status" }, { key: "total", header: "Total", right: true, render: (r) => money(r.total) }];
const invoiceCols = [{ key: "number", header: "Invoice" }, dateCol, { key: "status", header: "Status" }, { key: "total", header: "Total", right: true, render: (r) => money(r.total) }, { key: "outstanding", header: "Due", right: true, render: (r) => money(r.outstanding) }];
const paymentCols = [{ key: "reference", header: "Reference" }, dateCol, { key: "amount", header: "Amount", right: true, render: (r) => money(r.amount) }];
const returnCols = [{ key: "number", header: "Return" }, dateCol, { key: "status", header: "Status" }, { key: "creditAmount", header: "Credit note", right: true, render: (r) => money(r.creditAmount) }];

/** Retailer / customer profile — /admin/masters/customers/:id and /dashboard/customers/:id */
export default function RetailerDetailPage({ portal = "distributor" }) {
  const cfg = RETAILER_PORTALS[portal];
  const L = retailerLabels(portal);
  const { id } = useParams();
  const navigate = useNavigate();
  const api = useMemo(() => retailersApi(portal), [portal]);
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [lookups, setLookups] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const load = useCallback(() => {
    const c = new AbortController();
    setState((s) => ({ status: "loading", data: s.data, error: null }));
    api
      .detail(id, c.signal)
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => error?.name !== "AbortError" && setState({ status: "error", data: null, error }));
    return () => c.abort();
  }, [api, id]);
  useEffect(() => load(), [load]);
  useEffect(() => {
    if (!cfg.canAssign) return undefined; // only the admin needs the distributor / group lists (for "Change distributor")
    const c = new AbortController();
    api.lookups(c.signal).then(setLookups).catch(() => {});
    return () => c.abort();
  }, [api, cfg.canAssign]);

  if (state.status === "loading" && !state.data) return <LoadingState label={`Loading ${L.noun}…`} />;
  if (state.status === "error") {
    const s = state.error?.status;
    return <ErrorState message={s === 404 ? `This ${L.noun} does not exist.` : s === 403 ? `You do not have access to this ${L.noun}.` : state.error?.message || "Unable to load this retailer."} onRetry={load} />;
  }
  const d = state.data;
  if (!d) return null;
  const s = d.summary;
  const a = d.address;
  const active = d.status === "active";
  const canToggle = portal === "admin" || d.status !== "pending"; // a pending customer is approved by the administrator

  const overview = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Business information" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Business name">{d.name}</Field>
          <Field label={`${L.Noun} code`}>{d.code}</Field>
          <Field label="Customer group">{d.customerGroup ? `${d.customerGroup.name} (${d.customerGroup.code})` : null}</Field>
          <Field label="GSTIN">{d.gstin}</Field>
          <Field label="PAN">{d.pan}</Field>
          {cfg.showDistributor ? <Field label="Distributor">{d.distributor ? `${d.distributor.name} (${d.distributor.code})` : null}</Field> : <Field label="Created">{formatDate(d.createdAt)}</Field>}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Account status" />
        <CardBody className="space-y-3">
          <StatusBadge status={d.status} domain="distributor" />
          <Field label="Last changed">{d.statusChangedAt ? formatDateTime(d.statusChangedAt) : null}</Field>
          <Field label="Reason">{d.statusReason}</Field>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Contact" />
        <CardBody className="space-y-3">
          <Field label="Contact person">{d.contactPerson}</Field>
          <Field label="Phone">{d.phone}</Field>
          <Field label="Alternate phone">{d.alternatePhone}</Field>
          <Field label="Email">{d.email}</Field>
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Address & territory" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3"><Field label="Billing address">{[a.street1, a.street2, a.street3, a.street4].filter(Boolean).join(", ")}</Field></div>
          <div className="sm:col-span-3"><Field label="Shipping address">{d.shipping ? [d.shipping.street1, d.shipping.street2, d.shipping.city, d.shipping.state, d.shipping.pincode].filter(Boolean).join(", ") : "Same as billing address"}</Field></div>
          <Field label="City">{a.city}</Field>
          <Field label="State">{a.state}</Field>
          <Field label="PIN code">{a.pincode}</Field>
          <Field label="Territory">{d.effectiveTerritory}{d.territory ? "" : d.effectiveTerritory ? " (from city / state)" : ""}</Field>
        </CardBody>
      </Card>
    </div>
  );

  const business = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Sales invoiced" value={money(s.salesInvoiced)} icon={ReceiptText} status="brand" footer={`${formatNumber(s.invoiceCount)} posted invoices · ${formatNumber(s.orderCount)} orders`} />
        <KpiCard title="Outstanding" value={money(s.outstanding)} icon={Wallet} status="warning" footer={s.outstanding == null ? "No receivable ledger entries yet" : "Accounts Receivable balance"} />
        <KpiCard title="Payments received" value={money(s.paymentsReceived)} icon={Banknote} status="success" footer={`${formatNumber(s.paymentCount)} payments`} />
        <KpiCard title="Returns" value={formatNumber(s.returnCount)} icon={RotateCcw} status="neutral" footer={`${money(s.returnValue)} credited (posted returns)`} />
        <KpiCard title="Credit limit" value="—" icon={CreditCard} status="info" footer="Credit limits are not tracked for customers yet" />
      </div>
      <Card><CardHeader title="Recent orders" /><MiniTable columns={orderCols} rows={d.recentOrders} empty="No orders yet." /></Card>
      <Card><CardHeader title="Recent invoices" /><MiniTable columns={invoiceCols} rows={d.recentInvoices} empty="No invoices yet." /></Card>
      <Card><CardHeader title="Payments" /><MiniTable columns={paymentCols} rows={d.recentPayments} empty="No payments recorded yet." /></Card>
      <Card><CardHeader title="Returns" /><MiniTable columns={returnCols} rows={d.recentReturns} empty="No returns yet." /></Card>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={d.name}
        description={`${d.code}${d.effectiveTerritory ? ` · ${d.effectiveTerritory}` : ""}${cfg.showDistributor && d.distributor ? ` · ${d.distributor.name}` : ""}`}
        meta={<StatusBadge status={d.status} domain="distributor" />}
        actions={
          <>
            <IconButton icon={ArrowLeft} label={`Back to ${L.nouns}`} variant="outline" onClick={() => navigate(cfg.base)} />
            <Button variant="secondary" leftIcon={Pencil} onClick={() => navigate(`${cfg.base}/${d.id}/edit`)}>Edit</Button>
            {cfg.canAssign ? <Button variant="secondary" leftIcon={Shuffle} onClick={() => setAssignOpen(true)}>Change distributor</Button> : null}
            {canToggle ? (
              <Button variant={active ? "danger-outline" : "primary"} leftIcon={active ? PowerOff : Power} onClick={() => setStatusOpen(true)}>{active ? "Deactivate" : "Activate"}</Button>
            ) : null}
          </>
        }
      />
      {!active ? (
        <Alert tone="warning" className="mb-4" title={d.status === "pending" ? `This ${L.noun} is pending approval` : `This ${L.noun} is inactive`}>
          New orders cannot be created for it. All historical orders, invoices, payments and returns are preserved.
          {d.status === "pending" && portal !== "admin" ? " An administrator must activate it." : ""}{d.statusReason ? ` Reason: ${d.statusReason}` : ""}
        </Alert>
      ) : null}
      <Tabs tabs={[{ id: "overview", label: "Overview", content: overview }, { id: "business", label: "Business summary", content: business }]} panelClassName="pt-4" />
      <RetailerStatusDialog api={api} retailer={{ id: d.id, name: d.name, status: d.status }} open={statusOpen} onClose={() => setStatusOpen(false)} onChanged={load} />
      {cfg.canAssign ? <ReassignDialog api={api} retailer={d} lookups={lookups} open={assignOpen} onClose={() => setAssignOpen(false)} onChanged={load} /> : null}
    </div>
  );
}
