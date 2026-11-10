import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Truck } from "lucide-react";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import LoadingState from "../../../components/ui/LoadingState";
import DataTable from "../../../components/tables/DataTable";
import { formatDate, formatINR, formatNumber } from "../../../utils/format";
import { adminPurchaseOrdersApi as api } from "../api/purchaseOrdersApi";

const Row = ({ label, children }) => (
  <div><dt className="text-caption text-ink-subtle">{label}</dt><dd className="text-body text-ink">{children || <span className="text-ink-subtle">—</span>}</dd></div>
);

/** Deliver goods against the PO. Posting this adds the quantities to the distributor's stock (batch-wise). */
function ReceiveGoodsCard({ po, onDone }) {
  const pending = po.lines.filter((l) => l.remainingQuantity > 0);
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [remarks, setRemarks] = useState("");
  const [rows, setRows] = useState(() => Object.fromEntries(pending.map((l) => [l.id, { qty: String(l.remainingQuantity), batchNo: "", mfgDate: "", expDate: "" }])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (id, key, value) => setRows((r) => ({ ...r, [id]: { ...r[id], [key]: value } }));

  const submit = async () => {
    const lines = pending
      .map((l) => ({ l, r: rows[l.id] }))
      .filter(({ r }) => Number(r.qty) > 0)
      .map(({ l, r }) => ({ orderLineId: l.id, quantityReceived: Number(r.qty), batchNo: r.batchNo.trim(), mfgDate: r.mfgDate || undefined, expDate: r.expDate || undefined }));
    if (!lines.length) return setError("Enter a quantity for at least one item.");
    setBusy(true);
    setError("");
    try {
      await api.deliver(po.id, { deliveryDate, remarks: remarks.trim() || undefined, lines });
      onDone("Delivery posted. The quantities were added to the distributor's stock.");
    } catch (e) {
      setError(e?.message || "Unable to post the delivery.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Deliver goods" subtitle="Posting a delivery adds the quantities to the distributor's stock, batch by batch." />
      <CardBody>
        <div className="space-y-4">
          {error ? <Alert tone="error" title="Delivery not posted">{error}</Alert> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Delivery date" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
            <Input label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
          {pending.map((l) => (
            <fieldset key={l.id} className="rounded-card border border-line p-4">
              <legend className="px-1 text-caption font-medium text-ink-subtle">{l.materialCode} · {l.productName || "Product"} · pending {formatNumber(l.remainingQuantity)}</legend>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Input label="Quantity" type="number" min="0" max={l.remainingQuantity} value={rows[l.id].qty} onChange={(e) => set(l.id, "qty", e.target.value)} />
                <Input label="Batch number" value={rows[l.id].batchNo} onChange={(e) => set(l.id, "batchNo", e.target.value)} hint="Existing batch numbers are reused" />
                <Input label="Manufacturing date" type="date" value={rows[l.id].mfgDate} onChange={(e) => set(l.id, "mfgDate", e.target.value)} />
                <Input label="Expiry date" type="date" value={rows[l.id].expDate} onChange={(e) => set(l.id, "expDate", e.target.value)} hint="Required for a new batch" />
              </div>
            </fieldset>
          ))}
          <div className="flex justify-end"><Button leftIcon={Truck} onClick={submit} loading={busy}>Post delivery</Button></div>
        </div>
      </CardBody>
    </Card>
  );
}

/** One distributor purchase order: header, distributor, items with receiving progress, deliveries and totals. The admin delivers and invoices it here. */
export default function AdminPurchaseOrderDetailPage() {
  const { id } = useParams();
  const [state, setState] = useState({ status: "loading", data: null, error: "" });
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [invoicing, setInvoicing] = useState(null);
  useEffect(() => {
    const c = new AbortController();
    if (reloadKey === 0) setState({ status: "loading", data: null, error: "" });
    api.get(id, c.signal).then((data) => setState({ status: "ready", data, error: "" }))
      .catch((e) => { if (e?.name !== "AbortError") setState({ status: "error", data: null, error: e?.status === 404 ? "This purchase order was not found." : e?.message || "Unable to load this purchase order." }); });
    return () => c.abort();
  }, [id, reloadKey]);

  const done = (message) => { setNotice(message); setActionError(""); setReloadKey((k) => k + 1); };
  const createInvoice = async (deliveryId) => {
    setInvoicing(deliveryId);
    setActionError("");
    try {
      const out = await api.invoice(id, deliveryId);
      done(`Invoice ${out.invoiceNumber} created and posted to the distributor's accounts.`);
    } catch (e) {
      setActionError(e?.message || "Unable to create the invoice.");
    } finally {
      setInvoicing(null);
    }
  };

  const lineColumns = useMemo(() => [
    { key: "materialCode", header: "Code", accessor: (l) => l.materialCode },
    { key: "productName", header: "Product", accessor: (l) => l.productName, render: (v) => v || "—" },
    { key: "quantity", header: "Ordered", align: "right", accessor: (l) => l.quantity, render: (v) => formatNumber(v) },
    { key: "receivedQuantity", header: "Received", align: "right", accessor: (l) => l.receivedQuantity, render: (v) => formatNumber(v) },
    { key: "remainingQuantity", header: "Pending", align: "right", accessor: (l) => l.remainingQuantity, render: (v) => formatNumber(v) },
    { key: "pricePerUnit", header: "Rate", align: "right", accessor: (l) => l.pricePerUnit, render: (v) => formatINR(v) },
    { key: "lineNetValue", header: "Net value", align: "right", accessor: (l) => l.lineNetValue, render: (v) => <span className="font-medium tabular-nums">{formatINR(v)}</span> },
  ], []);

  const back = <Button as={Link} to="/admin/purchase-orders" variant="secondary" leftIcon={ArrowLeft}>Back to purchase orders</Button>;
  if (state.status === "loading") return <LoadingState label="Loading purchase order…" />;
  if (state.status === "error") return (<div className="space-y-4"><Alert tone="error" title="Purchase order unavailable">{state.error}</Alert>{back}</div>);

  const po = state.data;
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Purchase order ${po.orderNumber}`}
        description="Created by the distributor. You deliver the goods and invoice them here."
        meta={<StatusBadge status={po.status} domain="purchaseOrder" />}
        actions={back}
      />
      {notice ? <Alert tone="success" onClose={() => setNotice("")}>{notice}</Alert> : null}
      {actionError ? <Alert tone="error" title="Action failed" onClose={() => setActionError("")}>{actionError}</Alert> : null}
      {po.status === "DRAFT" ? <Alert tone="info" title="Waiting for the distributor">This order is still a draft. You can deliver it once the distributor confirms it.</Alert> : null}
      <Card>
        <CardHeader title="Order" />
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Row label="Order date">{formatDate(po.orderDate)}</Row>
            <Row label="Payment method">{po.paymentMethod}</Row>
            <Row label="Created">{formatDate(po.createdAt)}</Row>
            <Row label="Vendor">{po.vendor ? `${po.vendor.name} (${po.vendor.code})` : "None — sent to administrator"}</Row>
            <div className="sm:col-span-2 lg:col-span-4"><Row label="Notes">{po.description}</Row></div>
          </dl>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Distributor" />
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Row label="Name">{po.distributor?.name}</Row>
            <Row label="Code">{po.distributor?.code}</Row>
            <Row label="Email">{po.distributor?.email}</Row>
            <Row label="Phone">{po.distributor?.phone}</Row>
            <Row label="City">{po.distributor?.city}</Row>
            <Row label="State">{po.distributor?.state}</Row>
            <Row label="Status">{po.distributor?.status}</Row>
          </dl>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Items" subtitle="Received quantities come from the deliveries you post below." />
        <DataTable bare rowKey="id" caption="Items" columns={lineColumns} data={po.lines} emptyTitle="No items" />
        <CardBody>
          <dl className="ml-auto grid max-w-sm gap-1 text-body">
            {[["Net value", po.totals.netValue], ["CGST", po.totals.cgst], ["SGST", po.totals.sgst], ["IGST", po.totals.igst]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt className="text-ink-muted">{k}</dt><dd className="tabular-nums">{formatINR(v)}</dd></div>
            ))}
            <div className="flex justify-between border-t border-line pt-1 font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatINR(po.totals.total)}</dd></div>
            <p className="pt-1 text-caption text-ink-subtle">Tax shown here is indicative; the final tax is set when you invoice the delivery.</p>
          </dl>
        </CardBody>
      </Card>
      {po.canReceive ? <ReceiveGoodsCard key={po.deliveries.length} po={po} onDone={done} /> : null}
      <Card>
        <CardHeader title="Deliveries" />
        <DataTable bare rowKey="id" caption="Deliveries" columns={[
          { key: "id", header: "Delivery", accessor: (d) => `#${d.id}` },
          { key: "deliveryDate", header: "Date", accessor: (d) => d.deliveryDate, render: (v) => formatDate(v) },
          { key: "status", header: "Status", accessor: (d) => d.status, render: (v) => <StatusBadge status={v} domain="delivery" /> },
          { key: "remarks", header: "Remarks", accessor: (d) => d.remarks, render: (v) => v || "—" },
          { key: "invoice", header: "Invoice", accessor: (d) => d.invoice?.number || "", render: (v, d) => (
            d.invoice
              ? <span className="inline-flex items-center gap-2">{d.invoice.number}<StatusBadge status={d.invoice.status} domain="invoice" /></span>
              : d.status === "Cancelled"
                ? "—"
                : <Button size="sm" variant="secondary" leftIcon={FileText} loading={invoicing === d.id} onClick={() => createInvoice(d.id)}>Create invoice</Button>
          ) },
        ]} data={po.deliveries} emptyTitle="No deliveries yet" emptyDescription="Nothing has been delivered against this order yet." />
      </Card>
    </div>
  );
}
