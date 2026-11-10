import { useEffect, useState } from "react";
import Button from "../../../components/ui/Button";
import Drawer from "../../../components/ui/Drawer";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import SectionHeader from "../../../components/ui/SectionHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import { formatDate, formatDateTime, formatINR, formatNumber } from "../../../utils/format";
import DetailTable from "../components/DetailTable";
import InfoGrid from "../components/InfoGrid";
import OrderTimeline from "../components/OrderTimeline";
import SapBadge from "../components/SapBadge";
import TotalsPanel from "../components/TotalsPanel";
import { useSalesActions } from "../hooks/useSalesActions";

const LINE_COLUMNS = [
  { key: "product", header: "Product", render: (l) => <span className="font-medium">{l.product}</span> },
  { key: "sku", header: "SKU" },
  { key: "batch", header: "Batch", render: (l) => (l.batch ? l.batch.batchNo : <span className="text-ink-subtle">Auto (FEFO)</span>) },
  { key: "expiry", header: "Expiry", render: (l) => (l.batch ? formatDate(l.batch.expDate) : "—") },
  { key: "quantity", header: "Qty", align: "right", render: (l) => formatNumber(l.quantity) },
  { key: "mrp", header: "MRP", align: "right", render: (l) => (l.mrp === null ? <span className="text-ink-subtle">—</span> : formatINR(l.mrp)) },
  { key: "dealerPrice", header: "Price", align: "right", render: (l) => formatINR(l.dealerPrice) },
  { key: "discount", header: "Discount", align: "right", render: (l) => `${l.discountPercent}%` },
  { key: "gst", header: "GST", align: "right", render: (l) => `${l.gstRate}% · ${formatINR(l.tax)}` },
  { key: "net", header: "Net amount", align: "right", render: (l) => <span className="font-medium">{formatINR(l.net)}</span> },
];

/**
 * OrderDrawer — full order detail: information, product lines (backend-calculated), totals, progress + recorded events, SAP.
 * The footer buttons come from the backend's `allowedActions` for this order (confirm / cancel / create invoice — "edit" is not offered since Phase 2).
 */
export default function OrderDrawer({ orderId, api, isSample, onClose, onChanged }) {
  const [state, setState] = useState({ status: "loading", data: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!orderId) return undefined;
    const controller = new AbortController();
    setState({ status: "loading", data: null });
    Promise.resolve(api.getOrder(orderId, controller.signal))
      .then((data) => (data ? setState({ status: "ready", data }) : setState({ status: "missing", data: null })))
      .catch((error) => error?.name !== "AbortError" && setState({ status: "error", data: null }));
    return () => controller.abort();
  }, [orderId, api, attempt]);

  const { request, modal } = useSalesActions({
    api,
    onDone: () => {
      setAttempt((n) => n + 1);
      onChanged?.();
    },
  });

  const d = state.data;
  const o = d?.order;
  const can = (a) => o?.actions.includes(a);
  const liveHint = isSample ? "Sample data is read-only" : undefined;

  return (
    <>
      <Drawer
        open={Boolean(orderId)}
        onClose={onClose}
        size="lg"
        title={o ? `Order ${o.orderNumber}` : "Sales order"}
        description={o ? `${o.distributor.name} → ${o.retailer.name}` : undefined}
        footer={
          o ? (
            <>
              {can("cancel") ? (
                <Button variant="danger-outline" onClick={() => request("cancel", o)} disabled={isSample} title={liveHint}>
                  Cancel order
                </Button>
              ) : null}
              {can("confirm") ? (
                <Button onClick={() => request("confirm", o)} disabled={isSample} title={liveHint}>
                  Confirm
                </Button>
              ) : null}
              {can("create_invoice") ? (
                <Button onClick={() => request("create_invoice", o)} disabled={isSample} title={liveHint}>
                  Create invoice
                </Button>
              ) : null}
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </>
          ) : undefined
        }
      >
        {state.status === "loading" ? <LoadingState label="Loading order…" compact /> : null}
        {state.status === "error" ? <ErrorState compact title="Unable to load order" message="The order details could not be loaded." onRetry={() => setAttempt((n) => n + 1)} /> : null}
        {state.status === "missing" ? <ErrorState compact title="Order not found" message="It may have been deleted." /> : null}
        {d ? (
          <div className="space-y-6">
            <section aria-labelledby="ord-info">
              <SectionHeader as="h3" title={<span id="ord-info">Order information</span>} />
              <InfoGrid
                items={[
                  { label: "Order ID", value: o.orderNumber },
                  { label: "Order date", value: formatDate(o.orderDate) },
                  { label: "Status", value: <StatusBadge status={o.status} domain="salesOrder" /> },
                  { label: "Distributor", value: `${o.distributor.name} (${o.distributor.code})` },
                  { label: "Retailer", value: o.retailer.name },
                  { label: "Territory", value: o.territory },
                  { label: "Payment terms", value: o.paymentTerms },
                  { label: "Scheme", value: o.scheme },
                  { label: "SAP sync", value: <SapBadge status={o.sapStatus} /> },
                  { label: "Distributor GSTIN", value: o.distributorGstin },
                  { label: "Retailer GSTIN", value: o.retailerGstin },
                  { label: "Remarks", value: o.remarks },
                ]}
              />
            </section>

            <section aria-labelledby="ord-lines">
              <SectionHeader as="h3" title={<span id="ord-lines">Product details</span>} description="Values shown are calculated by the backend (pricing service and GST rules)." />
              <DetailTable caption="Order product lines" columns={LINE_COLUMNS} rows={d.lines} />
              <div className="mt-4 flex justify-end">
                <TotalsPanel totals={d.totals} className="w-full sm:max-w-sm" />
              </div>
            </section>

            <section aria-labelledby="ord-time">
              <SectionHeader as="h3" title={<span id="ord-time">Timeline</span>} />
              <OrderTimeline stages={d.stages} events={d.events} cancelled={o.status === "cancelled"} />
            </section>

            {d.deliveries.length ? (
              <section aria-labelledby="ord-del">
                <SectionHeader as="h3" title={<span id="ord-del">Deliveries and invoices</span>} />
                <DetailTable
                  caption="Deliveries and invoices for this order"
                  columns={[
                    { key: "date", header: "Delivery date", render: (x) => formatDate(x.date) },
                    { key: "status", header: "Delivery status" },
                    { key: "quantity", header: "Units", align: "right", render: (x) => formatNumber(x.quantity) },
                    { key: "invoice", header: "Invoice", render: (x) => x.invoiceNumber || <span className="text-ink-subtle">Not invoiced</span> },
                    { key: "invoiceStatus", header: "Invoice status", render: (x) => (x.invoiceStatus ? <StatusBadge status={x.invoiceStatus} domain="invoice" size="sm" /> : "—") },
                  ]}
                  rows={d.deliveries}
                />
              </section>
            ) : null}

            {d.sap ? (
              <section aria-labelledby="ord-sap">
                <SectionHeader as="h3" title={<span id="ord-sap">SAP sync</span>} description="Status only — nothing is transmitted to SAP yet." />
                <InfoGrid columns="sm:grid-cols-2" items={[{ label: "Status", value: <SapBadge status={d.sap.status} /> }, { label: "SAP document", value: d.sap.documentNo }, { label: "Last attempt", value: d.sap.lastAttemptAt ? formatDateTime(d.sap.lastAttemptAt) : null }, { label: "Last error", value: d.sap.lastError }]} />
              </section>
            ) : null}
          </div>
        ) : null}
      </Drawer>
      {modal}
    </>
  );
}
