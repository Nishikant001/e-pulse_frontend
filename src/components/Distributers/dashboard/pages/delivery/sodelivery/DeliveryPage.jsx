import { escapeHtml } from "../../../../../../utils/escapeHtml";
import React, { useState, useEffect } from 'react';
import { Ban, Download, Eye, FileText, Package, Pencil, Plus, Printer, Save, Search } from 'lucide-react';
import Alert from "../../../../../ui/Alert";
import Badge from "../../../../../ui/Badge";
import Button from "../../../../../ui/Button";
import Card, { CardBody, CardHeader } from "../../../../../ui/Card";
import ConfirmationModal from "../../../../../ui/ConfirmationModal";
import DatePicker from "../../../../../ui/DatePicker";
import Drawer from "../../../../../ui/Drawer";
import Input, { Textarea } from "../../../../../ui/Input";
import Modal from "../../../../../ui/Modal";
import PageHeader from "../../../../../ui/PageHeader";
import SectionHeader from "../../../../../ui/SectionHeader";
import Select from "../../../../../ui/Select";
import StatusBadge from "../../../../../ui/StatusBadge";
import Tabs from "../../../../../ui/Tabs";
import { useToast } from "../../../../../feedback";
import DataTable from "../../../../../tables/DataTable";
import DetailTable from "../../../../../../features/adminSales/components/DetailTable";
import InfoGrid from "../../../../../../features/adminSales/components/InfoGrid";
import { formatDate, formatINR, formatNumber } from "../../../../../../utils/format";
import { TotalsSummary } from "../../../shared/DocParts";

// // Mock token - replace with actual auth token
// const AUTH_TOKEN = localStorage.getItem("token");
import { authFetch } from "../../../../../../utils/authFetch";
import { API_BASE_URL } from "../../../../../../config/api";
const api = {
  salesOrder: {
    async getByNumber(orderNumber) {
      return authFetch(`/salesorder/by-number/${orderNumber}`);
    },
  },

  delivery: {
    async getAll() {
      return authFetch("/sales-delivery");
    },

    async getById(id) {
      return authFetch(`/sales-delivery/${id}`);
    },

    async create(data) {
      return authFetch("/sales-delivery", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async update(id, data) {
      return authFetch(`/sales-delivery/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    async delete(id) {
      return authFetch(`/sales-delivery/${id}`, {
        method: "DELETE",
      });
    },
  },
};


const DeliveryManagement = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('create');
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    order_number: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    remarks: '',
    lines: []
  });
  
  const [editData, setEditData] = useState({
    deliveryDate: '',
    remarks: '',
    status: 'Pending'
  });
  
  const [orderDetails, setOrderDetails] = useState(null);
  const [batchStock, setBatchStock] = useState([]); // Phase 2 StockLedger-backed batch availability
  const [manualBatch, setManualBatch] = useState({}); // orderLineId -> batchId (optional override; blank = automatic FEFO)

  // Fetch order details when order_number changes
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!formData.order_number || formData.order_number.length < 1) {
        setOrderDetails(null);
        setFormData(prev => ({ ...prev, lines: [] })); // Clear lines when no order number
        return;
      }

      setOrderLoading(true);
      try {
        const data = await api.salesOrder.getByNumber(formData.order_number);
        setOrderDetails(data);

        // Initialize delivery lines from order lines, using the backend's
        // authoritative delivered/remaining quantities (Phase 3) rather
        // than assuming nothing has been delivered yet.
        const initialLines = data.lines?.map(line => ({
          orderLineId: line.id,
          productId: line.productId,
          productName: line.product?.name || 'Unknown Product',
          materialCode: line.material_code || 'N/A',
          orderedQty: line.quantity || 0,
          deliveredQty: line.deliveredQuantity ?? 0,
          quantityDelivered: 0,
          maxQty: line.remainingQuantity ?? line.quantity ?? 0,
          pricePerUnit: line.pricePerUnit || 0,
          lineNetValue: line.lineNetValue || 0,
        })) || [];

        setFormData(prev => ({ ...prev, lines: initialLines }));

        if (!["CONFIRMED", "PARTIALLY_DELIVERED"].includes(data.status)) {
          showNotification(
            `This order is ${data.status || "DRAFT"} and cannot be delivered. It must be CONFIRMED first.`,
            'error'
          );
        } else {
          showNotification('Order details loaded successfully', 'success');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setOrderDetails(null);
        setFormData(prev => ({ ...prev, lines: [] }));
        showNotification(error.message || 'Order not found', 'error');
      } finally {
        setOrderLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchOrderDetails, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.order_number]);

  // Real available-stock-per-batch data (Phase 2 StockLedger), used to
  // populate valid batch choices and preview FEFO — never recomputed
  // independently in React; the backend is always the source of truth for
  // which batches actually get consumed.
  useEffect(() => {
    authFetch("/stockLedger/batch")
      .then((data) => setBatchStock(Array.isArray(data) ? data : []))
      .catch(() => setBatchStock([]));
  }, []);

  const getValidBatchesForProduct = (productId) =>
    batchStock
      .filter((b) => b.productId === productId && !b.isExpired && !b.isOutOfStock && b.quantity > 0)
      .sort((a, b) => (a.expDate || '').localeCompare(b.expDate || ''));

  // Client-side FEFO PREVIEW only — for display while the user is typing a
  // quantity, so they can see roughly how it would be allocated. The
  // backend (services/inventory.service.js) is the only place that
  // actually performs FEFO allocation and StockLedger posting.
  const previewFefoAllocation = (productId, quantity) => {
    const validBatches = getValidBatchesForProduct(productId);
    let remaining = quantity;
    const allocation = [];
    for (const b of validBatches) {
      if (remaining <= 0) break;
      const take = Math.min(b.quantity, remaining);
      if (take > 0) {
        allocation.push({ batchNo: b.batchNo, qty: take, expDate: b.expDate });
        remaining -= take;
      }
    }
    return { allocation, shortfall: remaining };
  };

  // Fetch all deliveries
  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const data = await api.delivery.getAll();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      showNotification(error.message || 'Failed to fetch deliveries', 'error');
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };
  

  // Fetch single delivery with order details
  const fetchDeliveryDetails = async (id) => {
  setLoading(true);
  try {
    const deliveryData = await api.delivery.getById(id);

    if (deliveryData.order_number) {
      const orderData = await api.salesOrder.getByNumber(
        deliveryData.order_number
      );
      deliveryData.orderDetails = orderData;
    }

    setSelectedDelivery(deliveryData);
  } catch (error) {
    showNotification(error.message || "Failed to fetch delivery details", "error");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (activeTab === 'list') {
      fetchDeliveries();
    }
  }, [activeTab]);

  const showNotification = (message, type = 'info') => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else toast.info(message);
  };

  const handleSubmit = async () => {
    const validLines = formData.lines.filter(line => line.quantityDelivered > 0);
    if (validLines.length === 0) {
      showNotification('Please enter at least one delivery quantity', 'error');
      return;
    }

    setLoading(true);
    try {
      const linesPayload = validLines.map((line) => ({
        orderLineId: line.orderLineId,
        quantityDelivered: line.quantityDelivered,
        // Optional manual batch override; omit entirely for automatic FEFO.
        ...(manualBatch[line.orderLineId] ? { batchId: Number(manualBatch[line.orderLineId]) } : {}),
      }));

      await api.delivery.create({
        order_number: formData.order_number,
        deliveryDate: formData.deliveryDate,
        remarks: formData.remarks,
        lines: linesPayload,
      });

      showNotification('Delivery created successfully', 'success');
      setFormData({
        order_number: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        remarks: '',
        lines: []
      });
      setOrderDetails(null);
      setManualBatch({});
      setActiveTab('list');
      fetchDeliveries();
    } catch (error) {
      console.error('Error creating delivery:', error);
      // Surfaces the backend's actual business error, e.g. "Delivery
      // quantity exceeds remaining order quantity" or "Insufficient stock
      // in batch X: available Y, requested Z".
      showNotification(error.message || 'Error creating delivery', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await api.delivery.update(selectedDelivery.id, editData);
      showNotification('Delivery updated successfully', 'success');
      setShowEditModal(false);
      fetchDeliveries();
    } catch (error) {
      console.error('Error updating delivery:', error);
      showNotification(error.message || 'Failed to update delivery', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delivery.delete(selectedDelivery.id);
      showNotification('Delivery cancelled successfully', 'success');
      setShowDeleteModal(false);
      fetchDeliveries();
    } catch (error) {
      console.error('Error cancelling delivery:', error);
      showNotification(error.message || 'Failed to cancel delivery', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (delivery) => {
    await fetchDeliveryDetails(delivery.id);
    setShowViewModal(true);
  };

  const handleEdit = async (delivery) => {
    await fetchDeliveryDetails(delivery.id);
    setEditData({
      deliveryDate: delivery.deliveryDate ? String(delivery.deliveryDate).split('T')[0] : '',
      remarks: delivery.remarks || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDeleteModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const downloadDeliveryNote = (delivery) => {
    const content = generateDeliveryNote(delivery);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Delivery_Note_${delivery.id}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Delivery note downloaded', 'success');
  };

  const generateDeliveryNote = (delivery) => {
    const orderDetails = delivery.orderDetails || {};
    const lines = delivery.lines?.map((line, idx) => 
      `${(idx + 1).toString().padStart(3, '0')}  ${line.material_code?.padEnd(15, ' ')}  ${line.product?.name?.padEnd(30, ' ')}  ${line.quantityDelivered.toString().padStart(8, ' ')}`
    ).join('\n') || '';

    return `
═══════════════════════════════════════════════════════════════════════════
                          DELIVERY NOTE
═══════════════════════════════════════════════════════════════════════════

Delivery Number : ${delivery.id}
Order Reference : ${delivery.order_number}
Delivery Date   : ${new Date(delivery.deliveryDate).toLocaleDateString()}
Status          : ${delivery.status || 'Pending'}

───────────────────────────────────────────────────────────────────────────
Customer Information
───────────────────────────────────────────────────────────────────────────
Customer Name   : ${delivery.order?.customer?.name || orderDetails.customerName || 'N/A'}
Address         : ${orderDetails.address || 'N/A'}
Payment Method  : ${orderDetails.paymentMethod || 'N/A'}

───────────────────────────────────────────────────────────────────────────
Delivery Items
───────────────────────────────────────────────────────────────────────────
Pos  Material Code   Product Name                   Quantity Delivered
───────────────────────────────────────────────────────────────────────────
${lines}
───────────────────────────────────────────────────────────────────────────

Total Items     : ${delivery.lines?.length || 0}
Total Quantity  : ${delivery.lines?.reduce((sum, l) => sum + (l.quantityDelivered || 0), 0) || 0}

───────────────────────────────────────────────────────────────────────────
Financial Summary
───────────────────────────────────────────────────────────────────────────
Net Value       : ${formatCurrency(orderDetails.netValue)}
CGST (${orderDetails.cgst || 0}%)      : ${formatCurrency(orderDetails.cgstAmount)}
SGST (${orderDetails.sgst || 0}%)      : ${formatCurrency(orderDetails.sgstAmount)}
IGST (${orderDetails.igst || 0}%)      : ${formatCurrency(orderDetails.igstAmount)}
───────────────────────────────────────────────────────────────────────────
Total Amount    : ${formatCurrency(orderDetails.totalAmount)}
═══════════════════════════════════════════════════════════════════════════

Remarks         : ${delivery.remarks || 'None'}

═══════════════════════════════════════════════════════════════════════════
Generated on ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════════════════
    `.trim();
  };

  const printDeliveryNote = (delivery) => {
    const content = generateDeliveryNote(delivery);
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Delivery Note ${delivery.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; white-space: pre; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>${escapeHtml(content)}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const updateLineQuantity = (index, value) => {
    const newLines = [...formData.lines];
    const qty = parseInt(value) || 0;
    newLines[index].quantityDelivered = Math.min(qty, newLines[index].maxQty);
    setFormData({ ...formData, lines: newLines });
  };

  const CAN_DELIVER = ["CONFIRMED", "PARTIALLY_DELIVERED"];
  const orderOk = Boolean(orderDetails) && CAN_DELIVER.includes(orderDetails.status);
  const resetCreate = () => {
    setFormData({ order_number: '', deliveryDate: new Date().toISOString().split('T')[0], remarks: '', lines: [] });
    setOrderDetails(null);
  };

  const lineColumns = [
    { key: 'item', header: 'Item', render: (l) => <span className="font-mono text-ink-muted">{String(l._index + 1).padStart(3, '0')}</span> },
    { key: 'material', header: 'Material', render: (l) => <span className="font-mono">{l.materialCode}</span> },
    { key: 'desc', header: 'Description', render: (l) => <span className="font-medium">{l.productName}</span> },
    { key: 'ordered', header: 'Order qty', align: 'right', render: (l) => formatNumber(l.orderedQty) },
    { key: 'delivered', header: 'Delivered', align: 'right', render: (l) => <span className="text-success-700">{formatNumber(l.deliveredQty)}</span> },
    { key: 'remaining', header: 'Remaining', align: 'right', render: (l) => <span className="font-medium text-warning-700">{formatNumber(l.maxQty)}</span> },
    {
      key: 'batch',
      header: 'Batch',
      render: (l) => (
        <Select
          size="sm"
          aria-label={`Batch for ${l.productName}`}
          value={manualBatch[l.orderLineId] || ''}
          onChange={(e) => setManualBatch((prev) => ({ ...prev, [l.orderLineId]: e.target.value }))}
          placeholder="Auto (FEFO)"
          wrapperClassName="w-56"
          options={getValidBatchesForProduct(l.productId).map((b) => ({ value: b.batchId, label: `${b.batchNo} — ${b.quantity} avail${b.expDate ? ` — exp ${formatDate(b.expDate)}` : ''}` }))}
        />
      ),
    },
    {
      key: 'qty',
      header: 'Delivery qty',
      align: 'right',
      render: (l) => (
        <Input type="number" min="0" max={l.maxQty} aria-label={`Delivery quantity for ${l.productName}`} value={l.quantityDelivered} onChange={(e) => updateLineQuantity(l._index, e.target.value)} wrapperClassName="ml-auto w-28" className="text-right" />
      ),
    },
  ];
  const indexedLines = formData.lines.map((l, i) => ({ ...l, _index: i }));

  const listColumns = [
    { key: 'id', header: 'Delivery', sortable: true, render: (v, d) => (
      <button type="button" onClick={() => handleView(d)} className="font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button>
    ) },
    { key: 'order_number', header: 'Order ref', sortable: true },
    { key: 'customer', header: 'Customer', sortable: true, accessor: (d) => d.order?.customer?.name || 'N/A' },
    { key: 'deliveryDate', header: 'Delivery date', sortable: true, render: (v) => formatDate(v) },
    { key: 'status', header: 'Status', sortable: true, render: (v) => <StatusBadge status={v} domain="delivery" /> },
    { key: 'items', header: 'Items', align: 'right', accessor: (d) => d.lines?.length || 0 },
  ];
  const listActions = (d) => {
    const items = [{ key: 'view', label: 'View details', icon: Eye, onClick: () => handleView(d) }];
    if (d.status !== 'Cancelled') items.push({ key: 'edit', label: 'Edit', icon: Pencil, onClick: () => handleEdit(d) });
    items.push(
      { key: 'download', label: 'Download', icon: Download, onClick: () => downloadDeliveryNote(d) },
      { key: 'print', label: 'Print', icon: Printer, onClick: () => printDeliveryNote(d) },
    );
    if (d.status !== 'Cancelled') items.push({ key: 'sep', divider: true }, { key: 'cancel', label: 'Cancel delivery', icon: Ban, danger: true, hint: 'Reverses the stock', onClick: () => handleDeleteClick(d) });
    return items;
  };

  const viewLines = (selectedDelivery?.lines || []).map((l, i) => ({ ...l, _index: i }));
  const viewColumns = [
    { key: 'item', header: 'Item', render: (l) => <span className="font-mono text-ink-muted">{String(l._index + 1).padStart(3, '0')}</span> },
    { key: 'material', header: 'Material', render: (l) => <span className="font-mono">{l.material_code || 'N/A'}</span> },
    { key: 'desc', header: 'Description', render: (l) => <span className="font-medium">{l.product?.name || 'Unknown'}</span> },
    { key: 'qty', header: 'Quantity', align: 'right', render: (l) => formatNumber(l.quantityDelivered) },
    { key: 'price', header: 'Price/unit', align: 'right', render: (l) => formatINR(l.pricePerUnit) },
    { key: 'value', header: 'Line value', align: 'right', render: (l) => <span className="font-medium">{formatINR(l.quantityDelivered * l.pricePerUnit)}</span> },
  ];
  const viewTotalQty = selectedDelivery?.lines?.reduce((sum, line) => sum + line.quantityDelivered, 0) || 0;
  const viewTotalValue = selectedDelivery?.lines?.reduce((sum, line) => sum + line.quantityDelivered * line.pricePerUnit, 0) || 0;
  const od = selectedDelivery?.orderDetails;

  const createTab = (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader title="Create outbound delivery" subtitle="Enter a confirmed sales order number to load its items." />
        <CardBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Sales order number"
              required
              leftIcon={Search}
              value={formData.order_number}
              onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
              placeholder="Enter order number"
              hint={orderLoading ? 'Looking up the order…' : undefined}
            />
            <DatePicker label="Planned delivery date" required value={formData.deliveryDate} onChange={(v) => setFormData({ ...formData, deliveryDate: v })} />
          </div>

          {orderDetails ? (
            <div className="space-y-4">
              <div className="rounded-card border border-line bg-surface-muted p-4">
                <p className="mb-3 text-body font-semibold text-ink">Sales order</p>
                <InfoGrid
                  columns="sm:grid-cols-2 lg:grid-cols-4"
                  items={[
                    { label: 'Sold-to party', value: orderDetails.customerName || 'N/A' },
                    { label: 'Order date', value: formatDate(orderDetails.orderDate) },
                    { label: 'Items', value: formatNumber(orderDetails.lines?.length || 0) },
                    { label: 'Order status', value: <Badge tone={orderOk ? 'success' : 'error'}>{orderDetails.status || 'DRAFT'}</Badge> },
                  ]}
                />
              </div>
              <div className="flex justify-end">
                <TotalsSummary
                  className="w-full sm:max-w-sm"
                  rows={[
                    ['Net value', Number(orderDetails.netValue || 0)],
                    [`CGST (${orderDetails.cgst || 0}%)`, Number(orderDetails.cgstAmount || 0)],
                    [`SGST (${orderDetails.sgst || 0}%)`, Number(orderDetails.sgstAmount || 0)],
                    [`IGST (${orderDetails.igst || 0}%)`, Number(orderDetails.igstAmount || 0)],
                  ]}
                  grand={['Total amount', Number(orderDetails.totalAmount || 0)]}
                />
              </div>
            </div>
          ) : null}

          {orderDetails && !orderOk ? (
            <Alert tone="error">Order status is {orderDetails.status || 'DRAFT'} — it must be CONFIRMED before it can be delivered.</Alert>
          ) : null}

          <Textarea label="Delivery text / remarks" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} rows={2} placeholder="Enter remarks or special instructions…" />
        </CardBody>
      </Card>

      {formData.lines.length > 0 ? (
        <Card>
          <CardHeader title="Delivery items" subtitle="Leave the batch on “Auto (FEFO)” to deliver from the earliest-expiring stock." />
          <CardBody className="space-y-3">
            <DetailTable caption="Delivery items" columns={lineColumns} rows={indexedLines} rowKey="_index" />
            {indexedLines.map((line) => {
              if (manualBatch[line.orderLineId] || !(line.quantityDelivered > 0)) return null;
              const { allocation, shortfall } = previewFefoAllocation(line.productId, line.quantityDelivered);
              return (
                <Alert key={line.orderLineId} tone={shortfall > 0 ? 'warning' : 'info'} title={`FEFO preview — ${line.productName}`}>
                  {allocation.length === 0 ? 'No stock available for this product.' : allocation.map((a) => `${a.batchNo} × ${a.qty}`).join(', ')}
                  {shortfall > 0 ? ` — insufficient stock (short by ${shortfall})` : ''}
                  <span className="mt-1 block text-caption text-ink-subtle">Actual allocation is decided by the backend at the moment of delivery; this is only a preview.</span>
                </Alert>
              );
            })}
          </CardBody>
        </Card>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={resetCreate}>Cancel</Button>
        <Button leftIcon={Save} onClick={handleSubmit} loading={loading} disabled={!orderOk || formData.lines.every((l) => l.quantityDelivered === 0)}>
          Save delivery
        </Button>
      </div>
    </div>
  );

  const listTab = (
    <div className="pt-4">
      <Card>
        <CardHeader title="Delivery overview" subtitle="All outbound deliveries." />
        <DataTable
          bare
          rowKey="id"
          caption="Deliveries"
          columns={listColumns}
          data={deliveries}
          loading={loading}
          searchable
          searchPlaceholder="Search delivery, order, customer"
          rowActions={listActions}
          responsive="cards"
          cardTitleKey="id"
          emptyIcon={Package}
          emptyTitle="No deliveries found"
          emptyDescription="Create your first delivery to get started."
        />
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader title="Sales Deliveries" description="Outbound delivery management." />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'create', label: 'Create delivery', icon: Plus, content: createTab },
          { id: 'list', label: 'Delivery overview', icon: FileText, content: listTab },
        ]}
      />

      {/* View */}
      <Drawer
        open={showViewModal && Boolean(selectedDelivery)}
        onClose={() => setShowViewModal(false)}
        size="lg"
        title={selectedDelivery ? `Delivery ${selectedDelivery.id}` : 'Delivery'}
        description={selectedDelivery?.order_number ? `Order ${selectedDelivery.order_number}` : undefined}
        footer={
          selectedDelivery ? (
            <>
              <Button variant="secondary" leftIcon={Download} onClick={() => downloadDeliveryNote(selectedDelivery)}>Download</Button>
              <Button variant="secondary" leftIcon={Printer} onClick={() => printDeliveryNote(selectedDelivery)}>Print</Button>
              <Button variant="ghost" onClick={() => setShowViewModal(false)}>Close</Button>
            </>
          ) : undefined
        }
      >
        {selectedDelivery ? (
          <div className="space-y-6">
            <section>
              <SectionHeader as="h3" title="Delivery information" />
              <InfoGrid
                items={[
                  { label: 'Order reference', value: selectedDelivery.order_number },
                  { label: 'Sold-to party', value: selectedDelivery.order?.customer?.name || od?.customerName || 'N/A' },
                  { label: 'Delivery date', value: formatDate(selectedDelivery.deliveryDate) },
                  { label: 'Status', value: <StatusBadge status={selectedDelivery.status} domain="delivery" /> },
                  { label: 'Created date', value: formatDate(selectedDelivery.createdAt) },
                  { label: 'Payment terms', value: od?.paymentMethod || 'N/A' },
                  { label: 'Remarks', value: selectedDelivery.remarks },
                ]}
              />
            </section>
            <section>
              <SectionHeader as="h3" title="Delivery items" />
              <DetailTable caption="Delivery items" columns={viewColumns} rows={viewLines} rowKey="_index" />
              <p className="mt-3 text-right text-body text-ink-muted">
                Total quantity <strong className="text-ink">{formatNumber(viewTotalQty)}</strong> · Value <strong className="text-ink">{formatINR(viewTotalValue)}</strong>
              </p>
            </section>
            {od ? (
              <section>
                <SectionHeader as="h3" title="Financial details" />
                <div className="flex justify-end">
                  <TotalsSummary
                    className="w-full sm:max-w-sm"
                    rows={[
                      ['Net value', Number(od.netValue || 0)],
                      ['CGST', Number(od.cgstAmount || 0)],
                      ['SGST', Number(od.sgstAmount || 0)],
                      ['IGST', Number(od.igstAmount || 0)],
                    ]}
                    grand={['Total amount', Number(od.totalAmount || 0)]}
                  />
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      {/* Edit */}
      <Modal
        open={showEditModal && Boolean(selectedDelivery)}
        onClose={() => setShowEditModal(false)}
        title="Edit delivery"
        description={selectedDelivery ? `Document ${selectedDelivery.id}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button leftIcon={Save} onClick={handleUpdate} loading={loading}>Update</Button>
          </>
        }
      >
        <div className="space-y-4">
          <DatePicker label="Delivery date" value={editData.deliveryDate} onChange={(v) => setEditData({ ...editData, deliveryDate: v })} />
          <p className="text-sm text-slate-500">Status: <strong>{selectedDelivery?.status}</strong> — stock is already posted for this delivery, so status can't be edited. To undo it, cancel the delivery (only possible before it is invoiced).</p>
          <Textarea label="Remarks" value={editData.remarks} onChange={(e) => setEditData({ ...editData, remarks: e.target.value })} rows={3} />
        </div>
      </Modal>

      {/* Cancel */}
      <ConfirmationModal
        open={showDeleteModal && Boolean(selectedDelivery)}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        loading={loading}
        tone="danger"
        title="Cancel delivery?"
        confirmLabel="Cancel delivery"
        cancelLabel="Keep delivery"
        message={
          <>
            <p>Are you sure you want to cancel this delivery? This will reverse the stock that was deducted for it. This action cannot be undone.</p>
            {selectedDelivery ? (
              <p className="mt-2 text-caption text-ink-subtle">
                Delivery {selectedDelivery.id} · Order {selectedDelivery.order_number}
              </p>
            ) : null}
          </>
        }
      />
    </div>
  );
};

export default DeliveryManagement;
