import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CloudUpload, Download, Eye, FileCheck2, Printer, RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useDateRange } from "../../../components/layout/dateRangeContext";
import { useToast } from "../../../components/feedback";
import DataTable from "../../../components/tables/DataTable";
import { formatDate, formatINR, formatNumber } from "../../../utils/format";
import { salesErrorMessage } from "../api/salesErrors";
import SalesFilterBar from "../components/SalesFilterBar";
import SapBadge from "../components/SapBadge";
import { SampleBanner, SourceSwitch } from "../components/SourceControls";
import { useSalesActions } from "../hooks/useSalesActions";
import { useSalesList } from "../hooks/useSalesList";
import { useSalesScreen } from "../hooks/useSalesScreen";
import InvoiceDrawer from "./InvoiceDrawer";
import { downloadTextFile, invoiceToCsv } from "./invoiceCsv";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "posted", label: "Posted" },
  { value: "partially_paid", label: "Partially paid" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];
const FIELDS = ["search", "date", "distributor", "retailer", "territory", "status", "sap"];
const EMPTY_FILTERS = { q: "", distributorId: "", retailer: "", territory: "", status: "", sap: "" };

/** SalesInvoicesPage — /admin/sales/invoices. Server-side filtering, search, sorting and pagination. */
export default function SalesInvoicesPage() {
  const { source, setSource, api, lookups, expire, isSample } = useSalesScreen();
  const { range } = useDateRange();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const apiFilters = useMemo(() => ({ ...filters, from: range.from, to: range.to }), [filters, range.from, range.to]);
  const list = useSalesList({ fetcher: api.listInvoices, filters: apiFilters, defaultSort: { key: "invoice_date", dir: "desc" }, onUnauthorized: expire });
  const { request, modal } = useSalesActions({ api, onDone: list.reload });

  const openId = params.get("invoice");
  const autoPrint = params.get("print") === "1";
  const open = (id, print = false) => setParams(print ? { invoice: String(id), print: "1" } : { invoice: String(id) });
  const close = () => setParams({});

  const download = async (row) => {
    try {
      const detail = await api.getInvoice(row.id);
      downloadTextFile(`${row.invoiceNumber}.csv`, invoiceToCsv(detail));
    } catch (error) {
      toast.error(salesErrorMessage(error, "Unable to download the invoice."), { title: "Download failed" });
    }
  };

  const columns = [
    { key: "invoice_number", header: "Invoice No", sortable: true, accessor: (r) => r.invoiceNumber, render: (v, r) => <button type="button" onClick={() => open(r.id)} className="font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button> },
    { key: "invoice_date", header: "Invoice date", sortable: true, accessor: (r) => r.invoiceDate, render: (v) => formatDate(v) },
    { key: "distributor_name", header: "Distributor", sortable: true, accessor: (r) => r.distributor.name, render: (v, r) => (<><span className="block">{v}</span><span className="block text-caption text-ink-subtle">{r.distributor.code}</span></>) },
    { key: "retailer_name", header: "Retailer", sortable: true, accessor: (r) => r.retailer.name },
    { key: "product_count", header: "Products", sortable: true, align: "right", accessor: (r) => r.productCount },
    { key: "quantity", header: "Quantity", sortable: true, align: "right", accessor: (r) => r.quantity, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
    { key: "invoice_value", header: "Invoice value", sortable: true, align: "right", accessor: (r) => r.invoiceValue, render: (v) => <span className="tabular-nums">{formatINR(v)}</span> },
    { key: "payment_terms", header: "Payment terms", accessor: (r) => r.paymentTerms },
    { key: "status", header: "Status", sortable: true, accessor: (r) => r.status, render: (v) => <StatusBadge status={v} domain="invoice" /> },
    { key: "sap", header: "SAP sync", accessor: (r) => r.sapStatus, render: (v) => <SapBadge status={v} /> },
  ];

  const rowActions = (row) => {
    const liveOnly = isSample ? "Live only" : undefined;
    const items = [
      { key: "view", label: "View", icon: Eye, onClick: () => open(row.id) },
      { key: "print", label: "Print", icon: Printer, onClick: () => open(row.id, true) },
      { key: "download", label: "Download (CSV)", icon: Download, onClick: () => download(row) },
      { key: "sap", label: "SAP sync status", icon: CloudUpload, onClick: () => open(row.id) },
    ];
    if (row.actions.includes("post")) items.push({ key: "sep", divider: true }, { key: "post", label: "Post invoice", icon: FileCheck2, disabled: isSample, hint: liveOnly, onClick: () => request("post_invoice", row) });
    if (row.actions.includes("cancel")) items.push({ key: "cancel", label: "Cancel invoice", danger: true, disabled: isSample, hint: liveOnly, onClick: () => request("cancel_invoice", row) });
    return items;
  };

  return (
    <div>
      <PageHeader
        title="Sales Invoices"
        description="Invoices issued by distributors to retailers. Posting an invoice creates its accounting entries."
        actions={
          <>
            <SourceSwitch source={source} onChange={setSource} />
            <IconButton icon={RefreshCw} label="Refresh invoices" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
          </>
        }
      />
      {isSample ? <SampleBanner /> : null}

      <SalesFilterBar fields={FIELDS} filters={filters} onChange={setFilters} lookups={lookups} statusOptions={STATUS_OPTIONS} searchPlaceholder="Invoice, order, distributor, retailer, SAP no." />

      <Card>
        <DataTable
          bare
          manual
          rowKey="id"
          caption="Sales invoices"
          columns={columns}
          data={list.data?.items || []}
          loading={list.status === "loading"}
          error={list.status === "error" ? "Unable to load invoices. Please try again." : null}
          onRetry={list.reload}
          page={list.page}
          pageSize={list.pageSize}
          total={list.data?.total ?? 0}
          onPageChange={list.setPage}
          onPageSizeChange={list.setPageSize}
          sort={list.sort}
          onSortChange={list.setSort}
          rowActions={rowActions}
          responsive="cards"
          cardTitleKey="invoice_number"
          emptyTitle="No sales invoices found"
          emptyDescription="Try changing the filters or the date range."
        />
      </Card>

      <InvoiceDrawer invoiceId={openId} autoPrint={autoPrint} api={api} isSample={isSample} onClose={close} onChanged={list.reload} />
      {modal}
    </div>
  );
}
