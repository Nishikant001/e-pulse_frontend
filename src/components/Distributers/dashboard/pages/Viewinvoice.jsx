import { escapeHtml } from '../../../../utils/escapeHtml';
import React, { useState, useEffect } from 'react';
import { Download, Eye, FileText, Pencil, Trash2 } from 'lucide-react';
import Button from "../../../ui/Button";
import Card from "../../../ui/Card";
import DatePicker from "../../../ui/DatePicker";
import Drawer from "../../../ui/Drawer";
import ErrorState from "../../../ui/ErrorState";
import FilterBar from "../../../ui/FilterBar";
import Input, { Textarea } from "../../../ui/Input";
import KpiCard from "../../../ui/KpiCard";
import Modal from "../../../ui/Modal";
import PageHeader from "../../../ui/PageHeader";
import SectionHeader from "../../../ui/SectionHeader";
import { SearchFilter } from "../../../forms";
import { useConfirm, useToast } from "../../../feedback";
import DataTable from "../../../tables/DataTable";
import DetailTable from "../../../../features/adminSales/components/DetailTable";
import InfoGrid from "../../../../features/adminSales/components/InfoGrid";
import { formatINR, formatNumber } from "../../../../utils/format";
import { API_BASE_URL } from "../../../../config/api";

const ViewInvoice = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  
  // Store token in memory instead of localStorage
  const [token] = useState(() => {
    // In a real app, get this from your auth context or props
    return localStorage.getItem("token");
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/invoice`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ title: 'Delete invoice?', message: 'Are you sure you want to delete this invoice?', tone: 'danger', confirmLabel: 'Delete' }))) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/invoice/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete invoice');
      
      setInvoices(invoices.filter(inv => inv.id !== id));
      toast.success('Invoice deleted successfully');
    } catch (err) {
      toast.error(err.message, { title: 'Unable to delete the invoice' });
    }
  };

  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setEditFormData({
      paymentAmount: invoice.paymentAmount || '',
      restPaymentDueDate: invoice.restPaymentDueDate || '',
      placeOfSupply: invoice.placeOfSupply || '',
      vehicleNumber: invoice.vehicleNumber || '',
      receiverDetails: invoice.receiverDetails || '',
      consigneeBilledTo: invoice.consigneeBilledTo || '',
      consigneeShippedTo: invoice.consigneeShippedTo || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_BASE_URL}/invoice/${selectedInvoice.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });
      
      if (!response.ok) throw new Error('Failed to update invoice');
      
      const updatedInvoice = await response.json();
      setInvoices(invoices.map(inv => 
        inv.id === selectedInvoice.id ? updatedInvoice.invoice : inv
      ));
      
      setShowEditModal(false);
      toast.success('Invoice updated successfully');
    } catch (err) {
      toast.error(err.message, { title: 'Unable to update the invoice' });
    }
  };

  const viewInvoiceDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const generatePDF = (invoice) => {
    const printWindow = window.open('', '_blank');
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
          .header h1 { color: #2563eb; font-size: 32px; margin-bottom: 5px; }
          .header p { color: #666; font-size: 14px; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-block { flex: 1; }
          .info-block h3 { color: #2563eb; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; }
          .info-block p { margin: 5px 0; font-size: 13px; line-height: 1.6; }
          .section { margin-bottom: 25px; }
          .section-title { background: #f1f5f9; padding: 10px 15px; font-weight: bold; color: #1e293b; margin-bottom: 15px; border-left: 4px solid #2563eb; }
          .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
          .detail-item { padding: 10px; border-left: 3px solid #e2e8f0; }
          .detail-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
          .detail-value { font-size: 14px; font-weight: 600; color: #1e293b; }
          .amount { color: #16a34a; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #f8fafc; padding: 12px; text-align: left; font-size: 12px; color: #475569; border-bottom: 2px solid #e2e8f0; }
          td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .total-row { background: #f8fafc; font-weight: bold; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
          @media print {
            body { padding: 20px; }
            button { display: none; }
          }
          .print-btn { background: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; margin: 20px auto; display: block; font-size: 14px; }
          .print-btn:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">Print / Download PDF</button>
        
        <div class="header">
          <h1>INVOICE</h1>
          <p>Invoice Number: ${escapeHtml(invoice.invoiceNumber || 'N/A')}</p>
        </div>

        <div class="invoice-info">
          <div class="info-block">
            <h3>Distributor Details</h3>
            <p><strong>${escapeHtml(invoice.distributor?.name || 'N/A')}</strong></p>
            <p>${escapeHtml(invoice.distributor?.email || '')}</p>
            <p>${escapeHtml(invoice.distributor?.phone || '')}</p>
          </div>
          <div class="info-block">
            <h3>Customer Details</h3>
            <p><strong>${escapeHtml(invoice.customer?.name || 'N/A')}</strong></p>
            <p>${escapeHtml(invoice.customer?.email || '')}</p>
            <p>${escapeHtml(invoice.customer?.phone || '')}</p>
          </div>
          <div class="info-block">
            <h3>Invoice Date</h3>
            <p><strong>${formatDate(invoice.invoiceDate)}</strong></p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Payment Information</div>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Total Amount</div>
              <div class="detail-value amount">${formatCurrency(invoice.total)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Payment Amount</div>
              <div class="detail-value">${formatCurrency(invoice.paymentAmount)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Remaining Amount</div>
              <div class="detail-value">${formatCurrency(invoice.restAmount)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Payment Due Date</div>
              <div class="detail-value">${formatDate(invoice.restPaymentDueDate)}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Shipping & Supply Details</div>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Place of Supply</div>
              <div class="detail-value">${escapeHtml(invoice.placeOfSupply || 'N/A')}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Vehicle Number</div>
              <div class="detail-value">${escapeHtml(invoice.vehicleNumber || 'N/A')}</div>
            </div>
          </div>
        </div>

        ${invoice.consigneeBilledTo ? `
        <div class="section">
          <div class="section-title">Consignee (Billed To)</div>
          <div class="detail-item">
            <div class="detail-value">${escapeHtml(invoice.consigneeBilledTo)}</div>
          </div>
        </div>
        ` : ''}

        ${invoice.consigneeShippedTo ? `
        <div class="section">
          <div class="section-title">Consignee (Shipped To)</div>
          <div class="detail-item">
            <div class="detail-value">${escapeHtml(invoice.consigneeShippedTo)}</div>
          </div>
        </div>
        ` : ''}

        ${invoice.receiverDetails ? `
        <div class="section">
          <div class="section-title">Receiver Details</div>
          <div class="detail-item">
            <div class="detail-value">${escapeHtml(invoice.receiverDetails)}</div>
          </div>
        </div>
        ` : ''}

        ${invoice.salesOrder?.lines && invoice.salesOrder.lines.length > 0 ? `
        <div class="section">
          <div class="section-title">Order Line Items</div>
          <table>
            <thead>
              <tr>
                <th>Item/Product</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Net Value</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.salesOrder.lines.map(line => `
                <tr>
                  <td>${escapeHtml(line.productId || 'N/A')}</td>
                  <td style="text-align: center;">${line.quantity || 0}</td>
                  <td style="text-align: right;">${formatCurrency(line.unitPrice || 0)}</td>
                  <td style="text-align: right;">${formatCurrency(line.lineNetValue)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">Total:</td>
                <td style="text-align: right;">${formatCurrency(invoice.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(pdfContent);
    printWindow.document.close();
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.distributor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (error) {
    return (
      <div>
        <PageHeader title="Invoice Management" description="View and manage all your invoices." />
        <Card>
          <ErrorState title="Error loading invoices" message={error} onRetry={fetchInvoices} retryLabel="Try again" />
        </Card>
      </div>
    );
  }

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice #', sortable: true, accessor: (inv) => inv.invoiceNumber || 'N/A', render: (v, inv) => (
      <button type="button" onClick={() => viewInvoiceDetails(inv)} className="font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button>
    ) },
    { key: 'customer', header: 'Customer', sortable: true, accessor: (inv) => inv.customer?.name || 'N/A', render: (v, inv) => (
      <>
        <span className="block">{v}</span>
        {inv.customer?.email ? <span className="block text-caption text-ink-subtle">{inv.customer.email}</span> : null}
      </>
    ) },
    { key: 'distributor', header: 'Distributor', sortable: true, accessor: (inv) => inv.distributor?.name || 'N/A' },
    { key: 'invoiceDate', header: 'Date', sortable: true, accessor: (inv) => inv.invoiceDate, render: (v) => formatDate(v) },
    { key: 'total', header: 'Total', sortable: true, align: 'right', accessor: (inv) => Number(inv.total || 0), render: (v) => <span className="font-medium tabular-nums">{formatINR(v)}</span> },
    { key: 'restAmount', header: 'Remaining', sortable: true, align: 'right', accessor: (inv) => Number(inv.restAmount || 0), render: (v) => <span className="tabular-nums text-warning-700">{formatINR(v)}</span> },
  ];
  const rowActions = (inv) => [
    { key: 'view', label: 'View details', icon: Eye, onClick: () => viewInvoiceDetails(inv) },
    { key: 'download', label: 'Download PDF', icon: Download, onClick: () => generatePDF(inv) },
    { key: 'edit', label: 'Edit', icon: Pencil, onClick: () => handleEdit(inv) },
    { key: 'sep', divider: true },
    { key: 'delete', label: 'Delete', icon: Trash2, danger: true, onClick: () => handleDelete(inv.id) },
  ];
  const setEdit = (k) => (v) => setEditFormData((d) => ({ ...d, [k]: v }));
  const closeDetail = () => setShowDetailModal(false);
  const detail = selectedInvoice;
  const orderLines = detail?.salesOrder?.lines || [];
  const orderLineColumns = [
    { key: 'product', header: 'Item / product', render: (l) => l.productId || 'N/A' },
    { key: 'quantity', header: 'Quantity', align: 'right', render: (l) => formatNumber(l.quantity || 0) },
    { key: 'unitPrice', header: 'Unit price', align: 'right', render: (l) => formatINR(l.unitPrice || 0) },
    { key: 'net', header: 'Net value', align: 'right', render: (l) => <span className="font-medium">{formatINR(l.lineNetValue)}</span> },
  ];
  const party = (p) => (p?.name ? <>{p.name}{p.email ? <span className="block text-caption text-ink-subtle">{p.email}</span> : null}</> : null);
  const multiline = (t) => (t ? <span className="whitespace-pre-line">{t}</span> : null);

  return (
    <div>
      <PageHeader title="Invoice Management" description="View and manage all your invoices." />

      <div className="mb-4 max-w-xs">
        <KpiCard title="Total invoices" icon={FileText} status="brand" loading={loading} value={formatNumber(invoices.length)} comparison="all invoices" />
      </div>

      <FilterBar className="mb-4" activeCount={searchTerm ? 1 : 0} onReset={() => setSearchTerm('')}>
        <SearchFilter label="Search" value={searchTerm} onChange={setSearchTerm} placeholder="Invoice number, customer or distributor" className="w-full sm:w-96" />
      </FilterBar>

      <Card>
        <DataTable
          bare
          rowKey="id"
          caption="Invoices"
          columns={columns}
          data={filteredInvoices}
          loading={loading}
          rowActions={rowActions}
          responsive="cards"
          cardTitleKey="invoiceNumber"
          emptyIcon={FileText}
          emptyTitle="No invoices found"
          emptyDescription="Try adjusting your search criteria."
        />
      </Card>

      <Drawer
        open={showDetailModal && Boolean(detail)}
        onClose={closeDetail}
        size="lg"
        title={detail ? `Invoice ${detail.invoiceNumber || ''}` : 'Invoice'}
        description={detail?.customer?.name || undefined}
        footer={
          detail ? (
            <>
              <Button variant="secondary" leftIcon={Download} onClick={() => generatePDF(detail)}>Download PDF</Button>
              <Button variant="ghost" onClick={closeDetail}>Close</Button>
            </>
          ) : undefined
        }
      >
        {detail ? (
          <div className="space-y-6">
            <section>
              <SectionHeader as="h3" title="Invoice information" />
              <InfoGrid items={[
                { label: 'Invoice number', value: detail.invoiceNumber },
                { label: 'Invoice date', value: formatDate(detail.invoiceDate) },
                { label: 'Created at', value: formatDate(detail.createdAt) },
              ]} />
            </section>
            <section>
              <SectionHeader as="h3" title="Payment information" />
              <InfoGrid columns="sm:grid-cols-2" items={[
                { label: 'Total amount', value: <span className="text-card-title font-semibold">{formatCurrency(detail.total)}</span> },
                { label: 'Payment amount', value: formatCurrency(detail.paymentAmount) },
                { label: 'Remaining amount', value: <span className="font-medium text-warning-700">{formatCurrency(detail.restAmount)}</span> },
                { label: 'Payment due date', value: formatDate(detail.restPaymentDueDate) },
              ]} />
            </section>
            <section>
              <SectionHeader as="h3" title="Party information" />
              <InfoGrid columns="sm:grid-cols-2" items={[
                { label: 'Customer', value: party(detail.customer) },
                { label: 'Distributor', value: party(detail.distributor) },
              ]} />
            </section>
            <section>
              <SectionHeader as="h3" title="Shipping & supply details" />
              <InfoGrid columns="sm:grid-cols-2" items={[
                { label: 'Place of supply', value: detail.placeOfSupply },
                { label: 'Vehicle number', value: detail.vehicleNumber },
                { label: 'Billed to', value: multiline(detail.consigneeBilledTo) },
                { label: 'Shipped to', value: multiline(detail.consigneeShippedTo) },
                { label: 'Receiver', value: multiline(detail.receiverDetails) },
              ]} />
            </section>
            {orderLines.length > 0 ? (
              <section>
                <SectionHeader as="h3" title="Order line items" />
                <DetailTable caption="Order line items" columns={orderLineColumns} rows={orderLines} rowKey="__none" />
                <p className="mt-3 text-right text-body font-semibold text-ink">Total: {formatCurrency(detail.total)}</p>
              </section>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={showEditModal && Boolean(detail)}
        onClose={() => setShowEditModal(false)}
        size="lg"
        title="Edit invoice"
        description={detail?.invoiceNumber || undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" form="invoice-edit-form">Update invoice</Button>
          </>
        }
      >
        <form id="invoice-edit-form" onSubmit={handleUpdateInvoice} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Payment amount" type="number" step="0.01" value={editFormData.paymentAmount ?? ''} onChange={(e) => setEdit('paymentAmount')(e.target.value)} />
            <DatePicker label="Payment due date" value={editFormData.restPaymentDueDate ?? ''} onChange={setEdit('restPaymentDueDate')} />
            <Input label="Place of supply" value={editFormData.placeOfSupply ?? ''} onChange={(e) => setEdit('placeOfSupply')(e.target.value)} />
            <Input label="Vehicle number" value={editFormData.vehicleNumber ?? ''} onChange={(e) => setEdit('vehicleNumber')(e.target.value)} />
          </div>
          <Textarea label="Receiver details" rows={3} value={editFormData.receiverDetails ?? ''} onChange={(e) => setEdit('receiverDetails')(e.target.value)} />
          <Textarea label="Consignee (billed to)" rows={3} value={editFormData.consigneeBilledTo ?? ''} onChange={(e) => setEdit('consigneeBilledTo')(e.target.value)} />
          <Textarea label="Consignee (shipped to)" rows={3} value={editFormData.consigneeShippedTo ?? ''} onChange={(e) => setEdit('consigneeShippedTo')(e.target.value)} />
        </form>
      </Modal>
    </div>
  );
};

export default ViewInvoice;
