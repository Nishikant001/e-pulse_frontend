import React, { useEffect, useState } from "react";
import axios from "axios";
import { Ban, CircleCheck, Clock, Download, FileText, Pencil, Trash2, Truck } from "lucide-react";
import Alert from "../../../ui/Alert";
import Button from "../../../ui/Button";
import Card, { CardHeader } from "../../../ui/Card";
import DatePicker from "../../../ui/DatePicker";
import FilterBar from "../../../ui/FilterBar";
import Input, { Textarea } from "../../../ui/Input";
import KpiCard from "../../../ui/KpiCard";
import Modal from "../../../ui/Modal";
import PageHeader from "../../../ui/PageHeader";
import Select from "../../../ui/Select";
import StatusBadge from "../../../ui/StatusBadge";
import { SearchFilter, SelectFilter } from "../../../forms";
import { useConfirm, useToast } from "../../../feedback";
import DataTable from "../../../tables/DataTable";
import { formatDate, formatNumber } from "../../../../utils/format";

import { API_BASE_URL as API_BASE } from "../../../../config/api";

function Delivery() {
  const toast = useToast();
  const confirm = useConfirm();
  const token = localStorage.getItem("token");
  const decoded = parseJwt(token);
  const distributorId = decoded?.id;

  const [deliveries, setDeliveries] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [invoiceForm, setInvoiceForm] = useState({
    paymentAmount: 0,
    restPaymentDueDate: "",
    placeOfSupply: "",
    vehicleNumber: "",
    receiverDetails: "",
    consigneeBilledTo: "",
    consigneeShippedTo: "",
    total: 0
  });
  const [form, setForm] = useState({
    salesOrderId: "",
    salesOrderLineId: "",
    deliveryDate: "",
    status: "Pending",
  });

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Fetch deliveries + count
  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        axios.get(`${API_BASE}/delivery`, config),
        axios.get(`${API_BASE}/delivery/count?distributorId=${distributorId}`, config)
      ]);
      setDeliveries(listRes.data);
      setCount(countRes.data.deliveryCount || listRes.data.length);
      setError(null);
    } catch (err) {
      setError("Failed to load deliveries.");
      console.error("Error fetching deliveries:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  // Handle form input change for editing
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle invoice form change
  const handleInvoiceFormChange = (e) => {
    const { name, value } = e.target;
    setInvoiceForm((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Calculate restAmount when paymentAmount or total changes
      if (name === 'paymentAmount' || name === 'total') {
        const total = name === 'total' ? parseFloat(value) || 0 : prev.total;
        const paymentAmount = name === 'paymentAmount' ? parseFloat(value) || 0 : prev.paymentAmount;
        updated.restAmount = total - paymentAmount;
      }
      
      return updated;
    });
  };

  // Submit form to update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE}/delivery/${editingId}`, form, config);
      toast.success("Delivery updated successfully");
      setForm({ salesOrderId: "", salesOrderLineId: "", deliveryDate: "", status: "Pending" });
      setEditingId(null);
      fetchDeliveries();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, { title: "Unable to update the delivery" });
    }
  };

  // Edit delivery (populate form)
  const handleEdit = (delivery) => {
    setForm({
      salesOrderId: delivery.salesOrderId,
      salesOrderLineId: delivery.salesOrderLineId || "",
      deliveryDate: delivery.deliveryDate ? delivery.deliveryDate.split("T")[0] : "",
      status: delivery.status,
    });
    setEditingId(delivery.id);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setForm({ salesOrderId: "", salesOrderLineId: "", deliveryDate: "", status: "Pending" });
    setEditingId(null);
  };

  // Delete delivery
  const handleDelete = async (id) => {
    if (!(await confirm({ title: "Delete delivery?", message: "Are you sure you want to delete this delivery?", tone: "danger", confirmLabel: "Delete" }))) return;
    try {
      await axios.delete(`${API_BASE}/delivery/${id}`, config);
      toast.success("Delivery deleted successfully");
      fetchDeliveries();
    } catch (err) {
      toast.error(err.message, { title: "Unable to delete the delivery" });
    }
  };

  // Generate SAP-style HTML for delivery
  const generateDeliveryHTML = (delivery) => {
    const customer = delivery.salesOrder?.customer;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Delivery Form - ${delivery.id}</title>
    <style>
        @page { margin: 20mm; size: A4; }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; font-size: 12px; line-height: 1.4; }
        .header { text-align: center; border-bottom: 3px solid #0066cc; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #0066cc; margin-bottom: 5px; }
        .document-title { font-size: 18px; font-weight: bold; margin-top: 10px; }
        .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .info-box { width: 48%; border: 1px solid #ccc; padding: 15px; background-color: #f9f9f9; }
        .info-title { font-weight: bold; color: #0066cc; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
        .field-row { margin-bottom: 8px; display: flex; }
        .field-label { font-weight: bold; width: 120px; color: #333; }
        .field-value { flex: 1; }
        .status-delivered { color: #28a745; font-weight: bold; }
        .status-pending { color: #ffc107; font-weight: bold; }
        .status-cancelled { color: #dc3545; font-weight: bold; }
        .terms-section { margin-top: 30px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #0066cc; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-box { width: 200px; text-align: center; }
        .signature-line { border-top: 1px solid #333; margin-top: 50px; padding-top: 5px; }
        .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">YOUR COMPANY NAME</div>
        <div>Delivery Management System</div>
        <div class="document-title">DELIVERY FORM</div>
    </div>

    <div class="info-section">
        <div class="info-box">
            <div class="info-title">DELIVERY INFORMATION</div>
            <div class="field-row">
                <span class="field-label">Delivery ID:</span>
                <span class="field-value">${delivery.id || 'N/A'}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Sales Order:</span>
                <span class="field-value">${delivery.salesOrderId || 'N/A'}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Customer Name:</span>
                <span class="field-value">${delivery.customerName || 'N/A'}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Delivery Date:</span>
                <span class="field-value">${delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString('en-GB') : 'N/A'}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Status:</span>
                <span class="field-value status-${delivery.status?.toLowerCase()}">${delivery.status || 'N/A'}</span>
            </div>
        </div>

        <div class="info-box">
            <div class="info-title">CUSTOMER DETAILS</div>
            <div class="field-row">
                <span class="field-label">Customer:</span>
                <span class="field-value">${customer?.customerName || customer?.name || 'N/A'}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Shop Name:</span>
                <span class="field-value">${customer?.shopName || 'N/A'}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Address:</span>
                <span class="field-value">${customer?.address || 'N/A'}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Phone:</span>
                <span class="field-value">${customer?.phone || 'N/A'}</span>
            </div>
        </div>
    </div>

    <div class="terms-section">
        <strong>Delivery Instructions:</strong><br>
        1. Please verify the delivery address before dispatch<br>
        2. Ensure proper packaging and handling<br>
        3. Get customer signature upon delivery<br>
        4. Report any delivery issues immediately
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div class="signature-line">Prepared By</div>
            <small>Delivery Team</small>
        </div>
        <div class="signature-box">
            <div class="signature-line">Customer Signature</div>
            <small>Date: _______</small>
        </div>
        <div class="signature-box">
            <div class="signature-line">Delivered By</div>
            <small>Driver Signature</small>
        </div>
    </div>

    <div class="footer">
        Generated on: ${new Date().toLocaleString()} | Delivery Management System
    </div>
</body>
</html>`;
  };

  // Download delivery form
  const handleDownload = (delivery) => {
    const htmlContent = generateDeliveryHTML(delivery);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-form-${delivery.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Show invoice modal
  const handleShowInvoiceModal = (delivery) => {
    setSelectedDelivery(delivery);
    
    // Initialize invoice form with data from sales order
    const netValue = delivery.salesOrder?.netValue || 0;
    const customerData = delivery.salesOrder?.customer;
    
    setInvoiceForm({
      paymentAmount: 0,
      restPaymentDueDate: "",
      placeOfSupply: customerData?.address || "",
      vehicleNumber: "",
      receiverDetails: customerData ? `${customerData.customerName || customerData.name || ''}\n${customerData.shopName || ''}\n${customerData.address || ''}\n${customerData.phone || ''}` : "",
      consigneeBilledTo: customerData ? `${customerData.customerName || customerData.name || ''}\n${customerData.shopName || ''}\n${customerData.address || ''}` : "",
      consigneeShippedTo: customerData ? `${customerData.customerName || customerData.name || ''}\n${customerData.shopName || ''}\n${customerData.address || ''}` : "",
      total: netValue,
      restAmount: netValue
    });
    
    setShowInvoiceModal(true);
  };

  // Create invoice
  const handleCreateInvoice = async () => {
    if (!selectedDelivery) return;
    
    setCreatingInvoice(true);
    try {
      const invoiceData = {
        salesOrderId: selectedDelivery.salesOrderId,
        paymentAmount: parseFloat(invoiceForm.paymentAmount) || 0,
        restPaymentDueDate: invoiceForm.restPaymentDueDate || null,
        placeOfSupply: invoiceForm.placeOfSupply,
        vehicleNumber: invoiceForm.vehicleNumber,
        receiverDetails: invoiceForm.receiverDetails,
        consigneeBilledTo: invoiceForm.consigneeBilledTo,
        consigneeShippedTo: invoiceForm.consigneeShippedTo,
        total: parseFloat(invoiceForm.total) || 0
      };

      await axios.post(`${API_BASE}/invoice`, invoiceData, config);
      toast.success("Invoice created successfully");
      setShowInvoiceModal(false);
      setSelectedDelivery(null);
      setInvoiceForm({
        paymentAmount: 0,
        restPaymentDueDate: "",
        placeOfSupply: "",
        vehicleNumber: "",
        receiverDetails: "",
        consigneeBilledTo: "",
        consigneeShippedTo: "",
        total: 0
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message, { title: "Unable to create the invoice" });
    }
    setCreatingInvoice(false);
  };

  // Filter deliveries based on search and status
  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.id.toString().includes(searchTerm.toLowerCase()) ||
      delivery.salesOrderId?.toString().includes(searchTerm.toLowerCase()) ||
      (delivery.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (delivery.salesOrder?.customer?.customerName || delivery.salesOrder?.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || delivery.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status counts for summary cards
  const statusCounts = deliveries.reduce((acc, delivery) => {
    acc[delivery.status] = (acc[delivery.status] || 0) + 1;
    return acc;
  }, {});

  const columns = [
    { key: "id", header: "ID", sortable: true, render: (v) => <span className="font-medium">#{v}</span> },
    { key: "salesOrderId", header: "Sales order", sortable: true, accessor: (d) => d.salesOrderId || "N/A" },
    { key: "salesOrderLineId", header: "Sales order line", accessor: (d) => d.salesOrderLineId || "N/A" },
    { key: "customer", header: "Customer", sortable: true, accessor: (d) => d.customerName || d.salesOrder?.customer?.customerName || d.salesOrder?.customer?.name || "N/A" },
    { key: "deliveryDate", header: "Delivery date", sortable: true, accessor: (d) => d.deliveryDate || "", render: (v) => (v ? formatDate(v) : <span className="text-ink-subtle">Not set</span>) },
    { key: "status", header: "Status", sortable: true, accessor: (d) => d.status, render: (v) => <StatusBadge status={v} domain="delivery" /> },
  ];
  const rowActions = (d) => [
    { key: "edit", label: "Edit", icon: Pencil, onClick: () => handleEdit(d) },
    { key: "download", label: "Download form", icon: Download, onClick: () => handleDownload(d) },
    { key: "invoice", label: "Create invoice", icon: FileText, onClick: () => handleShowInvoiceModal(d) },
    { key: "sep", divider: true },
    { key: "delete", label: "Delete", icon: Trash2, danger: true, onClick: () => handleDelete(d.id) },
  ];
  const setInv = (name) => (value) => handleInvoiceFormChange({ target: { name, value } });
  const setEditField = (name) => (value) => handleChange({ target: { name, value } });
  const filterCount = (searchTerm ? 1 : 0) + (statusFilter !== "All" ? 1 : 0);
  const closeInvoice = () => setShowInvoiceModal(false);

  return (
    <div>
      <PageHeader title="Delivery Management" description="Manage and track your delivery orders." />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total" icon={Truck} status="brand" loading={loading} value={formatNumber(count)} comparison="all deliveries" />
        <KpiCard title="Pending" icon={Clock} status="warning" loading={loading} value={formatNumber(statusCounts.Pending || 0)} />
        <KpiCard title="Delivered" icon={CircleCheck} status="success" loading={loading} value={formatNumber(statusCounts.Delivered || 0)} />
        <KpiCard title="Cancelled" icon={Ban} status="neutral" loading={loading} value={formatNumber(statusCounts.Cancelled || 0)} />
      </div>

      {error ? (
        <Alert tone="error" className="mb-4">
          {error}
        </Alert>
      ) : null}

      <FilterBar className="mb-4" activeCount={filterCount} onReset={() => { setSearchTerm(""); setStatusFilter("All"); }}>
        <SearchFilter label="Search deliveries" value={searchTerm} onChange={setSearchTerm} placeholder="ID, sales order or customer" className="w-full sm:w-80" />
        <SelectFilter
          label="Status"
          allLabel="All statuses"
          value={statusFilter === "All" ? "" : statusFilter}
          onChange={(v) => setStatusFilter(v || "All")}
          options={[
            { value: "Pending", label: "Pending" },
            { value: "Delivered", label: "Delivered" },
            { value: "Cancelled", label: "Cancelled" },
          ]}
        />
      </FilterBar>

      <Card>
        <CardHeader title={`Delivery records (${filteredDeliveries.length})`} />
        <DataTable
          bare
          rowKey="id"
          caption="Deliveries"
          columns={columns}
          data={filteredDeliveries}
          loading={loading}
          rowActions={rowActions}
          responsive="cards"
          cardTitleKey="id"
          emptyIcon={Truck}
          emptyTitle="No deliveries found"
          emptyDescription="Try adjusting your search or filter criteria."
        />
      </Card>

      {/* Edit delivery */}
      <Modal
        open={Boolean(editingId)}
        onClose={handleCancelEdit}
        title="Edit delivery"
        footer={
          <>
            <Button variant="secondary" onClick={handleCancelEdit}>Cancel</Button>
            <Button type="submit" form="delivery-edit-form">Update delivery</Button>
          </>
        }
      >
        <form id="delivery-edit-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Input label="Sales order ID" required type="number" name="salesOrderId" value={form.salesOrderId} onChange={handleChange} />
          <Input label="Sales order line ID" type="number" name="salesOrderLineId" value={form.salesOrderLineId} onChange={handleChange} placeholder="Optional" />
          <DatePicker label="Delivery date" value={form.deliveryDate} onChange={setEditField("deliveryDate")} />
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={[
              { value: "Pending", label: "Pending" },
              { value: "Delivered", label: "Delivered" },
              { value: "Cancelled", label: "Cancelled" },
            ]}
          />
        </form>
      </Modal>

      {/* Create invoice from a delivery */}
      <Modal
        open={showInvoiceModal && Boolean(selectedDelivery)}
        onClose={closeInvoice}
        size="lg"
        title={selectedDelivery ? `Create invoice — delivery #${selectedDelivery.id}` : "Create invoice"}
        footer={
          <>
            <Button variant="secondary" onClick={closeInvoice}>Cancel</Button>
            <Button onClick={handleCreateInvoice} loading={creatingInvoice}>Create invoice</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Total amount" type="number" name="total" value={invoiceForm.total} onChange={handleInvoiceFormChange} step="0.01" />
          <Input label="Payment amount" type="number" name="paymentAmount" value={invoiceForm.paymentAmount} onChange={handleInvoiceFormChange} step="0.01" />
          <Input label="Rest amount" type="number" value={invoiceForm.restAmount || (invoiceForm.total - invoiceForm.paymentAmount)} disabled readOnly />
          <DatePicker label="Rest payment due date" value={invoiceForm.restPaymentDueDate} onChange={setInv("restPaymentDueDate")} />
          <Input label="Place of supply" name="placeOfSupply" value={invoiceForm.placeOfSupply} onChange={handleInvoiceFormChange} />
          <Input label="Vehicle number" name="vehicleNumber" value={invoiceForm.vehicleNumber} onChange={handleInvoiceFormChange} />
          <Textarea label="Receiver details" wrapperClassName="sm:col-span-2" name="receiverDetails" value={invoiceForm.receiverDetails} onChange={handleInvoiceFormChange} rows={4} />
          <Textarea label="Consignee billed to" wrapperClassName="sm:col-span-2" name="consigneeBilledTo" value={invoiceForm.consigneeBilledTo} onChange={handleInvoiceFormChange} rows={3} />
          <Textarea label="Consignee shipped to" wrapperClassName="sm:col-span-2" name="consigneeShippedTo" value={invoiceForm.consigneeShippedTo} onChange={handleInvoiceFormChange} rows={3} />
        </div>
      </Modal>
    </div>
  );
}

export default Delivery;
