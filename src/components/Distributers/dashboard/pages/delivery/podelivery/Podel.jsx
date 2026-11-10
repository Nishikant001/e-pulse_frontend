import { escapeHtml } from "../../../../../../utils/escapeHtml";
import React, { useState, useEffect } from "react";
import { Download, Eye, FileText, Package, Pencil, Plus, Printer, Save, Search, Undo2 } from "lucide-react";
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

import { authFetch } from "../../../../../../utils/authFetch";
const api = {
  po: {
    getByNumber(poNumber) {
      return authFetch(`/purchaseorder/number/${poNumber}`);
    },
  },

  delivery: {
    getAll() {
      return authFetch("/po-delivery");
    },
    getById(id) {
      return authFetch(`/po-delivery/${id}`);
    },
    create(data) {
      return authFetch("/po-delivery", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    update(id, data) {
      return authFetch(`/po-delivery/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    delete(id) {
      return authFetch(`/po-delivery/${id}`, {
        method: "DELETE",
      });
    },
  },
};

const PODeliveryManagement = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("list");
  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const [formData, setFormData] = useState({
    order_number: "",
    deliveryDate: new Date().toISOString().split("T")[0],
    remarks: "",
    lines: [],
  });

  const [editData, setEditData] = useState({
    deliveryDate: "",
    remarks: "",
    status: "Pending",
  });

  const [orderDetails, setOrderDetails] = useState(null);
  const [productBatches, setProductBatches] = useState([]); // all existing batches, filtered per-line by productId
  const [newBatchDraft, setNewBatchDraft] = useState({}); // orderLineId -> { batch_no, exp_date }

  useEffect(() => {
    authFetch("/stock")
      .then((data) => setProductBatches(Array.isArray(data) ? data : []))
      .catch(() => setProductBatches([]));
  }, []);

  const getBatchesForProduct = (productId) =>
    productBatches.filter((b) => b.productId === productId && b.status !== "inactive");

  // Purchase receiving often introduces a brand-new batch (unlike sales,
  // where batches must already exist). This creates one via the existing
  // Batch master endpoint, then selects it for the line — no separate
  // batch mechanism, just reusing /stock.
  const createBatchForLine = async (index, productId) => {
    const draft = newBatchDraft[index];
    if (!draft?.batch_no) {
      showNotification("Enter a batch number first", "error");
      return;
    }
    try {
      const batch = await authFetch("/stock", {
        method: "POST",
        body: JSON.stringify({
          batch_no: draft.batch_no,
          productId,
          exp_date: draft.exp_date || null,
          status: "active",
        }),
      });
      setProductBatches((prev) => [...prev, batch]);
      updateLineBatch(index, batch.id);
      showNotification(`Batch ${draft.batch_no} created`, "success");
    } catch (error) {
      showNotification(error.message || "Failed to create batch", "error");
    }
  };

  const updateLineBatch = (index, batchId) => {
    setFormData((prev) => {
      const lines = [...prev.lines];
      lines[index] = { ...lines[index], batchId: batchId ? Number(batchId) : null };
      return { ...prev, lines };
    });
  };

 useEffect(() => {
  const fetchOrderDetails = async () => {
    if (!formData.order_number || formData.order_number.length < 1) {
      setOrderDetails(null);
      setFormData((prev) => ({ ...prev, lines: [] }));
      return;
    }

    setOrderLoading(true);
    try {
      const data = await api.po.getByNumber(formData.order_number);

      setOrderDetails(data);

    const initialLines =
  data.lines?.map((line) => ({
    orderLineId: line.id,
    productId: line.productId,
    productName: line.product?.name || "Unknown Product",
    materialCode: line.material_code || "N/A",
    orderedQty: line.quantity || 0,
    receivedQty: line.receivedQuantity ?? 0,
    quantityReceived: 0,
    maxQty: line.remainingQuantity ?? line.quantity ?? 0,
    pricePerUnit: line.pricePerUnit || 0,
    lineNetValue: line.lineNetValue || 0,
    batchId: null,
  })) || [];


      setFormData((prev) => ({ ...prev, lines: initialLines }));
      if (!["CONFIRMED", "PARTIALLY_RECEIVED"].includes(data.status)) {
        showNotification(
          `This PO is ${data.status || "DRAFT"} and cannot be received against. It must be CONFIRMED first.`,
          "error"
        );
      } else {
        showNotification("Purchase order details loaded successfully", "success");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      setOrderDetails(null);
      setFormData((prev) => ({ ...prev, lines: [] }));
      showNotification("Purchase order not found", "error");
    } finally {
      setOrderLoading(false);
    }
  };

  const timeoutId = setTimeout(fetchOrderDetails, 500);
  return () => clearTimeout(timeoutId);
}, [formData.order_number]);


  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const data = await api.delivery.getAll();
setDeliveries(Array.isArray(data) ? data : []);

    } catch (error) {
      console.error("Error fetching deliveries:", error);
      showNotification(error.message || "Failed to fetch deliveries", "error");
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

 const fetchDeliveryDetails = async (id) => {
  setLoading(true);
  try {
    const deliveryData = await api.delivery.getById(id);

    if (deliveryData.order_number) {
      const orderData = await api.po.getByNumber(
        deliveryData.order_number
      );
      deliveryData.orderDetails = orderData;
    }

    setSelectedDelivery(deliveryData);
  } catch (error) {
    console.error("Error fetching delivery details:", error);
    showNotification(error.message || "Failed to fetch delivery details", "error");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    if (activeTab === "list") {
      fetchDeliveries();
    }
  }, [activeTab]);

  const showNotification = (message, type = "info") => {
    if (type === "success") toast.success(message);
    else if (type === "error") toast.error(message);
    else toast.info(message);
  };

 const handleSubmit = async () => {
 const validLines = formData.lines.filter(
  (line) =>
    line.quantityReceived > 0 &&
    line.quantityReceived <= line.maxQty
);

  if (validLines.length === 0) {
    showNotification("Please enter at least one received quantity", "error");
    return;
  }
  const missingBatch = validLines.find((l) => !l.batchId);
  if (missingBatch) {
    showNotification(`Select or create a batch for ${missingBatch.materialCode}`, "error");
    return;
  }

  setLoading(true);
  try {
    await api.delivery.create({
      order_number: formData.order_number,
      deliveryDate: formData.deliveryDate,
      remarks: formData.remarks,
      lines: validLines,
    });

    showNotification("Purchase delivery created successfully", "success");

    setFormData({
      order_number: "",
      deliveryDate: new Date().toISOString().split("T")[0],
      remarks: "",
      lines: [],
    });

    setOrderDetails(null);
    setActiveTab("list");
    fetchDeliveries();
  } catch (error) {
    console.error(error);
    showNotification(
      error.message || "Failed to create delivery",
      "error"
    );
  } finally {
    setLoading(false);
  }
};


  const handleUpdate = async () => {
  setLoading(true);
  try {
    await api.delivery.update(selectedDelivery.id, editData);

    showNotification("Delivery updated successfully", "success");
    setShowEditModal(false);
    fetchDeliveries();
  } catch (error) {
    console.error(error);
    showNotification(
      error.message || "Failed to update delivery",
      "error"
    );
  } finally {
    setLoading(false);
  }
};


  const handleDelete = async () => {
  setLoading(true);
  try {
    await api.delivery.delete(selectedDelivery.id);

    showNotification("Delivery deleted successfully", "success");
    setShowDeleteModal(false);
    fetchDeliveries();
  } catch (error) {
    console.error("Error cancelling delivery:", error);
    showNotification(error.message || "Error cancelling delivery", "error");
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
      deliveryDate: delivery.deliveryDate?.split("T")[0] || "",
      remarks: delivery.remarks || "",
      status: delivery.status || "Pending",
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDeleteModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const downloadDeliveryNote = (delivery) => {
    const content = generateDeliveryNote(delivery);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PO_Delivery_${delivery.id}_${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification("Goods receipt note downloaded", "success");
  };

  const generateDeliveryNote = (delivery) => {
    const orderDetails = delivery.orderDetails || {};
    const lines =
      delivery.lines
        ?.map(
          (line, idx) =>
            `${(idx + 1)
              .toString()
              .padStart(3, "0")}  ${line.material_code?.padEnd(
              15,
              " "
            )}  ${line.product?.name?.padEnd(30, " ")}  ${line.quantityReceived
              .toString()
              .padStart(8, " ")}`
        )
        .join("\n") || "";

    return `
═══════════════════════════════════════════════════════════════════════════
                          GOODS RECEIPT NOTE
═══════════════════════════════════════════════════════════════════════════

GR Document     : ${delivery.id}
PO Reference    : ${delivery.order_number}
Receipt Date    : ${new Date(delivery.deliveryDate).toLocaleDateString()}
Status          : ${delivery.status || "Pending"}

───────────────────────────────────────────────────────────────────────────
Vendor Information
───────────────────────────────────────────────────────────────────────────
Vendor Name     : ${
      delivery.order?.vendor?.name || orderDetails.vendorName || "N/A"
    }
Address         : ${orderDetails.address || "N/A"}
Payment Method  : ${orderDetails.paymentMethod || "N/A"}

───────────────────────────────────────────────────────────────────────────
Goods Received
───────────────────────────────────────────────────────────────────────────
Pos  Material Code   Product Name                   Quantity Received
───────────────────────────────────────────────────────────────────────────
${lines}
───────────────────────────────────────────────────────────────────────────

Total Items     : ${delivery.lines?.length || 0}
Total Quantity  : ${
      delivery.lines?.reduce((sum, l) => sum + (l.quantityReceived || 0), 0) ||
      0
    }

───────────────────────────────────────────────────────────────────────────
Financial Summary
───────────────────────────────────────────────────────────────────────────
Net Value       : ${formatCurrency(orderDetails.netValue)}
CGST (${orderDetails.cgst || 0}%)      : ${formatCurrency(
      orderDetails.cgstAmount
    )}
SGST (${orderDetails.sgst || 0}%)      : ${formatCurrency(
      orderDetails.sgstAmount
    )}
IGST (${orderDetails.igst || 0}%)      : ${formatCurrency(
      orderDetails.igstAmount
    )}
───────────────────────────────────────────────────────────────────────────
Total Amount    : ${formatCurrency(orderDetails.totalAmount)}
═══════════════════════════════════════════════════════════════════════════

Remarks         : ${delivery.remarks || "None"}

═══════════════════════════════════════════════════════════════════════════
Generated on ${new Date().toLocaleString()}
═══════════════════════════════════════════════════════════════════════════
    `.trim();
  };

  const printDeliveryNote = (delivery) => {
    const content = generateDeliveryNote(delivery);
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Goods Receipt ${delivery.id}</title>
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
    newLines[index].quantityReceived = Math.min(qty, newLines[index].maxQty);
    setFormData({ ...formData, lines: newLines });
  };

  const CAN_RECEIVE = ["CONFIRMED", "PARTIALLY_RECEIVED"];
  const orderOk = Boolean(orderDetails) && CAN_RECEIVE.includes(orderDetails.status);
  const resetCreate = () => {
    setFormData({ order_number: "", deliveryDate: new Date().toISOString().split("T")[0], remarks: "", lines: [] });
    setOrderDetails(null);
  };
  const indexedLines = formData.lines.map((l, i) => ({ ...l, _index: i }));
  const setDraft = (index, key) => (value) => setNewBatchDraft((prev) => ({ ...prev, [index]: { ...prev[index], [key]: value } }));

  const lineColumns = [
    { key: "item", header: "Item", render: (l) => <span className="font-mono text-ink-muted">{String(l._index + 1).padStart(3, "0")}</span> },
    { key: "material", header: "Material", render: (l) => <span className="font-mono">{l.materialCode}</span> },
    { key: "desc", header: "Description", render: (l) => <span className="font-medium">{l.productName}</span> },
    { key: "ordered", header: "PO qty", align: "right", render: (l) => formatNumber(l.orderedQty) },
    { key: "received", header: "Already received", align: "right", render: (l) => <span className="text-success-700">{formatNumber(l.receivedQty)}</span> },
    { key: "remaining", header: "Remaining", align: "right", render: (l) => <span className="font-medium text-warning-700">{formatNumber(l.maxQty)}</span> },
    {
      key: "batch",
      header: "Batch",
      render: (l) => (
        <div className="w-64 space-y-2">
          <Select
            size="sm"
            aria-label={`Batch for ${l.productName}`}
            value={l.batchId || ""}
            onChange={(e) => updateLineBatch(l._index, e.target.value)}
            placeholder="Select batch…"
            options={getBatchesForProduct(l.productId).map((b) => ({ value: b.id, label: b.batch_no }))}
          />
          <div className="flex items-center gap-1">
            <Input aria-label="New batch number" placeholder="New batch no." value={newBatchDraft[l._index]?.batch_no || ""} onChange={(e) => setDraft(l._index, "batch_no")(e.target.value)} />
            <Input type="date" aria-label="New batch expiry date" value={newBatchDraft[l._index]?.exp_date || ""} onChange={(e) => setDraft(l._index, "exp_date")(e.target.value)} />
            <Button size="sm" variant="secondary" leftIcon={Plus} onClick={() => createBatchForLine(l._index, l.productId)}>
              Add
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: "qty",
      header: "Receive qty",
      align: "right",
      render: (l) => (
        <Input type="number" min="0" max={l.maxQty} aria-label={`Receive quantity for ${l.productName}`} value={l.quantityReceived} onChange={(e) => updateLineQuantity(l._index, e.target.value)} wrapperClassName="ml-auto w-28" className="text-right" />
      ),
    },
  ];

  const listColumns = [
    { key: "id", header: "GR doc", sortable: true, render: (v, d) => (
      <button type="button" onClick={() => handleView(d)} className="font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button>
    ) },
    { key: "order_number", header: "PO number", sortable: true },
    { key: "deliveryDate", header: "Document date", sortable: true, render: (v) => formatDate(v) },
    { key: "items", header: "Items", align: "right", accessor: (d) => d.lines?.length || 0 },
    { key: "status", header: "Status", sortable: true, render: (v) => <StatusBadge status={v} domain="delivery" /> },
  ];
  const listActions = (d) => [
    { key: "view", label: "View document", icon: Eye, onClick: () => handleView(d) },
    { key: "print", label: "Print", icon: Printer, onClick: () => printDeliveryNote(d) },
    { key: "download", label: "Download", icon: Download, onClick: () => downloadDeliveryNote(d) },
  ]; // View only: deliveries are posted (and reversed) by your administrator.

  const viewLines = (selectedDelivery?.lines || []).map((l, i) => ({ ...l, _index: i }));
  const viewColumns = [
    { key: "item", header: "Item", render: (l) => <span className="font-mono text-ink-muted">{String(l._index + 1).padStart(3, "0")}</span> },
    { key: "material", header: "Material", render: (l) => <span className="font-mono">{l.material_code || "N/A"}</span> },
    { key: "desc", header: "Description", render: (l) => <span className="font-medium">{l.product?.name || "Unknown"}</span> },
    { key: "qty", header: "Quantity", align: "right", render: (l) => formatNumber(l.quantityReceived) },
  ];
  const od = selectedDelivery?.orderDetails;

  const createTab = (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader title="Create goods receipt for purchase order" subtitle="Enter a confirmed PO number to load its items." />
        <CardBody className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Purchase order number"
              required
              leftIcon={Search}
              disabled={Boolean(orderDetails)}
              value={formData.order_number}
              onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
              placeholder="Enter PO number"
              hint={orderLoading ? "Looking up the purchase order…" : undefined}
            />
            <DatePicker label="Document date" required value={formData.deliveryDate} onChange={(v) => setFormData({ ...formData, deliveryDate: v })} />
          </div>

          {orderDetails ? (
            <div className="space-y-4">
              <div className="rounded-card border border-line bg-surface-muted p-4">
                <p className="mb-3 text-body font-semibold text-ink">Purchase order</p>
                <InfoGrid
                  columns="sm:grid-cols-2 lg:grid-cols-4"
                  items={[
                    { label: "Vendor", value: orderDetails.vendorName || orderDetails.vendor?.name || "N/A" },
                    { label: "Order date", value: formatDate(orderDetails.orderDate) },
                    { label: "Items", value: formatNumber(orderDetails.lines?.length || 0) },
                    { label: "PO status", value: <Badge tone={orderOk ? "success" : "error"}>{orderDetails.status || "DRAFT"}</Badge> },
                  ]}
                />
              </div>
              <div className="flex justify-end">
                <TotalsSummary
                  className="w-full sm:max-w-sm"
                  rows={[
                    ["Net value", Number(orderDetails.netValue || 0)],
                    [`CGST (${orderDetails.cgst || 0}%)`, Number(orderDetails.cgstAmount || 0)],
                    [`SGST (${orderDetails.sgst || 0}%)`, Number(orderDetails.sgstAmount || 0)],
                    [`IGST (${orderDetails.igst || 0}%)`, Number(orderDetails.igstAmount || 0)],
                  ]}
                  grand={["Total amount", Number(orderDetails.totalAmount || 0)]}
                />
              </div>
            </div>
          ) : null}

          <Textarea label="Header text / remarks" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} rows={2} placeholder="Enter remarks or notes…" />

          {orderDetails && !orderOk ? (
            <Alert tone="error">PO status is {orderDetails.status || "DRAFT"} — it must be CONFIRMED before it can be received against.</Alert>
          ) : null}
        </CardBody>
      </Card>

      {formData.lines.length > 0 ? (
        <Card>
          <CardHeader title="Material items" subtitle="Select an existing batch, or add a new one, for every line you receive." />
          <CardBody>
            <DetailTable caption="Material items" columns={lineColumns} rows={indexedLines} rowKey="_index" />
          </CardBody>
        </Card>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={resetCreate}>Cancel</Button>
        <Button leftIcon={Save} onClick={handleSubmit} loading={loading} disabled={!orderOk || formData.lines.every((l) => l.quantityReceived === 0)}>
          Post goods receipt
        </Button>
      </div>
    </div>
  );

  const listTab = (
    <div className="pt-4">
      <Card>
        <CardHeader title="Goods receipt documents" subtitle="All goods receipts posted against purchase orders." />
        <DataTable
          bare
          rowKey="id"
          caption="Goods receipts"
          columns={listColumns}
          data={deliveries}
          loading={loading}
          searchable
          searchPlaceholder="Search GR doc or PO number"
          rowActions={listActions}
          responsive="cards"
          cardTitleKey="id"
          emptyIcon={Package}
          emptyTitle="No goods receipts found"
          emptyDescription="Create your first goods receipt to get started."
        />
      </Card>
    </div>
  );

  return (
    <div>
      <PageHeader title="Purchase Deliveries" description="Goods your administrator has delivered against your purchase orders. Stock is added to your inventory when a delivery is posted. View only." />

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "list", label: "Goods receipt overview", icon: FileText, content: listTab },
        ]}
      />

      <Drawer
        open={showViewModal && Boolean(selectedDelivery)}
        onClose={() => setShowViewModal(false)}
        size="lg"
        title={selectedDelivery ? `Goods receipt ${selectedDelivery.id}` : "Goods receipt"}
        description={selectedDelivery?.order_number ? `Purchase order ${selectedDelivery.order_number}` : undefined}
        footer={
          selectedDelivery ? (
            <>
              <Button variant="secondary" leftIcon={Printer} onClick={() => printDeliveryNote(selectedDelivery)}>Print</Button>
              <Button variant="secondary" leftIcon={Download} onClick={() => downloadDeliveryNote(selectedDelivery)}>Download</Button>
              <Button variant="ghost" onClick={() => setShowViewModal(false)}>Close</Button>
            </>
          ) : undefined
        }
      >
        {selectedDelivery ? (
          <div className="space-y-6">
            <section>
              <SectionHeader as="h3" title="Document information" />
              <InfoGrid
                items={[
                  { label: "Material document", value: selectedDelivery.id },
                  { label: "Purchase order", value: selectedDelivery.order_number },
                  { label: "Document date", value: formatDate(selectedDelivery.deliveryDate) },
                  { label: "Status", value: <StatusBadge status={selectedDelivery.status} domain="delivery" /> },
                  { label: "Posting date", value: formatDate(selectedDelivery.createdAt) },
                  { label: "Header text", value: selectedDelivery.remarks || "None" },
                ]}
              />
            </section>
            {od ? (
              <section>
                <SectionHeader as="h3" title="Reference purchase order" />
                <InfoGrid
                  columns="sm:grid-cols-3"
                  items={[
                    { label: "Vendor", value: od.vendorName || "N/A" },
                    { label: "Order date", value: formatDate(od.orderDate) },
                    { label: "Total amount", value: formatINR(od.totalAmount) },
                  ]}
                />
              </section>
            ) : null}
            <section>
              <SectionHeader as="h3" title="Line items" />
              <DetailTable caption="Goods receipt line items" columns={viewColumns} rows={viewLines} rowKey="_index" />
            </section>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={showEditModal && Boolean(selectedDelivery)}
        onClose={() => setShowEditModal(false)}
        title="Edit goods receipt"
        description={selectedDelivery ? `Material document ${selectedDelivery.id}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button leftIcon={Save} onClick={handleUpdate} loading={loading}>Update</Button>
          </>
        }
      >
        <div className="space-y-4">
          <DatePicker label="Document date" value={editData.deliveryDate} onChange={(v) => setEditData({ ...editData, deliveryDate: v })} />
          <Select
            label="Status"
            value={editData.status}
            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
            options={["Pending", "Received", "Cancelled"].map((s) => ({ value: s, label: s }))}
          />
          <Textarea label="Header text" value={editData.remarks} onChange={(e) => setEditData({ ...editData, remarks: e.target.value })} rows={3} />
        </div>
      </Modal>

      <ConfirmationModal
        open={showDeleteModal && Boolean(selectedDelivery)}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        loading={loading}
        tone="danger"
        title="Reverse goods receipt?"
        confirmLabel="Reverse document"
        cancelLabel="Keep document"
        message={
          selectedDelivery ? (
            <p>
              This will reverse material document <strong>{selectedDelivery.id}</strong> for purchase order <strong>{selectedDelivery.order_number}</strong>. This action cannot be undone.
            </p>
          ) : null
        }
      />
    </div>
  );
};

export default PODeliveryManagement;
