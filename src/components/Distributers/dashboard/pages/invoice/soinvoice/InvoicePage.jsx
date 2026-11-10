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
      return authFetch("/sales-invoice");
    },
    getById(id) {
      return authFetch(`/sales-invoice/${id}`);
    },
    create(data) {
      return authFetch("/sales-invoice", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    post(id) {
      return authFetch(`/sales-invoice/${id}/post`, { method: "POST" });
    },
    cancel(id) {
      return authFetch(`/sales-invoice/${id}/cancel`, { method: "POST" });
    },
  },

  delivery: {
    getAll() {
      return authFetch("/sales-delivery");
    },
  },

  salesOrder: {
    getById(id) {
      return authFetch(`/salesorder/${id}`);
    },
  },
};

const SalesInvoiceSystem = () => {
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
  // controllers/salesinvoice.controller.js). Never recomputed in React.
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
  const calculateTotals = (delivery) => {
    if (!delivery || !delivery.lines) {
      return {
        netValue: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalAmount: 0
      };
    }

    // Calculate net value from delivery lines
    const netValue = delivery.lines.reduce((sum, line) => {
      return sum + ((line.quantityDelivered || 0) * (line.pricePerUnit || 0));
    }, 0);

    // Get tax rates from order details
    const orderDetails = delivery.orderDetails || delivery.order || {};
    const cgstRate = parseFloat(orderDetails.cgst || 0);
    const sgstRate = parseFloat(orderDetails.sgst || 0);
    const igstRate = parseFloat(orderDetails.igst || 0);

    // Calculate tax amounts
    const cgstAmount = (netValue * cgstRate) / 100;
    const sgstAmount = (netValue * sgstRate) / 100;
    const igstAmount = (netValue * igstRate) / 100;

    // Calculate total amount
    const totalAmount = netValue + cgstAmount + sgstAmount + igstAmount;

    return {
      netValue,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      cgstRate,
      sgstRate,
      igstRate
    };
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

  // Fetch deliveries (only "Delivered" status, excluding those already invoiced)
  const fetchDeliveries = async () => {
  try {
    const deliveriesData = await api.delivery.getAll();
    const invoicedDeliveryIds = new Set(invoices.map((inv) => inv.deliveryId));

    const deliveredOnly = await Promise.all(
      deliveriesData
        .filter(d => d.status === "Delivered" && !invoicedDeliveryIds.has(d.id))
        .map(async (delivery) => {
          if (delivery.orderId) {
            const orderData = await api.salesOrder.getById(delivery.orderId);
            return { ...delivery, orderDetails: orderData };
          }
          return delivery;
        })
    );

    setDeliveries(deliveredOnly);
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
      // Surfaces real backend business errors, e.g. "This delivery has
      // already been invoiced" or "Delivery has no lines to invoice".
      toast.error(error.message, { title: 'Unable to create the invoice' });
      console.error('Request error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Post invoice: DRAFT -> POSTED (creates AR/Sales/GST accounting entries)
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
      console.error('Post invoice error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cancel invoice (DRAFT only — posted invoices need a credit note, a
  // later phase per the Phase 3 brief)
  const handleCancelInvoice = async (invoiceId) => {
    if (!(await confirm({ title: 'Cancel draft invoice?', message: 'Cancel this DRAFT invoice?', tone: 'danger', confirmLabel: 'Cancel invoice', cancelLabel: 'Keep invoice' }))) return;
    setLoading(true);
    try {
      await api.invoice.cancel(invoiceId);
      toast.success('Invoice cancelled.');
      fetchInvoices();
    } catch (error) {
      toast.error(error.message, { title: 'Unable to cancel the invoice' });
      console.error('Cancel invoice error:', error);
    } finally {
      setLoading(false);
    }
  };

  // View invoice details
  const handleViewInvoice = async (invoiceId) => {
    setLoading(true);
    try {
      const deliveryData = await api.invoice.getById(invoiceId);

      
      // Fetch the associated sales order details if not already loaded
     if (deliveryData.delivery?.orderId && !deliveryData.delivery.orderDetails) {
  const orderData = await api.salesOrder.getById(
    deliveryData.delivery.orderId
  );
  deliveryData.delivery.orderDetails = orderData;
}

      
      setSelectedInvoice(deliveryData);
      setView('detail');
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error(error.message, { title: 'Unable to load the invoice' });
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
    link.download = `Invoice_${invoice.id}_${new Date().getTime()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateInvoicePDF = (invoice) => {
    const lineItems = invoice.lines?.length ? invoice.lines : (invoice.delivery?.lines || []);
    const totals = invoiceTotals(invoice);
    
    const lineItemsHTML = lineItems.map(line => {
      const lineTotal = line.lineTotal != null
        ? Number(line.lineTotal)
        : (line.quantityDelivered || line.quantity || 0) * (line.pricePerUnit || 0);
      return `
      <tr>
        <td>${line.product?.material_code || line.material_code || 'N/A'}</td>
        <td>${line.product?.name || 'N/A'}</td>
        <td style="text-align: right;">${line.quantity || line.quantityDelivered || 0}</td>
        <td style="text-align: right;">₹${Number(line.pricePerUnit || 0).toFixed(2)}</td>
        <td style="text-align: right;">₹${lineTotal.toFixed(2)}</td>
      </tr>
    `}).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoice_number || invoice.id}</title>
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
          <h1>SALES INVOICE</h1>
          <p><strong>Invoice #:</strong> ${invoice.invoice_number || invoice.id}</p>
          <p><strong>Status:</strong> ${invoice.status || 'DRAFT'}</p>
          <p><strong>Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</p>
        </div>
        
        <div class="info-grid">
          <div>
            <h3>Billing Information</h3>
            <p><strong>Customer:</strong> ${invoice.customer?.name || invoice.delivery?.order?.customer?.name || 'N/A'}</p>
            <p><strong>Delivery ID:</strong> DEL-${invoice.deliveryId}</p>
            <p><strong>Order ID:</strong> ORD-${invoice.delivery?.orderId || 'N/A'}</p>
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
              <th style="text-align: right;">Price per Unit</th>
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
                         invoice.delivery?.order?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
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
  const invoiceNumberOf = (invoice) => invoice.invoice_number || `INV-${invoice.id}`;
  const customerNameOf = (invoice) => invoice.customer?.name || invoice.delivery?.order?.customer?.name || 'N/A';

  // RENDER: Invoice List
  if (view === 'list') {
    const totalValue = invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || 0), 0);
    const columns = [
      { key: 'invoice', header: 'Invoice ID', sortable: true, accessor: (inv) => invoiceNumberOf(inv), render: (v, inv) => (
        <button type="button" onClick={() => handleViewInvoice(inv.id)} className="font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button>
      ) },
      { key: 'invoiceDate', header: 'Date', sortable: true, accessor: (inv) => inv.invoiceDate, render: (v) => formatDate(v) },
      { key: 'customer', header: 'Customer', sortable: true, accessor: (inv) => customerNameOf(inv) },
      { key: 'deliveryId', header: 'Delivery ID', accessor: (inv) => `DEL-${inv.deliveryId}` },
      { key: 'paymentTerms', header: 'Payment terms', accessor: (inv) => inv.paymentTerms, render: (v) => (v ? <Badge tone="neutral">{v}</Badge> : <span className="text-ink-subtle">—</span>) },
      { key: 'status', header: 'Status', sortable: true, accessor: (inv) => inv.status || 'DRAFT', render: (v) => <StatusBadge status={v} domain="invoice" /> },
      { key: 'totalAmount', header: 'Total amount', sortable: true, align: 'right', accessor: (inv) => parseFloat(inv.totalAmount || 0), render: (v) => <span className="font-medium tabular-nums">{formatINR(v)}</span> },
    ];
    const rowActions = (inv) => {
      const items = [
        { key: 'view', label: 'View details', icon: Eye, onClick: () => handleViewInvoice(inv.id) },
        { key: 'download', label: 'Download', icon: Download, onClick: () => handleDownloadPDF(inv) },
      ];
      if (inv.status === 'DRAFT') {
        items.push(
          { key: 'post', label: 'Post invoice', icon: CircleCheck, disabled: loading, hint: 'Creates the accounting entries', onClick: () => handlePostInvoice(inv.id) },
          { key: 'sep', divider: true },
          { key: 'cancel', label: 'Cancel draft', icon: Ban, danger: true, disabled: loading, onClick: () => handleCancelInvoice(inv.id) },
        );
      }
      return items;
    };

    return (
      <div>
        <PageHeader
          title="Sales Invoices"
          description="Manage and create invoices from delivered orders."
          actions={<Button leftIcon={Plus} onClick={() => setView('create')}>Create invoice</Button>}
        />

        <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard title="Total invoices" icon={FileText} status="brand" value={formatNumber(invoices.length)} comparison="all sales invoices" />
          <KpiCard title="Total revenue" icon={IndianRupee} status="success" value={formatINR(totalValue)} comparison="across all invoices" />
          <KpiCard title="Average invoice value" icon={Package} status="info" value={formatINR(invoices.length > 0 ? totalValue / invoices.length : 0)} comparison="per invoice" />
        </div>

        <FilterBar className="mb-4" activeCount={searchTerm ? 1 : 0} onReset={() => setSearchTerm('')}>
          <SearchFilter label="Search" value={searchTerm} onChange={setSearchTerm} placeholder="Invoice ID or customer name" />
        </FilterBar>

        <Card>
          <DataTable
            bare
            rowKey="id"
            caption="Sales invoices"
            columns={columns}
            data={filteredInvoices}
            loading={loading && invoices.length === 0}
            rowActions={rowActions}
            responsive="cards"
            cardTitleKey="invoice"
            emptyIcon={FileText}
            emptyTitle="No invoices found"
            emptyDescription="Create your first invoice from a delivered order."
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
      { key: 'qty', header: 'Qty', align: 'right', render: (l) => formatNumber(l.quantityDelivered || 0) },
      { key: 'price', header: 'Price', align: 'right', render: (l) => formatINR(l.pricePerUnit) },
      { key: 'total', header: 'Total', align: 'right', render: (l) => <span className="font-medium">{formatINR((l.quantityDelivered || 0) * (l.pricePerUnit || 0))}</span> },
    ];

    return (
      <div>
        <PageHeader
          title="Create sales invoice"
          description="Select a delivered order to generate its invoice."
          actions={
            <>
              {backButton}
              <Button type="submit" form="si-form" loading={loading} disabled={!formData.deliveryId || deliveries.length === 0}>
                Create invoice
              </Button>
            </>
          }
        />

        <form id="si-form" onSubmit={handleCreateInvoice} className="space-y-4">
          <Card>
            <CardHeader title="Invoice details" />
            <CardBody>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DatePicker label="Invoice date" required value={formData.invoiceDate} onChange={(v) => setFormData({ ...formData, invoiceDate: v })} />
                {deliveries.length === 0 ? null : (
                  <Select
                    label="Delivered order"
                    required
                    value={formData.deliveryId}
                    onChange={(e) => handleDeliverySelect(e.target.value)}
                    placeholder="Select delivery"
                    options={deliveries.map((delivery) => ({ value: delivery.id, label: `DEL-${delivery.id} | ${delivery.order?.customer?.name || delivery.orderDetails?.customerName || 'N/A'} | ${formatDate(delivery.deliveryDate)}` }))}
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
                <Alert tone="warning" title="No delivered orders available" className="mt-4">
                  Only orders with a delivered status can be invoiced. Make sure the order has been marked as delivered first.
                </Alert>
              ) : null}
            </CardBody>
          </Card>

          {selectedDelivery && totals ? (
            <Card>
              <CardHeader title="Delivery details" subtitle="Review the delivered items before creating the invoice." />
              <CardBody className="space-y-4">
                <InfoGrid
                  columns="sm:grid-cols-2 lg:grid-cols-4"
                  items={[
                    { label: 'Customer', value: selectedDelivery.order?.customer?.name || selectedDelivery.orderDetails?.customerName },
                    { label: 'Delivery date', value: formatDate(selectedDelivery.deliveryDate) },
                    { label: 'Order ID', value: `ORD-${selectedDelivery.orderId}` },
                    { label: 'Status', value: <Badge tone="success">{selectedDelivery.status}</Badge> },
                  ]}
                />
                {selectedDelivery.lines && selectedDelivery.lines.length > 0 ? <DetailTable caption="Delivery line items" columns={deliveryColumns} rows={selectedDelivery.lines} rowKey="__none" /> : null}
                <Alert tone="info">Estimated totals — the backend recalculates the authoritative amounts (price, tax) when the invoice is created.</Alert>
                <div className="flex justify-end">
                  <TotalsSummary
                    className="w-full sm:max-w-sm"
                    rows={[
                      ['Net value', totals.netValue],
                      ['CGST', totals.cgstAmount],
                      [`SGST (${totals.sgstRate || 0}%)`, totals.sgstAmount],
                      [`IGST (${totals.igstRate || 0}%)`, totals.igstAmount],
                    ]}
                    grand={['Total invoice amount', totals.totalAmount]}
                  />
                </div>
              </CardBody>
            </Card>
          ) : null}
        </form>
      </div>
    );
  }

  // RENDER: Invoice Detail
  if (view === 'detail' && selectedInvoice) {
    const totals = invoiceTotals(selectedInvoice);
    const lineColumns = [
      { key: 'material', header: 'Material code', render: (l) => l.product?.material_code || 'N/A' },
      { key: 'product', header: 'Product', render: (l) => <span className="font-medium">{l.product?.name || 'N/A'}</span> },
      { key: 'quantity', header: 'Quantity', align: 'right', render: (l) => formatNumber(l.quantity || 0) },
      { key: 'price', header: 'Price per unit', align: 'right', render: (l) => formatINR(l.pricePerUnit) },
      { key: 'lineTotal', header: 'Line total', align: 'right', render: (l) => <span className="font-medium">{formatINR(l.lineTotal)}</span> },
    ];

    return (
      <div>
        <PageHeader
          title={`Sales invoice ${invoiceNumberOf(selectedInvoice)}`}
          description="Invoice details, line items and totals."
          meta={<StatusBadge status={selectedInvoice.status || 'DRAFT'} domain="invoice" />}
          actions={
            <>
              {backButton}
              <Button variant="secondary" leftIcon={Download} onClick={() => handleDownloadPDF(selectedInvoice)}>
                Download
              </Button>
              {selectedInvoice.status === 'DRAFT' ? (
                <Button leftIcon={CircleCheck} onClick={() => handlePostInvoice(selectedInvoice.id)} loading={loading}>
                  Post invoice
                </Button>
              ) : null}
            </>
          }
        />

        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Invoice information" />
              <CardBody>
                <InfoGrid
                  columns="sm:grid-cols-2"
                  items={[
                    { label: 'Invoice date', value: formatDate(selectedInvoice.invoiceDate) },
                    { label: 'Payment terms', value: selectedInvoice.paymentTerms ? <Badge tone="neutral">{selectedInvoice.paymentTerms}</Badge> : null },
                    { label: 'Delivery ID', value: `DEL-${selectedInvoice.deliveryId}` },
                  ]}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Customer information" />
              <CardBody>
                <InfoGrid
                  columns="sm:grid-cols-2"
                  items={[
                    { label: 'Customer name', value: customerNameOf(selectedInvoice) },
                    { label: 'Order ID', value: `ORD-${selectedInvoice.delivery?.orderId || 'N/A'}` },
                    { label: 'Delivery date', value: formatDate(selectedInvoice.delivery?.deliveryDate) },
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

export default SalesInvoiceSystem;
