import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Drawer from "../../../components/ui/Drawer";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import SectionHeader from "../../../components/ui/SectionHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import { formatDate, formatDateTime, formatINR, formatNumber } from "../../../utils/format";
import InfoGrid from "../components/InfoGrid";
import SapBadge from "../components/SapBadge";

/** SecondaryDrawer — one secondary-sale record (invoice line × batch): batch, dates, quantity, prices, scheme, discount, GST, net value, SAP. */
export default function SecondaryDrawer({ recordKey, api, onClose }) {
  const [state, setState] = useState({ status: "loading", data: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!recordKey) return undefined;
    const controller = new AbortController();
    setState({ status: "loading", data: null });
    Promise.resolve(api.getSecondary(recordKey, controller.signal))
      .then((data) => (data ? setState({ status: "ready", data }) : setState({ status: "missing", data: null })))
      .catch((error) => error?.name !== "AbortError" && setState({ status: "error", data: null }));
    return () => controller.abort();
  }, [recordKey, api, attempt]);

  const r = state.data?.record;
  const sap = state.data?.sap;
  return (
    <Drawer
      open={Boolean(recordKey)}
      onClose={onClose}
      title={r ? `${r.invoiceNumber} · ${r.product}` : "Secondary sale"}
      description={r ? `${r.distributor.name} → ${r.retailer.name}` : undefined}
      footer={
        <>
          {r ? <Button as={Link} to={`/admin/sales/invoices?invoice=${r.invoiceId}`} variant="secondary">View invoice</Button> : null}
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </>
      }
    >
      {state.status === "loading" ? <LoadingState label="Loading record…" compact /> : null}
      {state.status === "error" ? <ErrorState compact title="Unable to load record" message="The record could not be loaded." onRetry={() => setAttempt((n) => n + 1)} /> : null}
      {state.status === "missing" ? <ErrorState compact title="Record not found" message="The invoice may have been cancelled." /> : null}
      {r ? (
        <div className="space-y-6">
          <section aria-labelledby="sec-inv">
            <SectionHeader as="h3" title={<span id="sec-inv">Sale</span>} />
            <InfoGrid
              items={[
                { label: "Invoice", value: r.invoiceNumber },
                { label: "Date", value: formatDate(r.invoiceDate) },
                { label: "Invoice status", value: <StatusBadge status={r.invoiceStatus} domain="invoice" size="sm" /> },
                { label: "Distributor", value: `${r.distributor.name} (${r.distributor.code})` },
                { label: "Retailer", value: r.retailer.name },
                { label: "Territory", value: r.territory },
                { label: "Sales order", value: r.orderNumber },
                { label: "Payment terms", value: r.paymentTerms },
                { label: "SAP status", value: <SapBadge status={r.sapStatus} /> },
              ]}
            />
          </section>
          <section aria-labelledby="sec-prod">
            <SectionHeader as="h3" title={<span id="sec-prod">Product and batch</span>} />
            <InfoGrid
              items={[
                { label: "Product", value: r.product },
                { label: "SKU", value: r.sku },
                { label: "HSN", value: r.hsn },
                { label: "Category", value: r.category },
                { label: "Batch", value: r.batchNo },
                { label: "Manufacturing date", value: formatDate(r.mfgDate) },
                { label: "Expiry date", value: formatDate(r.expiryDate) },
                { label: "Quantity", value: formatNumber(r.quantity) },
              ]}
            />
          </section>
          <section aria-labelledby="sec-val">
            <SectionHeader as="h3" title={<span id="sec-val">Value</span>} description="Shares of an invoice line fulfilled from several batches are split by allocated quantity." />
            <InfoGrid
              items={[
                { label: "MRP", value: r.mrp === null ? null : formatINR(r.mrp) },
                { label: "Dealer price", value: formatINR(r.dealerPrice) },
                { label: "Scheme", value: r.scheme },
                { label: "Gross value", value: formatINR(r.grossValue) },
                { label: "Discount", value: `${formatINR(r.discountAmount)}${r.discountPercent ? ` (${r.discountPercent}%)` : ""}` },
                { label: "Net value (before GST)", value: formatINR(r.netValue) },
                { label: "CGST", value: formatINR(r.cgst) },
                { label: "SGST", value: formatINR(r.sgst) },
                { label: "IGST", value: formatINR(r.igst) },
                { label: "GST total", value: formatINR(r.gst) },
              ]}
            />
          </section>
          {sap ? (
            <section aria-labelledby="sec-sap">
              <SectionHeader as="h3" title={<span id="sec-sap">SAP sync</span>} description="Status only — nothing is transmitted to SAP yet." />
              <InfoGrid columns="sm:grid-cols-2" items={[{ label: "Status", value: <SapBadge status={sap.status} /> }, { label: "SAP document", value: sap.documentNo }, { label: "Last attempt", value: sap.lastAttemptAt ? formatDateTime(sap.lastAttemptAt) : null }, { label: "Last error", value: sap.lastError }]} />
            </section>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
