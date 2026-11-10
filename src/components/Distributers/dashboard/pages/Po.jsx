import React, { useState, useEffect } from "react";
import { Ban, CircleCheck, CreditCard, Download, Eye, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";

import Alert from "../../../ui/Alert";
import Badge from "../../../ui/Badge";
import Button from "../../../ui/Button";
import Card, { CardBody, CardHeader } from "../../../ui/Card";
import DatePicker from "../../../ui/DatePicker";
import Drawer from "../../../ui/Drawer";
import IconButton from "../../../ui/IconButton";
import Input, { Textarea } from "../../../ui/Input";
import Modal from "../../../ui/Modal";
import PageHeader from "../../../ui/PageHeader";
import SectionHeader from "../../../ui/SectionHeader";
import Select from "../../../ui/Select";
import StatusBadge from "../../../ui/StatusBadge";
import { useConfirm, useToast } from "../../../feedback";
import DataTable from "../../../tables/DataTable";
import DetailTable from "../../../../features/adminSales/components/DetailTable";
import InfoGrid from "../../../../features/adminSales/components/InfoGrid";
import { formatDate, formatINR, formatNumber } from "../../../../utils/format";
import { AddressBlock, LineFigures, TotalsSummary } from "../shared/DocParts";
import { authFetch } from "../../../../utils/authFetch";
import { findVendorByCode } from "./vendorLookup";
const api = {
  vendor: {
    getAll: () => authFetch("/vendor"),
    getAddresses: (id) => authFetch(`/vendor/${id}/addresses?type=all`),
  },
  product: {
    getAll: () => authFetch("/product"),
  },
  batch: {
    getAll: () => authFetch("/stock"),
  },
  purchaseOrder: {
    getAll: () => authFetch("/purchase-orders"),
    getById: (id) => authFetch(`/purchase-orders/${id}`),
    create: (data) =>
      authFetch("/purchase-orders", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      authFetch(`/purchase-orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      authFetch(`/purchase-orders/${id}`, {
        method: "DELETE",
      }),
  },
};

export default function PurchaseOrder() {
  const toast = useToast();
  const confirm = useConfirm();
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [rowActionId, setRowActionId] = useState(null); // PO id currently being confirmed/cancelled/deleted

  // Vendor lookup states
  const [vendorCode, setVendorCode] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorAddresses, setVendorAddresses] = useState([]);
  const [loadingVendor, setLoadingVendor] = useState(false);

  const [form, setForm] = useState({
    orderDate: new Date().toISOString().split("T")[0],
    vendorId: "",
    vendorCode: "",
    paymentMethod: "cash",
    description: "",
    billToPartyId: "",
    shipToPartyId: "",
    lines: [
      {
        productId: "",
        batchId: "",
        quantity: 1,
        pricePerUnit: "",
        material: "",
      },
    ],
  });

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  // Helper function to safely convert to number
  const safeNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // Helper function to safely format currency
  const formatCurrency = (value) => {
    return safeNumber(value).toFixed(2);
  };

  // Reset form
  const resetForm = () => {
    setForm({
      orderDate: new Date().toISOString().split("T")[0],
      vendorId: "",
      vendorCode: "",
      paymentMethod: "cash",
      description: "",
      billToPartyId: "",
      shipToPartyId: "",
      lines: [
        {
          productId: "",
          batchId: "",
          quantity: 1,
          pricePerUnit: "",
          material: "",
        },
      ],
    });
    setErrors({});
    setSuccessMsg("");
    setEditingOrder(null);
    setVendorCode("");
    setSelectedVendor(null);
    setVendorAddresses([]);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const [vRes, pRes, bRes] = await Promise.all([
        api.vendor.getAll(),
        api.product.getAll(),
        api.batch.getAll(),
      ]);

      setVendors(Array.isArray(vRes) ? vRes : []);
      setProducts(Array.isArray(pRes) ? pRes : []);
      setBatches(Array.isArray(bRes) ? bRes : []);

      await fetchPurchaseOrders();
    } catch (err) {
      console.error("Error fetching initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendor details by code
  const fetchVendorByCode = async (code) => {
    if (!code.trim()) {
      setSelectedVendor(null);
      setVendorAddresses([]);
      return;
    }

    setLoadingVendor(true);
    try {
      // Phase 22 (D3): the former /vendor/by-code/:code call never existed on the server. Look in the loaded list first,
      // then refresh it once from the existing distributor-scoped GET /vendor (covers a vendor created after this page loaded).
      let vendor = findVendorByCode(vendors, code);
      if (!vendor) {
        const fresh = await api.vendor.getAll();
        const freshList = Array.isArray(fresh) ? fresh : [];
        setVendors(freshList);
        vendor = findVendorByCode(freshList, code);
      }

      if (!vendor) {
        throw new Error("Vendor not found");
      }

      setSelectedVendor(vendor);
      setForm((prev) => ({ ...prev, vendorId: vendor.id }));

      const addressData = await api.vendor.getAddresses(vendor.id);
      setVendorAddresses(addressData.addresses || []);
    } catch (err) {
      console.error("Error fetching vendor:", err);
      setSelectedVendor(null);
      setVendorAddresses([]);
      setErrors((prev) => ({
        ...prev,
        vendorCode: "Vendor not found",
      }));
    } finally {
      setLoadingVendor(false);
    }
  };

  // Handle vendor code input
  const handleVendorCodeChange = (e) => {
    const code = e.target.value;
    setVendorCode(code);
    setErrors((prev) => ({ ...prev, vendorCode: "" }));
  };

  // Handle Enter key press for vendor code
  const handleVendorCodeKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchVendorByCode(vendorCode);
    }
  };

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const data = await api.purchaseOrder.getAll();
      setPurchaseOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching purchase orders:", err);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Add new line item
  const addLineItem = () => {
    setForm((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          productId: "",
          batchId: "",
          quantity: 1,
          pricePerUnit: "",
          material: "",
        },
      ],
    }));
  };

  // Remove line item
  const removeLineItem = (index) => {
    if (form.lines.length > 1) {
      setForm((prev) => ({
        ...prev,
        lines: prev.lines.filter((_, i) => i !== index),
      }));
    }
  };

  // Handle line item change
  const handleLineChange = (index, field, value) => {
    const newLines = [...form.lines];

    if (field === "productId") {
      const product = products.find((p) => p.id === parseInt(value));
      newLines[index] = {
        ...newLines[index],
        [field]: value,
        pricePerUnit: product
          ? product.purchasePrice || product.price || ""
          : "",
        batchId: "",
        material: "",
      };
    } else if (field === "batchId") {
      const batch = batches.find((b) => b.id === parseInt(value));
      newLines[index] = {
        ...newLines[index],
        [field]: value,
        material: batch
          ? batch.material_code || batch.material || batch.materialName || "N/A"
          : "",
        pricePerUnit: batch
          ? batch.price_per_unit || batch.pricePerUnit || batch.price || ""
          : "",
      };
    } else if (field === "quantity") {
      newLines[index][field] = parseInt(value) || 1;
    } else if (field === "pricePerUnit") {
      newLines[index][field] = parseFloat(value) || "";
    } else {
      newLines[index][field] = value;
    }

    setForm((prev) => ({ ...prev, lines: newLines }));

    // Clear line-specific errors
    if (errors[`lines.${index}.${field}`]) {
      setErrors((prev) => ({ ...prev, [`lines.${index}.${field}`]: "" }));
    }
  };

  // Get available batches for a product
  const getAvailableBatches = (productId) => {
    if (!productId) return [];
    return batches.filter((batch) => batch.productId === parseInt(productId));
  };

  // Calculate line totals
  const calculateLineTotal = (line) => {
    const product = products.find((p) => p.id === parseInt(line.productId));
    const price =
      safeNumber(line.pricePerUnit) ||
      (product ? safeNumber(product.purchasePrice || product.price) : 0);
    const quantity = safeNumber(line.quantity);
    const netValue = price * quantity;

    if (!product) return { netValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };

    const gstRate = safeNumber(product?.hsn?.gst_rate);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    // Same rule as the server (computeHsnBasedTax): CGST+SGST only when a vendor exists AND both states are known and equal.
    // A PO without a vendor (the normal case from e-Pulse Phase 1) is shown with IGST — indicative; final tax is set at invoicing.
    if (selectedVendor && selectedVendor.state && selectedVendor.state === selectedVendor.distributorState) {
      cgst = (netValue * gstRate) / 200;
      sgst = (netValue * gstRate) / 200;
    } else {
      igst = (netValue * gstRate) / 100;
    }

    const total = netValue + cgst + sgst + igst;

    return { netValue, cgst, sgst, igst, total };
  };

  // Calculate order totals
  const calculateOrderTotals = () => {
    return form.lines.reduce(
      (acc, line) => {
        const lineTotal = calculateLineTotal(line);
        return {
          netValue: acc.netValue + lineTotal.netValue,
          cgst: acc.cgst + lineTotal.cgst,
          sgst: acc.sgst + lineTotal.sgst,
          igst: acc.igst + lineTotal.igst,
          total: acc.total + lineTotal.total,
        };
      },
      { netValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
    );
  };

  // Validate form fields
  const validate = () => {
    let temp = {};

    if (!form.orderDate) temp.orderDate = "Order date is required";

    form.lines.forEach((line, index) => {
      if (!line.productId)
        temp[`lines.${index}.productId`] = "Product is required";
      if (!line.quantity || line.quantity <= 0)
        temp[`lines.${index}.quantity`] = "Quantity must be greater than 0";
    });

    setErrors(temp);
    return Object.keys(temp).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setSuccessMsg("");
  };

  // Submit form (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { vendorId: _v, vendorCode: _vc, ...formRest } = form;
      const payload = {
        ...formRest,
        // A vendor is only carried when an older PO that already has one is being edited; new POs go to the administrator without one.
        ...(editingOrder && form.vendorId ? { vendorId: form.vendorId } : {}),
        lines: form.lines.map((line) => ({
          productId: parseInt(line.productId),
          batchId: line.batchId ? parseInt(line.batchId) : null,
          quantity: parseInt(line.quantity),
          pricePerUnit: line.pricePerUnit
            ? parseFloat(line.pricePerUnit)
            : null,
          material: line.material,
        })),
      };

      if (editingOrder) {
        await api.purchaseOrder.update(editingOrder.id, payload);
        setSuccessMsg("Purchase order updated successfully!");
      } else {
        await api.purchaseOrder.create(payload);
        setSuccessMsg("Purchase order created successfully!");
      }

      resetForm();
      setShowModal(false);
      fetchPurchaseOrders();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setErrors({ submit: "Failed to save order" });
    } finally {
      setSubmitting(false);
    }
  };

  // FIXED: View order details with address fetching
  const handleView = async (order) => {
    try {
      const fullOrder = await api.purchaseOrder.getById(order.id);

      if (fullOrder.vendorId) {
        const addrData = await api.vendor.getAddresses(fullOrder.vendorId);
        fullOrder.vendorAddresses = addrData.addresses || [];
      } else {
        fullOrder.vendorAddresses = [];
      }

      setViewingOrder(fullOrder);
      setShowViewModal(true);
    } catch (err) {
      console.error("Error fetching order details:", err);
      setViewingOrder(order);
      setShowViewModal(true);
    }
  };

  // Edit order
  const handleEdit = async (orderId) => {
    try {
      const order = await api.purchaseOrder.getById(orderId);

      setForm({
        orderDate: order.orderDate ? order.orderDate.split("T")[0] : "",
        vendorId: order.vendorId || "",
        vendorCode: order.vendorCode || "",
        paymentMethod: order.paymentMethod || "cash",
        description: order.description || "",
        billToPartyId: order.billToPartyId || "",
        shipToPartyId: order.shipToPartyId || "",
        lines:
          order.lines?.length > 0
            ? order.lines.map((line) => ({
                productId: line.productId?.toString() || "",
                batchId: line.batchId?.toString() || "",
                quantity: line.quantity || 1,
                pricePerUnit: line.pricePerUnit || "",
                material: line.material_code || line.material || "",
              }))
            : [
                {
                  productId: "",
                  batchId: "",
                  quantity: 1,
                  pricePerUnit: "",
                  material: "",
                },
              ],
      });

      if (order.vendorCode) {
        setVendorCode(order.vendorCode);
        await fetchVendorByCode(order.vendorCode);
      }

      setEditingOrder(order);
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching order for edit:", err);
    }
  };

  // Delete order (DRAFT only — backend enforces this)
  const handleDelete = async (orderId) => {
    if (!(await confirm({ title: "Delete purchase order?", message: "Are you sure you want to delete this order?", tone: "danger", confirmLabel: "Delete" }))) return;

    setRowActionId(orderId);
    try {
      await api.purchaseOrder.delete(orderId);
      fetchPurchaseOrders();
    } catch (err) {
      console.error("Error deleting order:", err);
      toast.error(err.message || "Failed to delete order", { title: "Delete failed" });
    } finally {
      setRowActionId(null);
    }
  };

  // Confirm order: DRAFT -> CONFIRMED
  const handleConfirmOrder = async (orderId) => {
    setRowActionId(orderId);
    try {
      await authFetch(`/purchase-orders/${orderId}/confirm`, { method: "POST" });
      fetchPurchaseOrders();
    } catch (err) {
      console.error("Error confirming order:", err);
      toast.error(err.message || "Failed to confirm order", { title: "Confirm failed" });
    } finally {
      setRowActionId(null);
    }
  };

  // Cancel order: DRAFT/CONFIRMED -> CANCELLED
  const handleCancelOrder = async (orderId) => {
    if (!(await confirm({ title: "Cancel purchase order?", message: "Cancel this purchase order? This cannot be undone.", tone: "danger", confirmLabel: "Cancel order", cancelLabel: "Keep order" }))) return;
    setRowActionId(orderId);
    try {
      await authFetch(`/purchase-orders/${orderId}/cancel`, { method: "POST" });
      fetchPurchaseOrders();
    } catch (err) {
      console.error("Error cancelling order:", err);
      toast.error(err.message || "Failed to cancel order", { title: "Cancel failed" });
    } finally {
      setRowActionId(null);
    }
  };

  const getPOStatus = (order) => order.status || "DRAFT"; // pre-Phase-4 orders default to DRAFT
  const canEditPO = (order) => getPOStatus(order) === "DRAFT";
  const canConfirmPO = (order) => getPOStatus(order) === "DRAFT";
  const canCancelPO = (order) => ["DRAFT", "CONFIRMED"].includes(getPOStatus(order));

  // FIXED: Generate professional HTML document with proper address handling
  const generateOrderHTML = (order) => {
    const vendor = vendors.find((v) => v.id === order.vendorId);

    // Use the addresses from the order object (fetched in handleView)
    const orderAddresses = order.vendorAddresses || [];

    const billToAddress = orderAddresses.find(
      (addr) => addr.type === "bill_to_party" || addr.type === "sold_to_party",
    );

    const shipToAddress = orderAddresses.find(
      (addr) => addr.type === "ship_to_party",
    );

    // Helper function to format address
    const formatAddress = (address) => {
      if (!address) return null;

      const parts = [
        address.street1,
        address.street2,
        address.street3,
        address.street4,
        address.city,
        address.region,
        address.pincode || address.postalCode || address.postal_code,
        address.country,
      ].filter(Boolean);

      return parts.length > 0 ? parts.join(", ") : null;
    };

    const formattedBillAddress = formatAddress(billToAddress);
    const formattedShipAddress = formatAddress(shipToAddress);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Purchase Order - ${order.id}</title>
    <style>
        @page { margin: 15mm; size: A4; }
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0; 
            font-size: 11px; 
            line-height: 1.4; 
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 3px solid #0066cc; 
            padding-bottom: 20px; 
            margin-bottom: 25px; 
        }
        .company-name { 
            font-size: 26px; 
            font-weight: bold; 
            color: #0066cc; 
            margin-bottom: 5px; 
            letter-spacing: 1px;
        }
        .document-title { 
            font-size: 20px; 
            font-weight: bold; 
            margin-top: 10px; 
            color: #333;
        }
        .order-number {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }
        
        .vendor-section {
            margin-bottom: 25px;
            border: 2px solid #0066cc;
            border-radius: 8px;
            overflow: hidden;
        }
        .vendor-header {
            background-color: #0066cc;
            color: white;
            padding: 12px 15px;
            font-weight: bold;
            font-size: 14px;
        }
        .vendor-content {
            display: flex;
            flex-wrap: wrap;
        }
        .vendor-info-box {
            flex: 1;
            min-width: 300px;
            padding: 15px;
            border-right: 1px solid #ddd;
        }
        .vendor-info-box:last-child {
            border-right: none;
        }
        .info-box-title {
            font-weight: bold;
            color: #0066cc;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-bottom: 12px;
            font-size: 12px;
        }
        .vendor-detail {
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
        }
        .detail-label {
            font-weight: bold;
            width: 90px;
            color: #555;
            flex-shrink: 0;
        }
        .detail-value {
            flex: 1;
            font-weight: 600;
        }
        .not-specified {
            color: #999;
            font-style: italic;
            font-weight: normal;
        }
        
        .order-info-section { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 25px; 
            gap: 20px;
        }
        .info-box { 
            flex: 1;
            border: 1px solid #ccc; 
            padding: 15px; 
            background-color: #f9f9f9; 
            border-radius: 6px;
        }
        .info-title { 
            font-weight: bold; 
            color: #0066cc; 
            border-bottom: 1px solid #ddd; 
            padding-bottom: 5px; 
            margin-bottom: 12px; 
            font-size: 13px;
        }
        .field-row { 
            margin-bottom: 8px; 
            display: flex; 
            align-items: flex-start;
        }
        .field-label { 
            font-weight: bold; 
            width: 100px; 
            color: #555; 
            flex-shrink: 0;
        }
        .field-value { 
            flex: 1; 
            word-wrap: break-word;
        }
        
        .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            border: 2px solid #0066cc; 
            font-size: 10px;
        }
        .items-table th { 
            background-color: #0066cc; 
            color: white; 
            padding: 10px 8px; 
            text-align: left; 
            font-weight: bold; 
            font-size: 10px;
        }
        .items-table td { 
            padding: 8px; 
            border-bottom: 1px solid #ddd; 
            vertical-align: top;
        }
        .items-table tr:nth-child(even) { 
            background-color: #f9f9f9; 
        }
        .currency { 
            font-family: monospace; 
            text-align: right;
        }
        
        .total-section { 
            margin-top: 20px; 
            padding: 15px; 
            border: 2px solid #0066cc; 
            border-radius: 8px;
            background-color: #f8f9fa;
        }
        .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            padding: 3px 0;
        }
        .total-label {
            font-weight: bold;
            color: #555;
        }
        .total-amount { 
            font-size: 16px; 
            font-weight: bold; 
            color: #0066cc; 
            border-top: 2px solid #0066cc;
            padding-top: 10px;
            margin-top: 10px;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }
        .description-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 6px;
        }
        .generated-info {
            font-size: 9px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">DISTRIBUTION MANAGEMENT SYSTEM</div>
        <div style="font-size: 14px; color: #666; margin: 5px 0;">Professional Purchase Order Document</div>
        <div class="document-title">PURCHASE ORDER</div>
        <div class="order-number">Order No: ${order.id}</div>
    </div>

    <div class="vendor-section">
        <div class="vendor-header">VENDOR INFORMATION & ADDRESSES</div>
        <div class="vendor-content">
            <div class="vendor-info-box">
                <div class="info-box-title">PRIMARY VENDOR DETAILS</div>
                <div class="vendor-detail">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${vendor?.name || "N/A"}</span>
                </div>
                <div class="vendor-detail">
                    <span class="detail-label">Code:</span>
                    <span class="detail-value">${vendor?.vendorCode || vendor?.vendor_code || "N/A"}</span>
                </div>
                <div class="vendor-detail">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${vendor?.email || "N/A"}</span>
                </div>
                <div class="vendor-detail">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${vendor?.phone || "N/A"}</span>
                </div>
                <div class="vendor-detail">
                    <span class="detail-label">GST No:</span>
                    <span class="detail-value">${vendor?.taxNumber || vendor?.gstNumber || "N/A"}</span>
                </div>
            </div>

            <div class="vendor-info-box">
                <div class="info-box-title">BILL TO PARTY</div>
                ${
                  formattedBillAddress
                    ? `
                    <div class="vendor-detail">
                        <span class="detail-value">${formattedBillAddress}</span>
                    </div>
                `
                    : `
                    <div class="vendor-detail">
                        <span class="detail-value not-specified">
                            Billing address not provided
                        </span>
                    </div>
                `
                }
            </div>

            <div class="vendor-info-box">
                <div class="info-box-title">SHIP TO PARTY</div>
                ${
                  formattedShipAddress
                    ? `
                    <div class="vendor-detail">
                        <span class="detail-value">${formattedShipAddress}</span>
                    </div>
                `
                    : formattedBillAddress
                      ? `
                    <div class="vendor-detail">
                        <span class="detail-value not-specified">
                            Same as billing address
                        </span>
                    </div>
                `
                      : `
                    <div class="vendor-detail">
                        <span class="detail-value not-specified">
                            Shipping address not provided
                        </span>
                    </div>
                `
                }
            </div>
        </div>
    </div>

    <div class="order-info-section">
        <div class="info-box">
            <div class="info-title">ORDER INFORMATION</div>
            <div class="field-row">
                <span class="field-label">Order No:</span>
                <span class="field-value">${order.id}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Order Date:</span>
                <span class="field-value">${
                  order.orderDate
                    ? new Date(order.orderDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "N/A"
                }</span>
            </div>
            <div class="field-row">
                <span class="field-label">Payment:</span>
                <span class="field-value">${order.paymentMethod || "Cash"}</span>
            </div>
        </div>
        
        <div class="info-box">
            <div class="info-title">DELIVERY INFORMATION</div>
            <div class="field-row">
                <span class="field-label">Status:</span>
                <span class="field-value">${order.status || "Pending"}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Priority:</span>
                <span class="field-value">${order.priority || "Normal"}</span>
            </div>
            <div class="field-row">
                <span class="field-label">Expected:</span>
                <span class="field-value">${order.expectedDelivery ? new Date(order.expectedDelivery).toLocaleDateString("en-IN") : "TBD"}</span>
            </div>
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 20%;">Product Name</th>
                <th style="width: 10%;">Batch No.</th>
                <th style="width: 12%;">Material</th>
                <th style="width: 8%;">Qty</th>
                <th style="width: 10%;">Unit Price</th>
                <th style="width: 10%;">Net Value</th>
                <th style="width: 7%;">CGST</th>
                <th style="width: 7%;">SGST</th>
                <th style="width: 7%;">IGST</th>
                <th style="width: 10%;">Line Total</th>
            </tr>
        </thead>
        <tbody>
            ${
              order.lines && order.lines.length > 0
                ? order.lines
                    .map((line, index) => {
                      const product = products.find(
                        (p) => p.id === line.productId,
                      );
                      const batch = batches.find((b) => b.id === line.batchId);
                      const netValue = safeNumber(line.lineNetValue);
                      const cgst = product
                        ? (netValue * safeNumber(product.cgst)) / 100
                        : 0;
                      const sgst = product
                        ? (netValue * safeNumber(product.sgst)) / 100
                        : 0;
                      const igst = product
                        ? (netValue * safeNumber(product.igst)) / 100
                        : 0;
                      const total = netValue + cgst + sgst + igst;

                      return `
                <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td>
                        <strong>${product?.name || line.product?.name || "N/A"}</strong>
                        ${product?.description ? `<br><small style="color: #666;">${product.description}</small>` : ""}
                    </td>
                    <td style="text-align: center;">${batch?.batch_no || batch?.batch_number || line.batch?.batch_no || "N/A"}</td>
                    <td style="text-align: center;">${line.material_code || line.material || "N/A"}</td>
                    <td style="text-align: center;">${safeNumber(line.quantity)}</td>
                    <td class="currency">₹ ${formatCurrency(line.pricePerUnit)}</td>
                    <td class="currency">₹ ${formatCurrency(netValue)}</td>
                    <td class="currency">₹ ${formatCurrency(cgst)}</td>
                    <td class="currency">₹ ${formatCurrency(sgst)}</td>
                    <td class="currency">₹ ${formatCurrency(igst)}</td>
                    <td class="currency"><strong>₹ ${formatCurrency(total)}</strong></td>
                </tr>
              `;
                    })
                    .join("")
                : '<tr><td colspan="11" style="text-align: center; color: #666; font-style: italic; padding: 20px;">No line items found</td></tr>'
            }
        </tbody>
    </table>

    <div class="total-section">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="flex: 1; margin-right: 30px;">
                <h4 style="color: #0066cc; margin-bottom: 10px; font-size: 14px;">ORDER SUMMARY</h4>
                <div style="font-size: 11px; color: #666;">
                    <div style="margin-bottom: 5px;">Total Items: ${order.lines?.length || 0}</div>
                    <div style="margin-bottom: 5px;">Total Quantity: ${order.lines?.reduce((sum, line) => sum + safeNumber(line.quantity), 0) || 0}</div>
                    <div>Payment Terms: ${order.paymentMethod || "Cash"}</div>
                </div>
            </div>
            
            <div style="min-width: 250px;">
                <div class="total-row">
                    <span class="total-label">Net Value:</span>
                    <span class="currency">₹ ${formatCurrency(order.netValue)}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">CGST Amount:</span>
                    <span class="currency">₹ ${formatCurrency(order.cgstAmount)}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">SGST Amount:</span>
                    <span class="currency">₹ ${formatCurrency(order.sgstAmount)}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">IGST Amount:</span>
                    <span class="currency">₹ ${formatCurrency(order.igstAmount)}</span>
                </div>
                <div class="total-row total-amount">
                    <span>GRAND TOTAL:</span>
                    <span class="currency">₹ ${formatCurrency(order.totalAmount)}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        ${
          order.description
            ? `
            <div class="description-section">
                <h4 style="color: #0066cc; margin-bottom: 8px;">ORDER DESCRIPTION</h4>
                <p style="margin: 0; color: #555;">${order.description}</p>
            </div>
        `
            : ""
        }
        
        <div style="margin-top: 20px; font-size: 10px; color: #666;">
            <h4 style="color: #0066cc; margin-bottom: 8px;">TERMS & CONDITIONS</h4>
            <ul style="margin: 0; padding-left: 20px;">
                <li>All prices are inclusive of applicable taxes unless otherwise specified</li>
                <li>Payment to be made as per agreed terms</li>
                <li>Goods to be inspected upon delivery</li>
                <li>Subject to local jurisdiction only</li>
            </ul>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div style="text-align: center; width: 200px;">
                <div style="border-top: 1px solid #666; padding-top: 5px; margin-top: 50px;">
                    <strong>Vendor Signature</strong>
                </div>
            </div>
            <div style="text-align: center; width: 200px;">
                <div style="border-top: 1px solid #666; padding-top: 5px; margin-top: 50px;">
                    <strong>Authorized Signature</strong>
                </div>
            </div>
        </div>
        
        <div class="generated-info">
            <p>This is a computer generated document | Generated on: ${new Date().toLocaleString(
              "en-IN",
              {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              },
            )}</p>
        </div>
    </div>
</body>
</html>`;
  };

  // Download order as HTML
  const handleDownload = (order) => {
    const htmlContent = generateOrderHTML(order);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Purchase_Order_${order.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totals = calculateOrderTotals();
  const vendorOf = (order) => vendors.find((v) => v.id === order.vendorId);
  const vendorCodeOf = (v) => v?.vendorCode || v?.vendor_code || "";
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };
  const closeView = () => {
    setShowViewModal(false);
    setViewingOrder(null);
  };
  const setField = (name) => (value) => handleChange({ target: { name, value } });

  const columns = [
    { key: "order_number", header: "Order number", sortable: true, accessor: (o) => o.order_number, render: (v) => <span className="font-medium text-ink">{v}</span> },
    { key: "orderDate", header: "Date", sortable: true, accessor: (o) => o.orderDate, render: (v) => formatDate(v) },
    {
      key: "vendor",
      header: "Vendor",
      sortable: true,
      accessor: (o) => vendorOf(o)?.name || "—",
      render: (v, o) => (
        <>
          <span className="block">{v}</span>
          <span className="block text-caption text-ink-subtle">{vendorCodeOf(vendorOf(o))}</span>
        </>
      ),
    },
    { key: "totalAmount", header: "Total amount", sortable: true, align: "right", accessor: (o) => safeNumber(o.totalAmount), render: (v) => <span className="font-medium tabular-nums">{formatINR(v)}</span> },
    { key: "paymentMethod", header: "Payment", accessor: (o) => o.paymentMethod || "Cash", render: (v) => <Badge tone="neutral" icon={CreditCard}>{v}</Badge> },
    { key: "status", header: "Status", sortable: true, accessor: (o) => getPOStatus(o), render: (v) => <StatusBadge status={v} domain="purchaseOrder" /> },
  ];

  const rowActions = (order) => {
    const busy = rowActionId === order.id;
    const items = [{ key: "view", label: "View details", icon: Eye, onClick: () => handleView(order) }];
    if (canEditPO(order)) items.push({ key: "edit", label: "Edit", icon: Pencil, disabled: busy, onClick: () => handleEdit(order.id) });
    if (canConfirmPO(order)) items.push({ key: "confirm", label: "Confirm order", icon: CircleCheck, disabled: busy, onClick: () => handleConfirmOrder(order.id) });
    if (canCancelPO(order)) items.push({ key: "cancel", label: "Cancel order", icon: Ban, disabled: busy, onClick: () => handleCancelOrder(order.id) });
    if (canEditPO(order)) items.push({ key: "sep", divider: true }, { key: "delete", label: "Delete", icon: Trash2, danger: true, disabled: busy, onClick: () => handleDelete(order.id) });
    return items;
  };

  // Detail drawer data (same per-line GST derivation as before; only the presentation changed).
  const viewVendor = viewingOrder ? vendorOf(viewingOrder) : null;
  const viewLines = (viewingOrder?.lines || []).map((line, index) => {
    const product = products.find((p) => p.id === line.productId);
    const batch = batches.find((b) => b.id === line.batchId);
    const netValue = safeNumber(line.lineNetValue);
    const cgst = product ? (netValue * safeNumber(product.cgst)) / 100 : 0;
    const sgst = product ? (netValue * safeNumber(product.sgst)) / 100 : 0;
    const igst = product ? (netValue * safeNumber(product.igst)) / 100 : 0;
    return {
      id: line.id ?? index,
      product: product?.name || line.product?.name || "N/A",
      description: product?.description,
      batch: batch?.batch_no || batch?.batch_number || line.batch?.batch_no || "N/A",
      material: line.material_code || line.material || "N/A",
      quantity: safeNumber(line.quantity),
      received: line.receivedQuantity ?? 0,
      remaining: line.remainingQuantity ?? line.quantity,
      price: line.pricePerUnit,
      netValue,
      cgst,
      sgst,
      igst,
      total: netValue + cgst + sgst + igst,
    };
  });
  const viewColumns = [
    {
      key: "product",
      header: "Product",
      render: (l) => (
        <>
          <span className="block font-medium">{l.product}</span>
          {l.description ? <span className="block text-caption text-ink-subtle">{l.description}</span> : null}
        </>
      ),
    },
    { key: "batch", header: "Batch" },
    { key: "material", header: "Material" },
    { key: "quantity", header: "Qty", align: "right", render: (l) => formatNumber(l.quantity) },
    { key: "received", header: "Received", align: "right", render: (l) => <span className="text-success-700">{formatNumber(l.received)}</span> },
    { key: "remaining", header: "Remaining", align: "right", render: (l) => <span className="font-medium text-warning-700">{formatNumber(l.remaining)}</span> },
    { key: "price", header: "Price/unit", align: "right", render: (l) => formatINR(l.price) },
    { key: "netValue", header: "Net value", align: "right", render: (l) => formatINR(l.netValue) },
    { key: "cgst", header: "CGST", align: "right", render: (l) => formatINR(l.cgst) },
    { key: "sgst", header: "SGST", align: "right", render: (l) => formatINR(l.sgst) },
    { key: "igst", header: "IGST", align: "right", render: (l) => formatINR(l.igst) },
    { key: "total", header: "Total", align: "right", render: (l) => <span className="font-medium">{formatINR(l.total)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        description="Create purchase orders — each one goes to your administrator automatically."
        actions={
          <Button
            leftIcon={Plus}
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            Create new order
          </Button>
        }
      />

      {successMsg ? (
        <Alert tone="success" className="mb-4" onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      ) : null}

      <Card>
        <DataTable
          bare
          rowKey="id"
          caption="Purchase orders"
          columns={columns}
          data={purchaseOrders}
          loading={loading}
          searchable
          searchPlaceholder="Search order number, status"
          rowActions={rowActions}
          responsive="cards"
          cardTitleKey="order_number"
          emptyIcon={Package}
          emptyTitle="No purchase orders found"
          emptyDescription="Create your first purchase order to see it here."
        />
      </Card>

      {/* Create / edit */}
      <Modal
        open={showModal}
        onClose={closeModal}
        size="xl"
        title={editingOrder ? "Edit purchase order" : "Create purchase order"}
        description="Order details and the items you want to order."
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" form="po-form" loading={submitting}>
              {editingOrder ? "Update order" : "Create order"}
            </Button>
          </>
        }
      >
        <form id="po-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {errors.submit ? (
            <Alert tone="error" title="Unable to save the order">
              {errors.submit}
            </Alert>
          ) : null}

          <Card>
            <CardHeader title="Order details" />
            <CardBody className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <DatePicker label="Order date" required value={form.orderDate} onChange={setField("orderDate")} error={errors.orderDate} />
                <Select
                  label="Payment method"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                  options={[
                    { value: "cash", label: "Cash" },
                    { value: "credit", label: "Credit" },
                    { value: "bank_transfer", label: "Bank transfer" },
                    { value: "cheque", label: "Cheque" },
                  ]}
                />
              </div>

              <div className="rounded-card border border-line bg-surface-muted p-4 text-body text-ink-muted">
                {editingOrder && selectedVendor
                  ? <>Older order for vendor <span className="font-medium text-ink">{selectedVendor.name}</span>. New orders don’t need a vendor.</>
                  : "No vendor is needed. When you create this order it goes to your administrator automatically."}
              </div>

              <Textarea label="Description" name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Additional notes or instructions…" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Order items"
              subtitle="Pick a product and batch; GST is worked out from the product's tax rates."
              actions={
                <Button size="sm" variant="secondary" leftIcon={Plus} onClick={addLineItem}>
                  Add item
                </Button>
              }
            />
            <CardBody className="space-y-4">
              {form.lines.map((line, index) => {
                const lineTotal = calculateLineTotal(line);
                const availableBatches = getAvailableBatches(line.productId);
                return (
                  <fieldset key={index} className="rounded-card border border-line p-4">
                    <legend className="px-1 text-caption font-medium text-ink-subtle">Item {index + 1}</legend>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1.5fr_1.5fr_7rem_8rem_auto]">
                      <Select
                        label="Product"
                        required
                        value={line.productId}
                        onChange={(e) => handleLineChange(index, "productId", e.target.value)}
                        placeholder="Select product"
                        options={products.map((product) => ({ value: product.id, label: product.name }))}
                        error={errors[`lines.${index}.productId`]}
                      />
                      <Select
                        label="Batch"
                        value={line.batchId}
                        onChange={(e) => handleLineChange(index, "batchId", e.target.value)}
                        placeholder="Select batch"
                        disabled={!line.productId}
                        options={availableBatches.map((batch) => ({ value: batch.id, label: batch.batch_no || batch.batch_number || String(batch.id) }))}
                      />
                      <Input label="Material" value={line.material} readOnly placeholder="Auto-filled" />
                      <Input label="Quantity" required type="number" min="1" value={line.quantity} onChange={(e) => handleLineChange(index, "quantity", e.target.value)} error={errors[`lines.${index}.quantity`]} />
                      <Input label="Price / unit" type="number" step="0.01" min="0" value={line.pricePerUnit} onChange={(e) => handleLineChange(index, "pricePerUnit", e.target.value)} />
                      <div className="flex items-end">
                        <IconButton icon={Trash2} label={`Remove item ${index + 1}`} variant="danger" onClick={() => removeLineItem(index)} disabled={form.lines.length === 1} />
                      </div>
                    </div>
                    <LineFigures
                      items={[
                        ["Net", formatINR(lineTotal.netValue)],
                        ["CGST", formatINR(lineTotal.cgst)],
                        ["SGST", formatINR(lineTotal.sgst)],
                        ["IGST", formatINR(lineTotal.igst)],
                        ["Total", formatINR(lineTotal.total), true],
                      ]}
                    />
                  </fieldset>
                );
              })}
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <TotalsSummary
              className="w-full sm:max-w-sm"
              rows={[
                ["Net value", totals.netValue],
                ["CGST", totals.cgst],
                ["SGST", totals.sgst],
                ["IGST", totals.igst],
              ]}
              grand={["Grand total", totals.total]}
            />
          </div>
        </form>
      </Modal>

      {/* View details */}
      <Drawer
        open={showViewModal && Boolean(viewingOrder)}
        onClose={closeView}
        size="lg"
        title={viewingOrder ? `Purchase order ${viewingOrder.order_number || `#${viewingOrder.id}`}` : "Purchase order"}
        description={viewVendor?.name || undefined}
        footer={
          viewingOrder ? (
            <>
              <Button variant="secondary" leftIcon={Download} onClick={() => handleDownload(viewingOrder)}>
                Download HTML
              </Button>
              <Button variant="ghost" onClick={closeView}>
                Close
              </Button>
            </>
          ) : undefined
        }
      >
        {viewingOrder ? (
          <div className="space-y-6">
            {viewingOrder.vendorId ? (
            <section aria-labelledby="po-vendor">
              <SectionHeader as="h3" title={<span id="po-vendor">Vendor information</span>} />
              <InfoGrid
                items={[
                  { label: "Vendor name", value: viewVendor?.name },
                  { label: "Vendor code", value: viewVendor?.vendor_code },
                  { label: "Email", value: viewVendor?.email },
                  { label: "Phone", value: viewVendor?.phone },
                ]}
              />
              {viewingOrder.vendorAddresses && viewingOrder.vendorAddresses.length > 0 ? (
                <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                  <AddressBlock title="Bill to address" address={viewingOrder.vendorAddresses.find((a) => a.type === "bill_to_party" || a.type === "sold_to_party")} />
                  <AddressBlock title="Ship to address" address={viewingOrder.vendorAddresses.find((a) => a.type === "ship_to_party")} fallback="Same as billing address" />
                </div>
              ) : null}
            </section>
            ) : (
            <p className="rounded-card border border-line bg-surface-muted p-4 text-body text-ink-muted">This order was sent to your administrator. It has no vendor.</p>
            )}

            <section aria-labelledby="po-details">
              <SectionHeader as="h3" title={<span id="po-details">Order details</span>} />
              <InfoGrid
                items={[
                  { label: "Order date", value: formatDate(viewingOrder.orderDate) },
                  { label: "Payment method", value: viewingOrder.paymentMethod || "Cash" },
                  { label: "Status", value: <StatusBadge status={getPOStatus(viewingOrder)} domain="purchaseOrder" /> },
                  { label: "Description", value: viewingOrder.description },
                ]}
              />
            </section>

            <section aria-labelledby="po-items">
              <SectionHeader as="h3" title={<span id="po-items">Order items</span>} />
              {viewLines.length > 0 ? <DetailTable caption="Purchase order items" columns={viewColumns} rows={viewLines} /> : <p className="rounded-card border border-line px-4 py-6 text-center text-body text-ink-muted">No items found</p>}
              <div className="mt-4 flex justify-end">
                <TotalsSummary
                  className="w-full sm:max-w-sm"
                  rows={[
                    ["Net value", safeNumber(viewingOrder.netValue)],
                    ["CGST", safeNumber(viewingOrder.cgstAmount)],
                    ["SGST", safeNumber(viewingOrder.sgstAmount)],
                    ["IGST", safeNumber(viewingOrder.igstAmount)],
                  ]}
                  grand={["Grand total", safeNumber(viewingOrder.totalAmount)]}
                />
              </div>
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
