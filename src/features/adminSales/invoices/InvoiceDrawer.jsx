import { useEffect, useState } from "react";
import { Download, Printer } from "lucide-react";
import Button from "../../../components/ui/Button";
import Drawer from "../../../components/ui/Drawer";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import SectionHeader from "../../../components/ui/SectionHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import { formatDate, formatDateTime, formatINR, formatNumber } from "../../../utils/format";
import DetailTable from "../components/DetailTable";
import InfoGrid from "../components/InfoGrid";
import SapBadge from "../components/SapBadge";
import TotalsPanel from "../components/TotalsPanel";
import { useSalesActions } from "../hooks/useSalesActions";
import { downloadTextFile, invoiceToCsv } from "./invoiceCsv";

const stack = (items, render) => (items.length ? items.map((x, i) => <div key={i}>{render(x)}</div>) : <span className="text-ink-subtle">—</span>);

const COLUMNS = [
  { key: "product", header: "Product", render: (l) => <span className="font-medium">{l.product}</span> },
  { key: "sku", header: "SKU" },
  { key: "hsn", header: "HSN" },
  { key: "batch", header: "Batch", render: (l) => stack(l.batches, (b) => `${b.batchNo}${l.batches.length > 1 ? ` (${formatNumber(b.quantity)})` : ""}`) },
  { key: "mfg", header: "MFG", render: (l) => stack(l.batches, (b) => formatDate(b.mfgDate)) },
  { key: "exp", header: "Expiry", render: (l) => stack(l.batches, (b) => formatDate(b.expDate)) },
  { key: "quantity", header: "Qty", align: "right", render: (l) => formatNumber(l.quantity) },
  { key: "mrp", header: "MRP", align: "right", render: (l) => (l.mrp === null ? <span className="text-ink-subtle">—</span> : formatINR(l.mrp)) },
  { key: "dealerPrice", header: "Dealer price", align: "right", render: (l) => formatINR(l.dealerPrice) },
  { key: "discount", header: "Discount", align: "right", render: (l) => `${formatINR(l.discountAmount)}${l.discountPercent ? ` (${l.discountPercent}%)` : ""}` },
  { key: "tax", header: "Tax", align: "right", render: (l) => `${l.gstRate}% · ${formatINR(l.tax)}` },
  { key: "net", header: "Net amount", align: "right", render: (l) => <span className="font-medium">{formatINR(l.net)}</span> },
];

/**
 * InvoiceDrawer — invoice detail (company, retailer, GSTIN, address, payment terms, product table with batch / MFG / expiry / HSN,
 * discount, tax, totals, SAP status) with Print and Download (CSV). Post / Cancel appear only when the backend allows them.
 * Share is not offered: no share mechanism exists in the current application.
 */
export default function InvoiceDrawer({ invoiceId, autoPrint, api, isSample, onClose, onChanged }) {
  const [state, setState] = useState({ status: "loading", data: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!invoiceId) return undefined;
    const controller = new AbortController();
    setState({ status: "loading", data: null });
    Promise.resolve(api.getInvoice(invoiceId, controller.signal))
      .then((data) => (data ? setState({ status: "ready", data }) : setState({ status: "missing", data: null })))
      .catch((error) => error?.name !== "AbortError" && setState({ status: "error", data: null }));
    return () => controller.abort();
  }, [invoiceId, api, attempt]);

  useEffect(() => {
    if (autoPrint && state.status === "ready") {
      const t = setTimeout(() => window.print(), 350);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [autoPrint, state.status]);

  const { request, modal } = useSalesActions({ api, onDone: () => { setAttempt((n) => n + 1); onChanged?.(); } });
  const d = state.data;
  const inv = d?.invoice;
  const can = (a) => inv?.actions.includes(a);
  const liveHint = isSample ? "Sample data is read-only" : undefined;

  return (
    <>
      <Drawer
        open={Boolean(invoiceId)}
        onClose={onClose}
        size="lg"
        title={inv ? `Invoice ${inv.invoiceNumber}` : "Sales invoice"}
        description={inv ? `${inv.company.name} → ${inv.retailerDetails.name}` : undefined}
        footer={
          inv ? (
            <>
              <Button variant="secondary" leftIcon={Printer} onClick={() => window.print()}>Print</Button>
              <Button variant="secondary" leftIcon={Download} onClick={() => downloadTextFile(`${inv.invoiceNumber}.csv`, invoiceToCsv(d))}>Download</Button>
              {can("cancel") ? <Button variant="danger-outline" onClick={() => request("cancel_invoice", inv)} disabled={isSample} title={liveHint}>Cancel invoice</Button> : null}
              {can("post") ? <Button onClick={() => request("post_invoice", inv)} disabled={isSample} title={liveHint}>Post invoice</Button> : null}
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </>
          ) : undefined
        }
      >
        {state.status === "loading" ? <LoadingState label="Loading invoice…" compact /> : null}
        {state.status === "error" ? <ErrorState compact title="Unable to load invoice" message="The invoice could not be loaded." onRetry={() => setAttempt((n) => n + 1)} /> : null}
        {state.status === "missing" ? <ErrorState compact title="Invoice not found" message="It may have been removed." /> : null}
        {d ? (
          <div id="invoice-print" className="space-y-6">
            <section aria-labelledby="inv-head">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 id="inv-head" className="text-section font-semibold text-ink">{inv.company.name}</h3>
                  <p className="text-table text-ink-muted">{[inv.company.address, inv.company.phone].filter(Boolean).join(" · ")}</p>
                  <p className="text-table text-ink-muted">{inv.company.gstin ? `GSTIN ${inv.company.gstin}` : "GSTIN not available"}{inv.company.pan ? ` · PAN ${inv.company.pan}` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-caption uppercase tracking-wide text-ink-subtle">Tax invoice</p>
                  <p className="text-card-title font-semibold text-ink">{inv.invoiceNumber}</p>
                  <StatusBadge status={inv.status} domain="invoice" />
                </div>
              </div>
              <InfoGrid
                items={[
                  { label: "Invoice date", value: formatDate(inv.invoiceDate) },
                  { label: "Due date", value: formatDate(inv.dueDate) },
                  { label: "Payment terms", value: inv.paymentTerms },
                  { label: "Distributor", value: `${inv.distributor.name} (${inv.distributor.code})` },
                  { label: "Retailer", value: inv.retailerDetails.name },
                  { label: "Retailer GSTIN", value: inv.retailerDetails.gstin },
                  { label: "Address", value: inv.retailerDetails.address },
                  { label: "Sales order", value: inv.orderNumber },
                  { label: "Territory", value: inv.territory },
                ]}
              />
            </section>

            <section aria-labelledby="inv-lines">
              <SectionHeader as="h3" title={<span id="inv-lines">Products</span>} />
              <DetailTable caption="Invoice product lines" columns={COLUMNS} rows={d.lines} />
              <div className="mt-4 flex justify-end">
                <TotalsPanel totals={d.totals} className="w-full sm:max-w-sm" />
              </div>
            </section>

            {d.sap ? (
              <section aria-labelledby="inv-sap" className="print-hide">
                <SectionHeader as="h3" title={<span id="inv-sap">SAP sync</span>} description="Status only — nothing is transmitted to SAP yet." />
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
