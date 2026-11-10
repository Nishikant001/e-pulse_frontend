import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Banknote, CreditCard, Pencil, Power, PowerOff, ReceiptText, RotateCcw, Wallet } from "lucide-react";
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
import { distributorsApi } from "../api/distributorsApi";
import StatusChangeDialog from "../components/StatusChangeDialog";

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

// Small read-only table for "recent" lists; scrolls sideways inside its own container on narrow screens.
function MiniTable({ columns, rows, empty }) {
  if (!rows?.length) return <p className="px-5 py-6 text-body text-ink-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-left text-body">
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

const orderCols = [
  { key: "number", header: "Order" }, { key: "date", header: "Date", render: (r) => formatDate(r.date) }, { key: "retailer", header: "Retailer" },
  { key: "status", header: "Status" }, { key: "total", header: "Total", right: true, render: (r) => money(r.total) },
];
const invoiceCols = [
  { key: "number", header: "Invoice" }, { key: "date", header: "Date", render: (r) => formatDate(r.date) }, { key: "retailer", header: "Retailer" },
  { key: "status", header: "Status" }, { key: "total", header: "Total", right: true, render: (r) => money(r.total) }, { key: "outstanding", header: "Due", right: true, render: (r) => money(r.outstanding) },
];
const paymentCols = [
  { key: "reference", header: "Reference" }, { key: "date", header: "Date", render: (r) => formatDate(r.date) }, { key: "retailer", header: "Retailer" },
  { key: "amount", header: "Amount", right: true, render: (r) => money(r.amount) },
];
const returnCols = [
  { key: "number", header: "Return" }, { key: "date", header: "Date", render: (r) => formatDate(r.date) }, { key: "retailer", header: "Retailer" },
  { key: "status", header: "Status" }, { key: "creditAmount", header: "Credit note", right: true, render: (r) => money(r.creditAmount) },
];

function RetailersPanel({ distributorId, total }) {
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const size = 10;
  useEffect(() => {
    const c = new AbortController();
    setState((s) => ({ status: "loading", data: s.data, error: null }));
    distributorsApi
      .retailers(distributorId, { page, pageSize: size }, c.signal)
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => error?.name !== "AbortError" && setState({ status: "error", data: null, error }));
    return () => c.abort();
  }, [distributorId, page]);

  const pages = Math.max(1, Math.ceil((state.data?.total ?? total ?? 0) / size));
  return (
    <Card>
      <CardHeader title="Associated retailers" subtitle="Retailers (customers) that belong to this distributor. Mapping is managed from Retailer Management." />
      {state.status === "error" ? (
        <div className="p-5"><Alert tone="error">{state.error?.message || "Unable to load retailers."}</Alert></div>
      ) : state.status === "loading" && !state.data ? (
        <p className="px-5 py-6 text-body text-ink-muted">Loading retailers…</p>
      ) : (
        <MiniTable
          rows={state.data?.items}
          empty="No retailers are mapped to this distributor yet."
          columns={[{ key: "code", header: "Code" }, { key: "name", header: "Retailer" }, { key: "city", header: "City" }, { key: "state", header: "State" }, { key: "group", header: "Price group" }, { key: "gstin", header: "GSTIN" }]}
        />
      )}
      {pages > 1 ? (
        <div className="flex items-center justify-between border-t border-line px-5 py-3 text-caption text-ink-muted">
          <span>Page {page} of {pages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

/** Distributor profile — /admin/distributors/:id */
export default function DistributorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [statusOpen, setStatusOpen] = useState(false);

  const load = useCallback(() => {
    const c = new AbortController();
    setState((s) => ({ status: "loading", data: s.data, error: null }));
    distributorsApi
      .detail(id, c.signal)
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => error?.name !== "AbortError" && setState({ status: "error", data: null, error }));
    return () => c.abort();
  }, [id]);
  useEffect(() => load(), [load]);

  if (state.status === "loading" && !state.data) return <LoadingState label="Loading distributor…" />;
  if (state.status === "error") return <ErrorState message={state.error?.status === 404 ? "This distributor does not exist." : state.error?.message || "Unable to load this distributor."} onRetry={load} />;
  const d = state.data;
  if (!d) return null;
  const s = d.summary;
  const a = d.address;
  const active = d.status === "active";

  const overview = (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader title="Business information" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Business name">{d.name}</Field>
          <Field label="Distributor code">{d.code}</Field>
          <Field label="GSTIN">{d.gstin}</Field>
          <Field label="PAN">{d.pan}</Field>
          <Field label="Payment terms">{d.paymentTerms}</Field>
          <Field label="Credit limit">{d.creditLimit != null ? formatINR(d.creditLimit) : null}</Field>
          <Field label="Created">{formatDate(d.createdAt)}</Field>
          <Field label="Last updated">{formatDate(d.updatedAt)}</Field>
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
          <Field label="Email">{d.email}</Field>
        </CardBody>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Address & territory" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3"><Field label="Registered / billing address">{[a.street1, a.street2, a.street3, a.street4, a.freeText].filter(Boolean).join(", ")}</Field></div>
          <Field label="City">{a.city}</Field>
          <Field label="State">{a.state}</Field>
          <Field label="Postal code">{a.postalCode}</Field>
          <Field label="Country">{a.country}</Field>
          <Field label="Territory">{d.effectiveTerritory}{d.territory ? "" : d.effectiveTerritory ? " (from city / state)" : ""}</Field>
        </CardBody>
      </Card>
    </div>
  );

  const summary = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Sales invoiced" value={money(s.salesInvoiced)} icon={ReceiptText} status="brand" footer={`${formatNumber(s.invoiceCount)} posted invoices · ${formatNumber(s.orderCount)} orders`} />
        <KpiCard title="Outstanding" value={money(s.outstanding)} icon={Wallet} status="warning" footer={s.outstanding == null ? "No receivable ledger entries yet" : "Accounts Receivable balance"} />
        <KpiCard title="Payments received" value={money(s.paymentsReceived)} icon={Banknote} status="success" footer={`${formatNumber(s.paymentCount)} payments`} />
        <KpiCard title="Credit limit" value={money(s.creditLimit)} icon={CreditCard} status="info" footer={s.creditLimit == null ? "Not set" : "Reference only — not enforced"} />
        <KpiCard title="Available credit" value={money(s.availableCredit)} icon={CreditCard} status="info" footer={s.availableCredit == null ? "Needs a credit limit and ledger balance" : "Limit − outstanding"} />
        <KpiCard title="Returns" value={formatNumber(s.returnCount)} icon={RotateCcw} status="neutral" footer={`${money(s.returnValue)} credited (posted returns)`} />
      </div>
      <Card><CardHeader title="Recent orders" /><MiniTable columns={orderCols} rows={d.recentOrders} empty="No orders yet." /></Card>
      <Card><CardHeader title="Recent invoices" /><MiniTable columns={invoiceCols} rows={d.recentInvoices} empty="No invoices yet." /></Card>
      <Card><CardHeader title="Payment history" /><MiniTable columns={paymentCols} rows={d.recentPayments} empty="No payments recorded yet." /></Card>
      <Card><CardHeader title="Return history" /><MiniTable columns={returnCols} rows={d.recentReturns} empty="No returns yet." /></Card>
    </div>
  );

  const related = (
    <div className="space-y-4">
      <RetailersPanel distributorId={d.id} total={s.retailerCount} />
      <Card>
        <CardHeader title="Pricing assignments" subtitle={`${formatNumber(s.pricingCount)} price rule${s.pricingCount === 1 ? "" : "s"} · edit in Pricing Master`} />
        <MiniTable
          rows={d.pricing} empty="No pricing rules are set for this distributor."
          columns={[
            { key: "product", header: "Product" }, { key: "customerGroup", header: "Price group" },
            { key: "basePrice", header: "Base price", right: true, render: (r) => money(r.basePrice) }, { key: "discountPercent", header: "Discount", right: true, render: (r) => `${r.discountPercent}%` },
            { key: "validFrom", header: "Valid from", render: (r) => formatDate(r.validFrom) }, { key: "validTo", header: "Valid to", render: (r) => (r.validTo ? formatDate(r.validTo) : "Open-ended") },
          ]}
        />
      </Card>
      <Card>
        <CardHeader title="Schemes" />
        <p className="px-5 py-6 text-body text-ink-muted">Scheme data is not available yet — schemes are not part of the current data model, so nothing is shown here.</p>
      </Card>
      <Card>
        <CardHeader title="Business activity" subtitle="Latest orders, invoices, payments, returns and status change" />
        <MiniTable
          rows={d.activity.map((x, i) => ({ ...x, id: i }))} empty="No activity yet."
          columns={[{ key: "at", header: "When", render: (r) => formatDateTime(r.at) }, { key: "type", header: "Type" }, { key: "text", header: "Activity" }]}
        />
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={d.name}
        description={`${d.code}${d.effectiveTerritory ? ` · ${d.effectiveTerritory}` : ""}`}
        meta={<StatusBadge status={d.status} domain="distributor" />}
        actions={
          <>
            <IconButton icon={ArrowLeft} label="Back to distributors" variant="outline" onClick={() => navigate("/admin/distributors")} />
            <Button variant="secondary" leftIcon={Pencil} onClick={() => navigate(`/admin/distributors/${d.id}/edit`)}>Edit</Button>
            <Button variant={active ? "danger-outline" : "primary"} leftIcon={active ? PowerOff : Power} onClick={() => setStatusOpen(true)}>{active ? "Deactivate" : "Activate"}</Button>
          </>
        }
      />
      {!active ? (
        <Alert tone="warning" className="mb-4" title={d.status === "pending" ? "This distributor is pending activation" : "This distributor is inactive"}>
          It cannot sign in or create new orders. All historical orders, invoices, payments and returns are preserved.{d.statusReason ? ` Reason: ${d.statusReason}` : ""}
        </Alert>
      ) : null}
      <Tabs
        tabs={[
          { id: "overview", label: "Overview", content: overview },
          { id: "summary", label: "Business summary", content: summary },
          { id: "related", label: "Related records", count: s.retailerCount, content: related },
        ]}
        panelClassName="pt-4"
      />
      <StatusChangeDialog distributor={{ id: d.id, name: d.name, status: d.status, liveOrderCount: s.liveOrderCount }} open={statusOpen} onClose={() => setStatusOpen(false)} onChanged={load} />
    </div>
  );
}
