import React, { useEffect, useState } from "react";
import { Ban, CircleCheck, Download, Eye, Pencil, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";

import Alert from "../../../ui/Alert";
import Button from "../../../ui/Button";
import Card, { CardBody, CardHeader } from "../../../ui/Card";
import DatePicker from "../../../ui/DatePicker";
import Drawer from "../../../ui/Drawer";
import IconButton from "../../../ui/IconButton";
import Input from "../../../ui/Input";
import Modal from "../../../ui/Modal";
import PageHeader from "../../../ui/PageHeader";
import SectionHeader from "../../../ui/SectionHeader";
import Select from "../../../ui/Select";
import StatusBadge from "../../../ui/StatusBadge";
import { useConfirm } from "../../../feedback";
import DataTable from "../../../tables/DataTable";
import DetailTable from "../../../../features/adminSales/components/DetailTable";
import InfoGrid from "../../../../features/adminSales/components/InfoGrid";
import { formatDate, formatINR, formatNumber } from "../../../../utils/format";
import { LineFigures, TotalsSummary } from "../shared/DocParts";
import { authFetch } from "../../../../utils/authFetch";

export default function SalesOrderMaster() {
  const confirm = useConfirm();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchStock, setBatchStock] = useState({}); // batchId -> { quantity, isExpired, isOutOfStock, expDate }
  const [salesOrders, setSalesOrders] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rowActionId, setRowActionId] = useState(null); // order id currently being confirmed/cancelled
  const [listError, setListError] = useState("");

  // Customer lookup states
  const [customerCode, setCustomerCode] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  const [form, setForm] = useState({
    orderDate: "",
    customerId: "",
    customerCode: "",
    paymentMethod: "",
    description: "",
    soldToPartyId: "",
    shipToPartyId: "",
    expectedDeliveryDate: "",
    billingAddress: "",
    shippingAddress: "",
    lines: [
      {
        productId: "",
        batchId: "",
        quantity: 1,
        pricePerUnit: "",
        material: "", // Added material field
      },
    ],
  });


  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
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
      orderDate: "",
      customerId: "",
      customerCode: "",
      paymentMethod: "",
      description: "",
      soldToPartyId: "",
      shipToPartyId: "",
      expectedDeliveryDate: "",
      billingAddress: "",
      shippingAddress: "",
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
    setCustomerCode("");
    setSelectedCustomer(null);
    setCustomerAddresses([]);
  };

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
     const [cRes, pRes, bRes, stockRes] = await Promise.all([
  authFetch("/customer"),
  authFetch("/product"),
  authFetch("/stock"),
  authFetch("/stockLedger/batch").catch(() => []), // Phase 2 endpoint — real available stock per batch
]);

setCustomers(cRes);
setProducts(pRes);
setBatches(bRes);

// Index Phase 2 batch-stock data by batchId for O(1) lookup in the form
const stockMap = {};
(Array.isArray(stockRes) ? stockRes : []).forEach((s) => {
  stockMap[s.batchId] = s;
});
setBatchStock(stockMap);

fetchSalesOrders();

    } catch (err) {
      console.error("Error fetching initial data", err);
    }
  };

  // Fetch customer details by code
  const fetchCustomerByCode = async (code) => {
    if (!code.trim()) {
      setSelectedCustomer(null);
      setCustomerAddresses([]);
      return;
    }

    setLoadingCustomer(true);
    try {
      

      // authFetch returns parsed JSON (and throws on non-2xx), not a Response.
      const wanted = code.trim().toLowerCase();

      // 1) Try the already-loaded list (backend field is `customer_code`)
      let customer = customers.find(
        (c) =>
          (c.customer_code || c.customerCode || c.code || "")
            .toString()
            .toLowerCase() === wanted
      );

      // 2) Fall back to the API
      if (!customer) {
        try {
          customer = await authFetch(
            `/customer/by-code/${encodeURIComponent(code.trim())}`
          );
        } catch (e) {
          if (e.status !== 404) throw e;
          customer = null;
        }
      }

      if (!customer) {
        setSelectedCustomer(null);
        setCustomerAddresses([]);
        setErrors((prev) => ({ ...prev, customerCode: "Customer not found" }));
        return;
      }

      setSelectedCustomer(customer);
      setForm((prev) => ({ ...prev, customerId: customer.id }));

      const customerWithAddresses = await authFetch(
        `/customer/${customer.id}/addresses?type=all`
      );
      setCustomerAddresses(customerWithAddresses.addresses || []);
    } catch (err) {
      console.error("Error fetching customer", err);
      setSelectedCustomer(null);
      setCustomerAddresses([]);
      setErrors((prev) => ({
        ...prev,
        customerCode: "Error fetching customer details",
      }));
    } finally {
      setLoadingCustomer(false);
    }
  };

  // Handle customer code input
  const handleCustomerCodeChange = (e) => {
    const code = e.target.value;
    setCustomerCode(code);
    setErrors((prev) => ({ ...prev, customerCode: "" }));
  };

  // Handle Enter key press for customer code
  const handleCustomerCodeKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchCustomerByCode(customerCode);
    }
  };

  // Fetch all sales orders
  const fetchSalesOrders = async () => {
  setLoading(true);
  try {
    const data = await authFetch("/salesorder");
    setSalesOrders(data);
  } catch (err) {
    console.error(err);
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

  // Handle line item change - UPDATED
  const handleLineChange = (index, field, value) => {
    const newLines = [...form.lines];

    if (field === "productId") {
      const product = products.find((p) => p.id === parseInt(value));
      newLines[index] = {
        ...newLines[index],
        [field]: value,
        pricePerUnit: product ? product.price : "",
        batchId: "", // Reset batch when product changes
        material: "", // Reset material when product changes
      };
    } else if (field === "batchId") {
  const batch = batches.find((b) => b.id === parseInt(value));
  const lineProduct = products.find((p) => p.id === parseInt(newLines[index].productId));
  newLines[index] = {
    ...newLines[index],
    [field]: value,
    material: batch ? lineProduct?.material_code || batch.material_code || batch.material || "N/A" : "",
    // Sale price comes from the product; batch.purchase_price is a cost, not a selling price.
    pricePerUnit: batch
      ? (lineProduct?.price ?? newLines[index].pricePerUnit ?? "")
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

  // Get available batches for a product — uses REAL stock from the Phase 2
  // StockLedger-backed endpoint (Batch.quantity is not authoritative and
  // does not even exist on the backend model; see Phase 2 report).
const getAvailableBatches = (productId) => {
  if (!productId) return [];
  return batches.filter((batch) => {
    if (batch.productId !== parseInt(productId)) return false;
    const stock = batchStock[batch.id];
    return stock && !stock.isExpired && !stock.isOutOfStock && stock.quantity > 0;
  });
};

  // Calculate line totals
  const calculateLineTotal = (line) => {
    const product = products.find((p) => p.id === parseInt(line.productId));
    const price =
      safeNumber(line.pricePerUnit) ||
      (product ? safeNumber(product.price) : 0);
    const quantity = safeNumber(line.quantity);
    const netValue = price * quantity;

    if (!product) return { netValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };

    const cgst = (netValue * safeNumber(product.cgst)) / 100;
    const sgst = (netValue * safeNumber(product.sgst)) / 100;
    const igst = (netValue * safeNumber(product.igst)) / 100;
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
      { netValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    );
  };

  // View order details
  const handleView = (order) => {
    setViewingOrder(order);
    setShowViewModal(true);
  };

  // Validate form fields
  const validate = () => {
    let temp = {};

    if (!form.orderDate) temp.orderDate = "Order date is required";
    if (!form.customerId) temp.customerId = "Customer is required";

    form.lines.forEach((line, index) => {
      if (!line.productId)
        temp[`lines.${index}.productId`] = "Product is required";
      if (!line.batchId)
        temp[`lines.${index}.batchId`] = "Batch is required";
      if (!line.quantity || line.quantity <= 0)
        temp[`lines.${index}.quantity`] = "Quantity must be greater than 0";

      // Check batch availability if batch is selected (uses real Phase 2 stock)
      if (line.batchId) {
        const stock = batchStock[parseInt(line.batchId)];
        if (stock && stock.quantity < line.quantity) {
          temp[
            `lines.${index}.quantity`
          ] = `Only ${stock.quantity} units available in selected batch`;
        }
      }
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
    const payload = {
      ...form,
      lines: form.lines.map((line) => ({
        ...line,
        productId: Number(line.productId),
        batchId: line.batchId ? Number(line.batchId) : null,
        quantity: Number(line.quantity),
        pricePerUnit: line.pricePerUnit
          ? Number(line.pricePerUnit)
          : null,
      })),
    };

    await authFetch(
      editingOrder
        ? `/salesorder/${editingOrder.id}`
        : "/salesorder",
      {
        method: editingOrder ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }
    );

    setSuccessMsg(
      editingOrder
        ? "Sales order updated successfully!"
        : "Sales order created successfully!"
    );

    resetForm();
    setShowModal(false);
    fetchSalesOrders();
  } catch (err) {
    console.error(err);
    setErrors({ submit: err.message || "Failed to save order" });
  } finally {
    setSubmitting(false);
  }
};



  // Edit order
 const handleEdit = async (orderId) => {
  try {
    const order = await authFetch(`/salesorder/${orderId}`);

    setForm({
      orderDate: order.orderDate ? order.orderDate.split("T")[0] : "",
      customerId: order.customerId || "",
      customerCode: order.customerCode || "",
      paymentMethod: order.paymentMethod || "",
      description: order.description || "",
      soldToPartyId: order.soldToPartyId || "",
      shipToPartyId: order.shipToPartyId || "",
      expectedDeliveryDate: order.expectedDeliveryDate ? order.expectedDeliveryDate.split("T")[0] : "",
      billingAddress: order.billingAddress || "",
      shippingAddress: order.shippingAddress || "",
      lines:
        order.lines?.length > 0
          ? order.lines.map((line) => ({
              productId: line.productId?.toString() || "",
              batchId: line.batchId?.toString() || "",
              quantity: line.quantity || 1,
              pricePerUnit: line.pricePerUnit || "",
              material: line.material || "",
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

    if (order.customerCode) {
      setCustomerCode(order.customerCode);
      await fetchCustomerByCode(order.customerCode);
    }

    setEditingOrder(order);
    setShowModal(true);
  } catch (err) {
    console.error("Error fetching order details", err);
  }
};



  // Delete order
const handleDelete = async (orderId) => {
  if (!(await confirm({ title: "Delete sales order?", message: "Are you sure you want to delete this order?", tone: "danger", confirmLabel: "Delete" }))) return;

  setRowActionId(orderId);
  setListError("");
  try {
    await authFetch(`/salesorder/${orderId}`, {
      method: "DELETE",
    });

    fetchSalesOrders();
  } catch (err) {
    console.error("Error deleting order", err);
    setListError(err.message || "Failed to delete order");
  } finally {
    setRowActionId(null);
  }
};

// Confirm order: DRAFT -> CONFIRMED
const handleConfirmOrder = async (orderId) => {
  setRowActionId(orderId);
  setListError("");
  try {
    await authFetch(`/salesorder/${orderId}/confirm`, { method: "POST" });
    setSuccessMsg("Order confirmed successfully!");
    fetchSalesOrders();
  } catch (err) {
    console.error("Error confirming order", err);
    setListError(err.message || "Failed to confirm order");
  } finally {
    setRowActionId(null);
  }
};

// Cancel order: DRAFT/CONFIRMED -> CANCELLED
const handleCancelOrder = async (orderId) => {
  if (!(await confirm({ title: "Cancel sales order?", message: "Cancel this sales order? This cannot be undone.", tone: "danger", confirmLabel: "Cancel order", cancelLabel: "Keep order" }))) return;

  setRowActionId(orderId);
  setListError("");
  try {
    await authFetch(`/salesorder/${orderId}/cancel`, { method: "POST" });
    setSuccessMsg("Order cancelled.");
    fetchSalesOrders();
  } catch (err) {
    console.error("Error cancelling order", err);
    setListError(err.message || "Failed to cancel order");
  } finally {
    setRowActionId(null);
  }
};

// Status badge + which actions are valid for a given status, mirroring the
// backend state machine in salesOrder.controller.js. The backend remains
// authoritative — this only controls what's shown/enabled in the UI.
const getOrderStatus = (order) => order.status || "DRAFT"; // pre-Phase-3 orders default to DRAFT

const canEditOrder = (order) => getOrderStatus(order) === "DRAFT";
const canConfirmOrder = (order) => getOrderStatus(order) === "DRAFT";
const canCancelOrder = (order) => ["DRAFT", "CONFIRMED"].includes(getOrderStatus(order));




  // Generate professional HTML document
  const generateOrderHTML = (order) => {
    const customer = customers.find((c) => c.id === order.customerId);
    console.log(customer);

    const soldToAddress = customer?.addresses?.find(
      (addr) => addr.type === "sold_to_party"
    );

    const shipToAddress = customer?.addresses?.find(
      (addr) => addr.type === "ship_to_party"
    );

    // Helper function to format address
    const formatAddress = (address) => {
      if (!address) return "Not specified";

      const parts = [
        address.street1,
        address.street2,
        address.street3,
        address.street4,
        address.city,
        address.region,
        address.pincode || address.postalCode,
        address.country,
      ].filter(Boolean);

      return parts.length > 0 ? parts.join(", ") : "Address details not available";
    };
    console.log("Customer Addresses:", customerAddresses);
    console.log("Sold To Address:", customerAddresses.find(a => a.type === "sold_to_party"));
    console.log("Ship To Address:", customerAddresses.find(a => a.type === "ship_to_party"));

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sales Order - ${order.id}</title>
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
        
        /* Customer and Address Section */
        .customer-section {
            margin-bottom: 25px;
            border: 2px solid #0066cc;
            border-radius: 8px;
            overflow: hidden;
        }
        .customer-header {
            background-color: #0066cc;
            color: white;
            padding: 12px 15px;
            font-weight: bold;
            font-size: 14px;
        }
        .customer-content {
            display: flex;
            flex-wrap: wrap;
        }
        .customer-info-box {
            flex: 1;
            min-width: 300px;
            padding: 15px;
            border-right: 1px solid #ddd;
        }
        .customer-info-box:last-child {
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
        .customer-detail {
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
            font-weight: 600;    /* Semi-bold */
            font-weight: 700;  
        }
        
        /* Order Info Section */
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
        
        /* Items Table */
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
        
        /* Total Section */
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
        
        /* Footer */
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
        <div style="font-size: 14px; color: #666; margin: 5px 0;">Professional Sales Order Document</div>
        <div class="document-title">SALES ORDER</div>
        <div class="order-number">Order No: ${order.id}</div>
    </div>

    <!-- Enhanced Customer Information Section -->
    <div class="customer-section">
        <div class="customer-header">CUSTOMER INFORMATION & ADDRESSES</div>
        <div class="customer-content">
            <!-- Primary Customer Information -->
            <div class="customer-info-box">
                <div class="info-box-title">PRIMARY CUSTOMER DETAILS</div>
                <div class="customer-detail">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${
                      order.customerName || customer?.name || "N/A"
                    }</span>
                </div>
                <div class="customer-detail">
                    <span class="detail-label">PinCode:</span>
                    <span class="detail-value">${
                      order.customerCode ||
                      customer?.pincode ||
                      customer?.pincode ||
                      "N/A"
                    }</span>
                </div>
                <div class="customer-detail">
                    <span class="detail-label">Region:</span>
                    <span class="detail-value">${
                      order.customerCode ||
                      customer?.region ||
                      customer?.region ||
                      "N/A"
                    }</span>
                </div>
                <div class="customer-detail">
                    <span class="detail-label">Phone:</span>
                    <span class="detail-value">${
                      customer?.phone || customer?.alternatePhone || "N/A"
                    }</span>
                </div>
                <div class="customer-detail">
                    <span class="detail-label">PostalCode:</span>
                    <span class="detail-value">${
                      customer?.postalCode || "N/A"
                    }</span>
                </div>
                <div class="customer-detail">
                    <span class="detail-label">GST No:</span>
                    <span class="detail-value">${
                      customer?.taxNumber || customer?.gstNumber || "N/A"
                    }</span>
                </div>
            </div>

            <!-- Sold To Party Address -->
            <div class="customer-info-box">
                <div class="info-box-title">SOLD TO PARTY</div>
                ${
                  soldToAddress
                    ? `
                    <div class="customer-detail">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${formatAddress(
                          soldToAddress
                        )}</span>
                    </div>
                    <div class="customer-detail">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">${
                          soldToAddress.type
                            ?.replace("_", " ")
                            ?.toUpperCase() || "BILLING"
                        }</span>
                    </div>
                `
                    : `
                    <div class="customer-detail">
                        <span class="detail-value" style="color: #666; font-style: italic;">
                            ${
                              order.address ||
                              "Default billing address not specified"
                            }
                        </span>
                    </div>
                `
                }
            </div>

            <!-- Ship To Party Address -->
            <div class="customer-info-box">
                <div class="info-box-title">SHIP TO PARTY</div>
                ${
                  shipToAddress
                    ? `
                    <div class="customer-detail">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${formatAddress(
                          shipToAddress
                        )}</span>
                    </div>
                    <div class="customer-detail">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">${
                          shipToAddress.type
                            ?.replace("_", " ")
                            ?.toUpperCase() || "SHIPPING"
                        }</span>
                    </div>
                `
                    : `
                    <div class="customer-detail">
                        <span class="detail-value" style="color: #666; font-style: italic;">
                            Same as Sold To Party address
                        </span>
                    </div>
                `
                }
            </div>
        </div>
    </div>

    <!-- Order Information Section -->
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
                <span class="field-value">${
                  order.paymentMethod || "Cash"
                }</span>
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
                <span class="field-value">${
                  order.expectedDelivery
                    ? new Date(order.expectedDelivery).toLocaleDateString(
                        "en-IN"
                      )
                    : "TBD"
                }</span>
            </div>
        </div>
    </div>

    <!-- Line Items Table -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 20%;">Product Name</th>
                <th style="width: 10%;">Batch No.</th>
                
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
              order.lines
                ?.map((line, index) => {
                  const product = products.find((p) => p.id === line.productId);
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
                        <strong>${product?.name || "N/A"}</strong>
                        ${
                          product?.description
                            ? `<br><small style="color: #666;">${product.description}</small>`
                            : ""
                        }
                    </td>
                    <td style="text-align: center;">${
                      batch?.batch_no || "N/A"
                    }</td>
                    
                    <td style="text-align: center;">${safeNumber(
                      line.quantity
                    )}</td>
                    <td class="currency">₹ ${formatCurrency(
                      line.pricePerUnit
                    )}</td>
                    <td class="currency">₹ ${formatCurrency(netValue)}</td>
                    <td class="currency">₹ ${formatCurrency(cgst)}</td>
                    <td class="currency">₹ ${formatCurrency(sgst)}</td>
                    <td class="currency">₹ ${formatCurrency(igst)}</td>
                    <td class="currency"><strong>₹ ${formatCurrency(
                      total
                    )}</strong></td>
                </tr>
              `;
                })
                .join("") ||
              '<tr><td colspan="11" style="text-align: center; color: #666; font-style: italic;">No line items found</td></tr>'
            }
        </tbody>
    </table>

    <!-- Enhanced Totals Section -->
    <div class="total-section">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <!-- Order Summary -->
            <div style="flex: 1; margin-right: 30px;">
                <h4 style="color: #0066cc; margin-bottom: 10px; font-size: 14px;">ORDER SUMMARY</h4>
                <div style="font-size: 11px; color: #666;">
                    <div style="margin-bottom: 5px;">Total Items: ${
                      order.lines?.length || 0
                    }</div>
                    <div style="margin-bottom: 5px;">Total Quantity: ${
                      order.lines?.reduce(
                        (sum, line) => sum + safeNumber(line.quantity),
                        0
                      ) || 0
                    }</div>
                    <div>Payment Terms: ${order.paymentMethod || "Cash"}</div>
                </div>
            </div>
            
            <!-- Financial Totals -->
            <div style="min-width: 250px;">
                <div class="total-row">
                    <span class="total-label">Net Value:</span>
                    <span class="currency">₹ ${formatCurrency(
                      order.netValue
                    )}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">CGST Amount:</span>
                    <span class="currency">₹ ${formatCurrency(
                      order.cgstAmount
                    )}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">SGST Amount:</span>
                    <span class="currency">₹ ${formatCurrency(
                      order.sgstAmount
                    )}</span>
                </div>
                <div class="total-row">
                    <span class="total-label">IGST Amount:</span>
                    <span class="currency">₹ ${formatCurrency(
                      order.igstAmount
                    )}</span>
                </div>
                <div class="total-row total-amount">
                    <span>GRAND TOTAL:</span>
                    <span class="currency">₹ ${formatCurrency(
                      order.totalAmount
                    )}</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer Section -->
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
        
        <!-- Terms and Conditions -->
        <div style="margin-top: 20px; font-size: 10px; color: #666;">
            <h4 style="color: #0066cc; margin-bottom: 8px;">TERMS & CONDITIONS</h4>
            <ul style="margin: 0; padding-left: 20px;">
                <li>All prices are inclusive of applicable taxes unless otherwise specified</li>
                <li>Payment to be made as per agreed terms</li>
                <li>Goods once sold will not be taken back unless defective</li>
                <li>Subject to local jurisdiction only</li>
            </ul>
        </div>
        
        <!-- Signatures -->
        <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div style="text-align: center; width: 200px;">
                <div style="border-top: 1px solid #666; padding-top: 5px; margin-top: 50px;">
                    <strong>Customer Signature</strong>
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
              }
            )}</p>
        </div>
    </div>
</body>
</html>`;
  };

  // Download order document
  const handleDownload = (order) => {
    const htmlContent = generateOrderHTML(order);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sales-Order-${order.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const orderTotals = calculateOrderTotals();
  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };
  const closeView = () => {
    setShowViewModal(false);
  };
  const setField = (name) => (value) => handleChange({ target: { name, value } });
  const addressLabel = (addr) => `${addr.street}, ${addr.city} - ${addr.pincode}`;

  const columns = [
    { key: "order_number", header: "Order number", sortable: true, render: (v) => <span className="font-medium text-ink">{v}</span> },
    { key: "orderDate", header: "Date", sortable: true, render: (v) => (v ? formatDate(v) : "N/A") },
    { key: "customerName", header: "Customer", sortable: true, accessor: (o) => o.customerName || "N/A" },
    { key: "totalAmount", header: "Total amount", sortable: true, align: "right", accessor: (o) => safeNumber(o.totalAmount), render: (v) => <span className="font-medium tabular-nums">{formatINR(v)}</span> },
    { key: "paymentMethod", header: "Payment", accessor: (o) => o.paymentMethod || "N/A" },
    { key: "status", header: "Status", sortable: true, accessor: (o) => getOrderStatus(o), render: (v) => <StatusBadge status={v} domain="salesOrder" /> },
  ];
  const rowActions = (order) => {
    const busy = rowActionId === order.id;
    const items = [{ key: "view", label: "View details", icon: Eye, onClick: () => handleView(order) }];
    if (canEditOrder(order)) items.push({ key: "edit", label: "Edit", icon: Pencil, disabled: busy, onClick: () => handleEdit(order.id) });
    if (canConfirmOrder(order)) items.push({ key: "confirm", label: "Confirm order", icon: CircleCheck, disabled: busy, onClick: () => handleConfirmOrder(order.id) });
    items.push({ key: "download", label: "Download", icon: Download, onClick: () => handleDownload(order) });
    if (canCancelOrder(order)) items.push({ key: "cancel", label: "Cancel order", icon: Ban, disabled: busy, onClick: () => handleCancelOrder(order.id) });
    if (canEditOrder(order)) items.push({ key: "sep", divider: true }, { key: "delete", label: "Delete", icon: Trash2, danger: true, disabled: busy, onClick: () => handleDelete(order.id) });
    return items;
  };

  const viewLines = (viewingOrder?.lines || []).map((line, index) => {
    const product = products.find((p) => p.id === line.productId);
    const batch = batches.find((b) => b.id === line.batchId);
    const netValue = safeNumber(line.lineNetValue);
    const cgst = product ? (netValue * safeNumber(product.cgst)) / 100 : 0;
    const sgst = product ? (netValue * safeNumber(product.sgst)) / 100 : 0;
    const igst = product ? (netValue * safeNumber(product.igst)) / 100 : 0;
    return {
      id: line.id ?? index,
      sno: index + 1,
      product: product?.name || "N/A",
      batch: batch?.batch_no || batch?.batch_number || "N/A",
      quantity: safeNumber(line.quantity),
      delivered: line.deliveredQuantity ?? 0,
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
    { key: "sno", header: "#", render: (l) => l.sno },
    { key: "product", header: "Product", render: (l) => <span className="font-medium">{l.product}</span> },
    { key: "batch", header: "Batch" },
    { key: "quantity", header: "Qty", align: "right", render: (l) => formatNumber(l.quantity) },
    { key: "delivered", header: "Delivered", align: "right", render: (l) => <span className="text-success-700">{formatNumber(l.delivered)}</span> },
    { key: "remaining", header: "Remaining", align: "right", render: (l) => <span className="font-medium text-warning-700">{formatNumber(l.remaining)}</span> },
    { key: "price", header: "Unit price", align: "right", render: (l) => formatINR(l.price) },
    { key: "netValue", header: "Net value", align: "right", render: (l) => formatINR(l.netValue) },
    { key: "cgst", header: "CGST", align: "right", render: (l) => formatINR(l.cgst) },
    { key: "sgst", header: "SGST", align: "right", render: (l) => formatINR(l.sgst) },
    { key: "igst", header: "IGST", align: "right", render: (l) => formatINR(l.igst) },
    { key: "total", header: "Total", align: "right", render: (l) => <span className="font-medium">{formatINR(l.total)}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Sales Orders"
        description="Create, confirm and track customer sales orders."
        actions={
          <Button leftIcon={Plus} onClick={openCreateModal}>
            Create sales order
          </Button>
        }
      />

      {successMsg ? (
        <Alert tone="success" className="mb-4" onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      ) : null}
      {listError ? (
        <Alert tone="error" className="mb-4" onClose={() => setListError("")}>
          {listError}
        </Alert>
      ) : null}

      <Card>
        <DataTable
          bare
          rowKey="id"
          caption="Sales orders"
          columns={columns}
          data={salesOrders}
          loading={loading}
          searchable
          searchPlaceholder="Search order number, customer, status"
          rowActions={rowActions}
          responsive="cards"
          cardTitleKey="order_number"
          emptyIcon={ShoppingCart}
          emptyTitle="No sales orders found"
          emptyDescription="Create your first sales order to see it here."
        />
      </Card>

      {/* Create / edit */}
      <Modal
        open={showModal}
        onClose={closeModal}
        size="xl"
        title={editingOrder ? "Edit sales order" : "Create sales order"}
        description="Customer, addresses and the items (with batches) you want to sell."
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" form="so-form" loading={submitting} disabled={!selectedCustomer}>
              {editingOrder ? "Update order" : "Create order"}
            </Button>
          </>
        }
      >
        <form id="so-form" onSubmit={handleSubmit} noValidate className="space-y-4">
          {successMsg ? <Alert tone="success">{successMsg}</Alert> : null}
          {errors.submit ? (
            <Alert tone="error" title="Unable to save the order">
              {errors.submit}
            </Alert>
          ) : null}

          <Card>
            <CardHeader title="Customer" />
            <CardBody className="space-y-4">
              <Input
                label="Customer code"
                required
                value={customerCode}
                onChange={handleCustomerCodeChange}
                onKeyPress={handleCustomerCodeKeyPress}
                placeholder="Enter customer code and press Enter"
                error={errors.customerCode}
                wrapperClassName="max-w-xl"
                rightSlot={<IconButton icon={Search} label="Search customer" size="sm" onClick={() => fetchCustomerByCode(customerCode)} disabled={loadingCustomer || !customerCode.trim()} />}
              />

              {selectedCustomer ? (
                <div className="rounded-card border border-line bg-surface-muted p-4">
                  <p className="mb-3 text-body font-semibold text-ink">Customer information</p>
                  <InfoGrid
                    columns="sm:grid-cols-2 lg:grid-cols-4"
                    items={[
                      { label: "Name", value: selectedCustomer.name },
                      { label: "Code", value: selectedCustomer.customer_code },
                      { label: "Phone", value: selectedCustomer.alternatePhone },
                      { label: "GST", value: selectedCustomer.taxNumber },
                    ]}
                  />
                  {customerAddresses.length > 0 ? (
                    <div className="mt-4 border-t border-line pt-4">
                      <p className="mb-2 text-caption font-medium text-ink-subtle">Addresses</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        {customerAddresses.map((address, idx) => (
                          <div key={idx} className="rounded-control border border-line bg-surface p-3 text-body">
                            <p className="text-caption font-semibold text-ink-subtle">{address.type?.replace("_", " ")?.toUpperCase() || "Address"}</p>
                            {address.street ? <p>{address.street}</p> : null}
                            <p>{[address.city, address.state, address.pincode].filter(Boolean).join(", ")}</p>
                            {address.country ? <p>{address.country}</p> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Order details" />
            <CardBody className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DatePicker label="Order date" required value={form.orderDate} onChange={setField("orderDate")} error={errors.orderDate} />
                <Input label="Payment method" name="paymentMethod" value={form.paymentMethod} onChange={handleChange} placeholder="e.g. Cash, Credit, UPI" />
                <DatePicker label="Expected delivery date" value={form.expectedDeliveryDate} onChange={setField("expectedDeliveryDate")} />
                <Input label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Order description" />
                <Input label="Billing address" name="billingAddress" value={form.billingAddress} onChange={handleChange} placeholder="Override billing address (optional)" />
                <Input label="Shipping address" name="shippingAddress" value={form.shippingAddress} onChange={handleChange} placeholder="Override shipping address (optional)" />
              </div>
              {customerAddresses.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    label="Sold-to party"
                    name="soldToPartyId"
                    value={form.soldToPartyId}
                    onChange={handleChange}
                    placeholder="Select sold-to address"
                    options={customerAddresses.filter((addr) => addr.type === "sold_to_party" || addr.type === "billing").map((addr) => ({ value: addr.id, label: addressLabel(addr) }))}
                  />
                  <Select
                    label="Ship-to party"
                    name="shipToPartyId"
                    value={form.shipToPartyId}
                    onChange={handleChange}
                    placeholder="Select ship-to address"
                    options={customerAddresses.filter((addr) => addr.type === "ship_to_party" || addr.type === "shipping").map((addr) => ({ value: addr.id, label: addressLabel(addr) }))}
                  />
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Line items"
              subtitle="Pick a product and a batch; price and material fill in from the batch."
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
                const selectedBatch = batches.find((b) => b.id === parseInt(line.batchId));
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
                        options={products.map((p) => ({ value: p.id, label: `${p.name} (${formatINR(p.price)})` }))}
                        error={errors[`lines.${index}.productId`]}
                      />
                      <Select
                        label="Batch"
                        required
                        value={line.batchId}
                        onChange={(e) => handleLineChange(index, "batchId", e.target.value)}
                        placeholder="Select batch"
                        disabled={!line.productId}
                        options={availableBatches.map((b) => ({ value: b.id, label: `${b.batch_no || b.batchNumber || b.batch_number} (Qty: ${batchStock[b.id]?.quantity ?? 0})` }))}
                        error={errors[`lines.${index}.batchId`]}
                      />
                      <Input label="Material" value={line.material} readOnly disabled placeholder="Auto-filled from batch" />
                      <Input
                        label="Quantity"
                        required
                        type="number"
                        min="1"
                        max={selectedBatch ? batchStock[selectedBatch.id]?.quantity : undefined}
                        value={line.quantity}
                        onChange={(e) => handleLineChange(index, "quantity", e.target.value)}
                        disabled={!line.batchId}
                        error={errors[`lines.${index}.quantity`]}
                        hint={selectedBatch ? `Available: ${batchStock[selectedBatch.id]?.quantity ?? 0}` : undefined}
                      />
                      <Input label="Unit price" type="number" step="0.01" value={line.pricePerUnit} onChange={(e) => handleLineChange(index, "pricePerUnit", e.target.value)} disabled={!line.batchId} placeholder="Auto-filled" />
                      <div className="flex items-end">
                        {form.lines.length > 1 ? <IconButton icon={Trash2} label={`Remove item ${index + 1}`} variant="danger" onClick={() => removeLineItem(index)} /> : null}
                      </div>
                    </div>

                    {selectedBatch ? (
                      <InfoGrid
                        className="mt-3"
                        columns="sm:grid-cols-2 lg:grid-cols-4"
                        items={[
                          { label: "Batch no.", value: selectedBatch.batch_no || selectedBatch.batchNumber || selectedBatch.batch_number },
                          { label: "Material", value: line.material || "N/A" },
                          { label: "Available qty", value: batchStock[selectedBatch.id]?.quantity ?? 0 },
                          { label: "Unit price", value: formatINR(line.pricePerUnit || 0) },
                        ]}
                      />
                    ) : null}

                    {line.productId && line.batchId ? (
                      <LineFigures
                        items={[
                          ["Net", formatINR(lineTotal.netValue)],
                          ["CGST", formatINR(lineTotal.cgst)],
                          ["SGST", formatINR(lineTotal.sgst)],
                          ["IGST", formatINR(lineTotal.igst)],
                          ["Total", formatINR(lineTotal.total), true],
                        ]}
                      />
                    ) : null}
                  </fieldset>
                );
              })}
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <TotalsSummary
              className="w-full sm:max-w-sm"
              rows={[
                ["Net value", orderTotals.netValue],
                ["CGST", orderTotals.cgst],
                ["SGST", orderTotals.sgst],
                ["IGST", orderTotals.igst],
              ]}
              grand={["Grand total", orderTotals.total]}
            />
          </div>
        </form>
      </Modal>

      {/* View details */}
      <Drawer
        open={showViewModal && Boolean(viewingOrder)}
        onClose={closeView}
        size="lg"
        title={viewingOrder ? `Sales order ${viewingOrder.order_number || `#${viewingOrder.id}`}` : "Sales order"}
        description={viewingOrder?.customerName || undefined}
        footer={
          viewingOrder ? (
            <>
              <Button variant="secondary" leftIcon={Download} onClick={() => handleDownload(viewingOrder)}>
                Download
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
            <section aria-labelledby="so-info">
              <SectionHeader as="h3" title={<span id="so-info">Order information</span>} />
              <InfoGrid
                items={[
                  { label: "Order ID", value: viewingOrder.id },
                  { label: "Order date", value: viewingOrder.orderDate ? formatDate(viewingOrder.orderDate) : "N/A" },
                  { label: "Payment method", value: viewingOrder.paymentMethod || "N/A" },
                  { label: "Status", value: <StatusBadge status={getOrderStatus(viewingOrder)} domain="salesOrder" /> },
                  { label: "Expected delivery", value: viewingOrder.expectedDeliveryDate ? formatDate(viewingOrder.expectedDeliveryDate) : "N/A" },
                  { label: "Description", value: viewingOrder.description || "N/A" },
                ]}
              />
            </section>
            <section aria-labelledby="so-customer">
              <SectionHeader as="h3" title={<span id="so-customer">Customer information</span>} />
              <InfoGrid
                columns="sm:grid-cols-2"
                items={[
                  { label: "Customer", value: viewingOrder.customerName || "N/A" },
                  { label: "Address", value: viewingOrder.address || "N/A" },
                  { label: "Billing address", value: viewingOrder.billingAddress || "Same as address" },
                  { label: "Shipping address", value: viewingOrder.shippingAddress || "Same as address" },
                ]}
              />
            </section>
            <section aria-labelledby="so-items">
              <SectionHeader as="h3" title={<span id="so-items">Line items</span>} />
              {viewLines.length > 0 ? <DetailTable caption="Sales order line items" columns={viewColumns} rows={viewLines} /> : <p className="rounded-card border border-line px-4 py-6 text-center text-body text-ink-muted">No line items</p>}
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
