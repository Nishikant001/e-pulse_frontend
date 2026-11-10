import React, { useState, useEffect } from 'react';
import { ArrowLeft, Ban, CircleCheck, Download, Eye, FileText, IndianRupee, Package, Plus } from 'lucide-react';

import Alert from "../../../../../ui/Alert";
import Badge from "../../../../../ui/Badge";
import Button from "../../../../../ui/Button";
import Card, { CardBody, CardHeader } from "../../../../../ui/Card";
import DatePicker from "../../../../../ui/DatePicker";
import FilterBar from "../../../../../ui/FilterBar";
import KpiCard from "../../../../../ui/KpiCard";
import PageHeader from "../../../../../ui/PageHeader";
import Select from "../../../../../ui/Select";
import StatusBadge from "../../../../../ui/StatusBadge";
import { SearchFilter } from "../../../../../forms";
import { useConfirm, useToast } from "../../../../../feedback";
import DataTable from "../../../../../tables/DataTable";
import DetailTable from "../../../../../../features/adminSales/components/DetailTable";
import InfoGrid from "../../../../../../features/adminSales/components/InfoGrid";
import { formatDate, formatINR, formatNumber } from "../../../../../../utils/format";
import { TotalsSummary } from "../../../shared/DocParts";
import { authFetch } from "../../../../../../utils/authFetch";
const api = {
  invoice: {
    getAll() {
      return authFetch("/po-invoice");
    },
    getById(id) {
      return authFetch(`/po-invoice/${id}`);
    },
    create(data) {
      return authFetch("/po-invoice", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    post(id) {
      return authFetch(`/po-invoice/${id}/post`, { method: "POST" });
    },
    cancel(id) {
      return authFetch(`/po-invoice/${id}/cancel`, { method: "POST" });
    },
  },

  delivery: {
    getAll() {
      return authFetch("/po-delivery");
    },
  },
};

const PurchaseInvoiceSystem = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [view, setView] = useState('list');
  const [invoices, setInvoices] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    invoiceDate: new Date().toISOString().split('T')[0],
    deliveryId: '',
    paymentTerms: 'Net 30',
  });

  // Real, authoritative totals for an already-created invoice — read
  // directly from the backend-computed fields (see
  // controllers/purchaseinvoice.controller.js). Never recomputed in React.
  const invoiceTotals = (invoice) => ({
    netValue: Number(invoice?.netValue || 0),
    cgstAmount: Number(invoice?.cgstAmount || 0),
    sgstAmount: Number(invoice?.sgstAmount || 0),
    igstAmount: Number(invoice?.igstAmount || 0),
    totalAmount: Number(invoice?.totalAmount || 0),
  });

  // Calculate ESTIMATED totals from delivery data — used ONLY as a preview
  // before the invoice is created. Once an invoice exists, its own fields
  // (computed authoritatively by the backend) are always used instead.
  // NOTE: this previously read `line.product?.cost_price` (a field that
  // doesn't exist on Product) and `line.quantityDelivered` (the Sales
  // Delivery field name — Purchase Delivery lines use `quantityReceived`),
  // so this preview was always showing ₹0.00 regardless of the real
  // delivery contents. Fixed to use the delivery line's own
  // `pricePerUnit` (now actually persisted — see Phase 4 report) and the
  // correct `quantityReceived` field.
  const calculateTotals = (delivery) => {
    if (!delivery || !delivery.lines) {
      return { totalAmount: 0 };
    }

    const totalAmount = delivery.lines.reduce((sum, line) => {
      const price = Number(line.pricePerUnit) || 0;
      const qty = line.quantityReceived || 0;
      return sum + price * qty;
    }, 0);

    return { totalAmount };
  };

  // Fetch invoices
  const fetchInvoices = async () => {
    setLoading(true);
    try {
    const data = await api.invoice.getAll();
setInvoices(Array.isArray(data) ? data : []);

    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
    setLoading(false);
  };

  // Fetch deliveries (only "Delivered" status)
 const fetchDeliveries = async () => {
  try {
    const [data, invoicesData] = await Promise.all([
      api.delivery.getAll(),
      api.invoice.getAll(),
    ]);
    const invoicedDeliveryIds = new Set(invoicesData.map((inv) => inv.deliveryId));
    const receivedOnly = data.filter(
      (d) => d.status === "Received" && !invoicedDeliveryIds.has(d.id)
    );
    setDeliveries(receivedOnly);
  } catch (error) {
    console.error("Error fetching deliveries:", error);
  }
};


  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (view === 'create') {
      fetchDeliveries();
    }
  }, [view]);

  // Handle delivery selection
  const handleDeliverySelect = (deliveryId) => {
    const delivery = deliveries.find(d => d.id === parseInt(deliveryId));
    if (!delivery) return;
    
    setSelectedDelivery(delivery);
    setFormData({
      invoiceDate: formData.invoiceDate,
      deliveryId: deliveryId,
      paymentTerms: formData.paymentTerms,
    });
  };

  // Create invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    
    if (!formData.deliveryId) {
      toast.error('Please select a delivery', { title: 'Invoice not created' });
      return;
    }

    setLoading(true);

    const payload = {
      deliveryId: parseInt(formData.deliveryId),
      paymentTerms: formData.paymentTerms,
    };

try {
  await api.invoice.create(payload);

  toast.success('Invoice created as a DRAFT. Post it from the invoice list to finalise accounting.');
  setView('list');
  fetchInvoices();
  resetForm();

} catch (error) {
  // Surfaces real backend business errors, e.g. "An invoice already
  // exists for this delivery" or "Delivery has no lines to invoice".
  toast.error(error.message, { title: 'Unable to create the invoice' });
}

    setLoading(false);
  };

  // Post invoice: DRAFT -> POSTED (creates Purchase/Payable accounting entries)
  const handlePostInvoice = async (invoiceId) => {
    if (!(await confirm({ title: 'Post invoice?', message: 'This creates the accounting entries and makes the financial fields immutable.', confirmLabel: 'Post invoice' }))) return;
    setLoading(true);
    try {
      await api.invoice.post(invoiceId);
      toast.success('Invoice posted successfully.');
      fetchInvoices();
      if (selectedInvoice?.id === invoiceId) handleViewInvoice(invoiceId);
    } catch (error) {
      toast.error(error.message, { title: 'Unable to post the invoice' });
    } finally {
      setLoading(false);
    }
  };

  // Cancel invoice (DRAFT only)
  const handleCancelInvoice = async (invoiceId) => {
    if (!(await confirm({ title: 'Cancel draft invoice?', message: 'Cancel this DRAFT invoice?', tone: 'danger', confirmLabel: 'Cancel invoice', cancelLabel: 'Keep invoice' }))) return;
    setLoading(true);
    try {
      await api.invoice.cancel(invoiceId);
      toast.success('Invoice cancelled.');
      fetchInvoices();
    } catch (error) {
      toast.error(error.message, { title: 'Unable to cancel the invoice' });
    } finally {
      setLoading(false);
    }
  };

  // View invoice details
  const handleViewInvoice = async (invoiceId) => {
    setLoading(true);
    try {
      const data = await api.invoice.getById(invoiceId);

      setSelectedInvoice(data);
      setView('detail');
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = (invoice) => {
    const pdfContent = generateInvoicePDF(invoice);
    const blob = new Blob([pdfContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Purchase_Invoice_${invoice.id}_${new Date().getTime()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateInvoicePDF = (invoice) => {
    const lineItems = invoice.lines?.length ? invoice.lines : (invoice.delivery?.lines || []);
    const totals = invoiceTotals(invoice);

    const lineItemsHTML = lineItems.map(line => {
      const lineTotal = line.lineTotal != null
        ? Number(line.lineTotal)
        : (line.quantityReceived || line.quantity || 0) * (line.pricePerUnit || 0);
      return `
      <tr>
        <td>${line.product?.material_code || line.material_code || 'N/A'}</td>
        <td>${line.product?.name || 'N/A'}</td>
        <td style="text-align: right;">${line.quantity || line.quantityReceived || 0}</td>
        <td style="text-align: right;">₹${Number(line.pricePerUnit || 0).toFixed(2)}</td>
        <td style="text-align: right;">₹${lineTotal.toFixed(2)}</td>
      </tr>
    `}).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Invoice ${invoice.invoice_number || invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .totals-section { margin-top: 30px; border-top: 2px solid #333; padding-top: 20px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .total-row.final { font-size: 20px; font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 15px; }
          .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 10px; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PURCHASE INVOICE</h1>
          <p><strong>Invoice #:</strong> ${invoice.invoice_number || invoice.id}</p>
          <p><strong>Status:</strong> ${invoice.status || 'DRAFT'}</p>
          <p><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</p>
        </div>
        
        <div class="info-grid">
          <div>
            <h3>Vendor Information</h3>
            <p><strong>Vendor:</strong> ${invoice.vendor?.name || 'N/A'}</p>
            <p><strong>Delivery ID:</strong> PD-${invoice.deliveryId}</p>
            <p><strong>Order ID:</strong> PO-${invoice.delivery?.orderId || 'N/A'}</p>
          </div>
          <div>
            <h3>Payment Information</h3>
            <p><strong>Payment Terms:</strong> ${invoice.paymentTerms}</p>
            <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'N/A'}</p>
            <p><strong>Outstanding:</strong> ₹${Number(invoice.outstandingAmount || 0).toFixed(2)}</p>
          </div>
        </div>
        
        <div class="section-title">Invoice Line Items</div>
        <table>
          <thead>
            <tr>
              <th>Material Code</th>
              <th>Product</th>
              <th style="text-align: right;">Quantity</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${lineItemsHTML || '<tr><td colspan="5" style="text-align: center;">No line items available</td></tr>'}
          </tbody>
        </table>
        
        <div class="totals-section">
          <div class="total-row">
            <span>Taxable Value:</span>
            <span><strong>₹${totals.netValue.toFixed(2)}</strong></span>
          </div>
          <div class="total-row">
            <span>CGST:</span>
            <span>₹${totals.cgstAmount.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>SGST:</span>
            <span>₹${totals.sgstAmount.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>IGST:</span>
            <span>₹${totals.igstAmount.toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>Total Amount:</span>
            <span>₹${totals.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
          <p>Generated on ${new Date().toLocaleString('en-GB')}</p>
        </div>
      </body>
      </html>
    `;
  };

  const resetForm = () => {
    setFormData({
      invoiceDate: new Date().toISOString().split('T')[0],
      deliveryId: '',
      paymentTerms: 'Net 30',
    });
    setSelectedDelivery(null);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.id?.toString().includes(searchTerm) ||
                         invoice.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const backToList = () => {
    setView('list');
    setSelectedInvoice(null);
    resetForm();
  };
  const backButton = (
    <Button variant="secondary" leftIcon={ArrowLeft} onClick={backToList}>
      Back to invoices
    </Button>
  );
  const invoiceNumberOf = (invoice) => invoice.invoice_number || `PI-${invoice.id}`;

  // RENDER: Invoice List
  if (view === 'list') {
    const totalValue = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);
    const columns = [
      { key: 'invoice', header: 'Invoice ID', sortable: true, accessor: (inv) => invoiceNumberOf(inv), render: (v, inv) => (
        <button type="button" onClick={() => handleViewInvoice(inv.id)} className="font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button>
      ) },
      { key: 'invoiceDate', header: 'Date', sortable: true, accessor: (inv) => inv.invoiceDate, render: (v) => formatDate(v) },
      { key: 'vendor', header: 'Vendor', sortable: true, accessor: (inv) => inv.vendor?.name || 'N/A' },
      { key: 'deliveryId', header: 'Delivery ID', accessor: (inv) => `PD-${inv.deliveryId}` },
      { key: 'paymentTerms', header: 'Payment terms', accessor: (inv) => inv.paymentTerms, render: (v) => (v ? <Badge tone="neutral">{v}</Badge> : <span className="text-ink-subtle">—</span>) },
      { key: 'status', header: 'Status', sortable: true, accessor: (inv) => inv.status || 'DRAFT', render: (v) => <StatusBadge status={v} domain="invoice" /> },
      { key: 'totalAmount', header: 'Total amount', sortable: true, align: 'right', accessor: (inv) => parseFloat(inv.totalAmount || 0), render: (v) => <span className="font-medium tabular-nums">{formatINR(v)}</span> },
    ];
    const rowActions = (inv) => {
      const items = [
        { key: 'view', label: 'View details', icon: Eye, onClick: () => handleViewInvoice(inv.id) },
        { key: 'download', label: 'Download', icon: Download, onClick: () => handleDownloadPDF(inv) },
      ];
      // View only: purchase invoices are issued and posted by your administrator.
      return items;
    };

    return (
      <div>
        <PageHeader
          title="Purchase Invoices"
          description="Invoices issued by your administrator for goods delivered against your purchase orders. View only."
        />

        <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard title="Total invoices" icon={FileText} status="brand" value={formatNumber(invoices.length)} comparison="all purchase invoices" />
          <KpiCard title="Total purchase value" icon={IndianRupee} status="info" value={formatINR(totalValue)} comparison="across all invoices" />
          <KpiCard title="Average invoice value" icon={Package} status="success" value={formatINR(invoices.length > 0 ? totalValue / invoices.length : 0)} comparison="per invoice" />
        </div>

        <FilterBar className="mb-4" activeCount={searchTerm ? 1 : 0} onReset={() => setSearchTerm('')}>
          <SearchFilter label="Search" value={searchTerm} onChange={setSearchTerm} placeholder="Invoice ID or vendor name" />
        </FilterBar>

        <Card>
          <DataTable
            bare
            rowKey="id"
            caption="Purchase invoices"
            columns={columns}
            data={filteredInvoices}
            loading={loading && invoices.length === 0}
            rowActions={rowActions}
            responsive="cards"
            cardTitleKey="invoice"
            emptyIcon={FileText}
            emptyTitle="No invoices found"
            emptyDescription="Create your first invoice from a delivered purchase order."
          />
        </Card>
      </div>
    );
  }

  // RENDER: Create Invoice
  if (view === 'create') {
    const totals = selectedDelivery ? calculateTotals(selectedDelivery) : null;
    const deliveryColumns = [
      { key: 'product', header: 'Product', render: (l) => <span className="font-medium">{l.product?.name || 'N/A'}</span> },
      { key: 'material', header: 'Material code', render: (l) => l.material_code || 'N/A' },
      { key: 'qty', header: 'Qty', align: 'right', render: (l) => formatNumber(l.quantityReceived || 0) },
      { key: 'cost', header: 'Cost', align: 'right', render: (l) => formatINR(l.pricePerUnit) },
      { key: 'total', header: 'Total', align: 'right', render: (l) => <span className="font-medium">{formatINR((l.quantityReceived || 0) * (Number(l.pricePerUnit) || 0))}</span> },
    ];

    return (
      <div>
        <PageHeader
          title="Create purchase invoice"
          description="Select a received purchase delivery to generate its invoice."
          actions={
            <>
              {backButton}
              <Button type="submit" form="pi-form" loading={loading} disabled={!formData.deliveryId || deliveries.length === 0}>
                Create invoice
              </Button>
            </>
          }
        />

        <form id="pi-form" onSubmit={handleCreateInvoice} className="space-y-4">
          <Card>
            <CardHeader title="Invoice details" />
            <CardBody>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DatePicker label="Invoice date" required value={formData.invoiceDate} onChange={(v) => setFormData({ ...formData, invoiceDate: v })} />
                {deliveries.length === 0 ? null : (
                  <Select
                    label="Received purchase delivery"
                    required
                    value={formData.deliveryId}
                    onChange={(e) => handleDeliverySelect(e.target.value)}
                    placeholder="Select delivery"
                    options={deliveries.map((delivery) => ({ value: delivery.id, label: `PD-${delivery.id} | ${delivery.vendor?.name || 'N/A'} | ${formatDate(delivery.deliveryDate)}` }))}
                  />
                )}
                <Select
                  label="Payment terms"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  options={[
                    { value: 'Net 30', label: 'Net 30 days' },
                    { value: 'Net 15', label: 'Net 15 days' },
                    { value: 'Net 60', label: 'Net 60 days' },
                    { value: 'Due on Receipt', label: 'Due on receipt' },
                    { value: 'Cash on Delivery', label: 'Cash on delivery' },
                  ]}
                />
              </div>
              {deliveries.length === 0 ? (
                <Alert tone="warning" title="No received deliveries available" className="mt-4">
                  Only purchase deliveries marked as received (and not yet invoiced) can be invoiced. Make sure the delivery has been received first.
                </Alert>
              ) : null}
            </CardBody>
          </Card>

          {selectedDelivery && totals ? (
            <Card>
              <CardHeader title="Delivery details" subtitle="Review the received items before creating the invoice." />
              <CardBody className="space-y-4">
                <InfoGrid
                  columns="sm:grid-cols-2 lg:grid-cols-4"
                  items={[
                    { label: 'Vendor', value: selectedDelivery.vendor?.name },
                    { label: 'Delivery date', value: formatDate(selectedDelivery.deliveryDate) },
                    { label: 'Order ID', value: `PO-${selectedDelivery.orderId}` },
                    { label: 'Status', value: <Badge tone="success">{selectedDelivery.status}</Badge> },
                  ]}
                />
                {selectedDelivery.lines && selectedDelivery.lines.length > 0 ? <DetailTable caption="Delivery line items" columns={deliveryColumns} rows={selectedDelivery.lines} rowKey="__none" /> : null}
                <Alert tone="info">Estimated total — the backend recalculates the authoritative amount (including tax) when the invoice is created.</Alert>
                <div className="flex justify-end">
                  <TotalsSummary className="w-full sm:max-w-sm" rows={[]} grand={['Total invoice amount', totals.totalAmount]} />
                </div>
              </CardBody>
            </Card>
          ) : null}
        </form>
      </div>
    );
  }

  // RENDER: Invoice Detail View
  if (view === 'detail' && selectedInvoice) {
    const totals = invoiceTotals(selectedInvoice);
    const lineColumns = [
      { key: 'material', header: 'Material code', render: (l) => l.product?.material_code || 'N/A' },
      { key: 'product', header: 'Product', render: (l) => <span className="font-medium">{l.product?.name || 'N/A'}</span> },
      { key: 'quantity', header: 'Quantity', align: 'right', render: (l) => formatNumber(l.quantity || 0) },
      { key: 'price', header: 'Unit price', align: 'right', render: (l) => formatINR(l.pricePerUnit) },
      { key: 'lineTotal', header: 'Line total', align: 'right', render: (l) => <span className="font-medium">{formatINR(l.lineTotal)}</span> },
    ];

    return (
      <div>
        <PageHeader
          title={`Purchase invoice ${invoiceNumberOf(selectedInvoice)}`}
          description="Invoice details, line items and totals."
          meta={<StatusBadge status={selectedInvoice.status || 'DRAFT'} domain="invoice" />}
          actions={
            <>
              {backButton}
              <Button variant="secondary" leftIcon={Download} onClick={() => handleDownloadPDF(selectedInvoice)}>
                Download
              </Button>
            </>
          }
        />

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Vendor information" />
              <CardBody>
                <InfoGrid
                  columns="sm:grid-cols-2"
                  items={[
                    { label: 'Vendor name', value: selectedInvoice.vendor?.name },
                    { label: 'Delivery ID', value: `PD-${selectedInvoice.deliveryId}` },
                    { label: 'Purchase order ID', value: `PO-${selectedInvoice.delivery?.orderId || 'N/A'}` },
                  ]}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Invoice information" />
              <CardBody>
                <InfoGrid
                  columns="sm:grid-cols-2"
                  items={[
                    { label: 'Invoice date', value: formatDate(selectedInvoice.invoiceDate) },
                    { label: 'Delivery date', value: formatDate(selectedInvoice.delivery?.deliveryDate) },
                    { label: 'Payment terms', value: selectedInvoice.paymentTerms ? <Badge tone="neutral">{selectedInvoice.paymentTerms}</Badge> : null },
                  ]}
                />
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Invoice line items" />
            <CardBody className="space-y-4">
              {selectedInvoice.lines && selectedInvoice.lines.length > 0 ? <DetailTable caption="Invoice line items" columns={lineColumns} rows={selectedInvoice.lines} rowKey="__none" /> : <p className="text-body text-ink-muted">No line items available.</p>}
              <div className="flex justify-end">
                <TotalsSummary
                  className="w-full sm:max-w-sm"
                  rows={[
                    ['Taxable value', totals.netValue],
                    ['CGST', totals.cgstAmount],
                    ['SGST', totals.sgstAmount],
                    ['IGST', totals.igstAmount],
                    ['Outstanding', Number(selectedInvoice.outstandingAmount || 0)],
                  ]}
                  grand={['Total invoice amount', totals.totalAmount]}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default PurchaseInvoiceSystem;
