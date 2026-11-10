import React, { useEffect, useState } from "react";
import { ArrowLeft, Ban, CircleCheck, Eye, Plus, RotateCcw } from "lucide-react";

import Alert from "../../../../../ui/Alert";
import Button from "../../../../../ui/Button";
import Card, { CardBody, CardHeader } from "../../../../../ui/Card";
import Input from "../../../../../ui/Input";
import PageHeader from "../../../../../ui/PageHeader";
import Select from "../../../../../ui/Select";
import StatusBadge from "../../../../../ui/StatusBadge";
import { useConfirm, useToast } from "../../../../../feedback";
import DataTable from "../../../../../tables/DataTable";
import DetailTable from "../../../../../../features/adminSales/components/DetailTable";
import InfoGrid from "../../../../../../features/adminSales/components/InfoGrid";
import { formatINR, formatNumber } from "../../../../../../utils/format";
import { authFetch } from "../../../../../../utils/authFetch";

export default function PurchaseReturnPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [view, setView] = useState("list");
  const [returns, setReturns] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [batchStock, setBatchStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rowActionId, setRowActionId] = useState(null);

  const [form, setForm] = useState({ invoiceId: "", reason: "", lines: {} });

  useEffect(() => {
    fetchReturns();
    authFetch("/stockLedger/batch").then((d) => setBatchStock(Array.isArray(d) ? d : [])).catch(() => setBatchStock([]));
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authFetch("/purchase-return");
      setReturns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching purchase returns:", err);
      setError(err.message || "Failed to load purchase returns");
    } finally {
      setLoading(false);
    }
  };

  const getBatchesForProduct = (productId) => batchStock.filter((b) => b.productId === productId);

  const openCreateForm = async () => {
    setView("create");
    setForm({ invoiceId: "", reason: "", lines: {} });
    setSelectedInvoice(null);
    try {
      const data = await authFetch("/po-invoice");
      setInvoices((Array.isArray(data) ? data : []).filter((inv) => inv.status === "POSTED"));
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  const handleSelectInvoice = async (invoiceId) => {
    setForm((prev) => ({ ...prev, invoiceId, lines: {} }));
    if (!invoiceId) {
      setSelectedInvoice(null);
      return;
    }
    try {
      const invoice = await authFetch(`/po-invoice/${invoiceId}`);
      setSelectedInvoice(invoice);
    } catch (err) {
      console.error("Error fetching invoice details:", err);
      setError(err.message || "Failed to load invoice");
    }
  };

  const updateLine = (invoiceLineId, field, value, max) => {
    setForm((prev) => {
      const current = prev.lines[invoiceLineId] || { quantity: 0, batchId: "" };
      const next = { ...current, [field]: field === "quantity" ? Math.max(0, Math.min(Number(value) || 0, max)) : value };
      return { ...prev, lines: { ...prev.lines, [invoiceLineId]: next } };
    });
  };

  const handleCreate = async () => {
    const lines = Object.entries(form.lines)
      .filter(([, v]) => v.quantity > 0)
      .map(([invoiceLineId, v]) => ({ invoiceLineId: Number(invoiceLineId), quantity: v.quantity, batchId: v.batchId ? Number(v.batchId) : null }));

    if (!form.invoiceId || lines.length === 0) {
      setError("Select an invoice and enter at least one return quantity");
      return;
    }
    if (lines.some((l) => !l.batchId)) {
      setError("Select a batch for every return line");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authFetch("/purchase-return", {
        method: "POST",
        body: JSON.stringify({ invoiceId: Number(form.invoiceId), lines, reason: form.reason }),
      });
      setView("list");
      fetchReturns();
    } catch (err) {
      console.error("Error creating purchase return:", err);
      setError(err.message || "Failed to create purchase return");
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (id) => {
    if (!(await confirm({ title: "Post return?", message: "This removes the stock and posts the linked debit note to the vendor.", confirmLabel: "Post return" }))) return;
    setRowActionId(id);
    try {
      await authFetch(`/purchase-return/${id}/post`, { method: "POST" });
      fetchReturns();
    } catch (err) {
      // Surfaces "insufficient stock" if the goods have already been
      // sold/consumed and can no longer be sent back to the vendor.
      toast.error(err.message || "Failed to post purchase return", { title: "Action failed" });
    } finally {
      setRowActionId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!(await confirm({ title: "Cancel draft return?", message: "Cancel this DRAFT return?", tone: "danger", confirmLabel: "Cancel return", cancelLabel: "Keep it" }))) return;
    setRowActionId(id);
    try {
      await authFetch(`/purchase-return/${id}/cancel`, { method: "POST" });
      fetchReturns();
    } catch (err) {
      toast.error(err.message || "Failed to cancel purchase return", { title: "Action failed" });
    } finally {
      setRowActionId(null);
    }
  };

  const handleView = async (id) => {
    try {
      const data = await authFetch(`/purchase-return/${id}`);
      setSelectedReturn(data);
      setView("detail");
    } catch (err) {
      toast.error(err.message || "Failed to load return", { title: "Action failed" });
    }
  };

  const backToList = () => {
    setView("list");
    setError("");
  };
  const backButton = (
    <Button variant="secondary" leftIcon={ArrowLeft} onClick={backToList}>
      Back to returns
    </Button>
  );

  if (view === "detail" && selectedReturn) {
    const lineColumns = [
      { key: "product", header: "Product", render: (l) => <span className="font-medium">{l.product?.name || "N/A"}</span> },
      { key: "batch", header: "Batch", render: (l) => l.batch?.batch_no || "N/A" },
      { key: "quantity", header: "Qty", align: "right", render: (l) => formatNumber(l.quantity) },
      { key: "rate", header: "Rate", align: "right", render: (l) => formatINR(l.pricePerUnit) },
    ];
    return (
      <div>
        <PageHeader
          title={`Purchase return ${selectedReturn.return_number || ""}`}
          description="Goods sent back to a vendor against a posted purchase invoice."
          meta={<StatusBadge status={selectedReturn.status} domain="invoice" />}
          actions={
            <>
              {backButton}
              {selectedReturn.status === "DRAFT" ? (
                <Button leftIcon={CircleCheck} onClick={() => handlePost(selectedReturn.id)} loading={rowActionId === selectedReturn.id}>
                  Post return
                </Button>
              ) : null}
            </>
          }
        />
        <div className="space-y-4">
          {selectedReturn.status === "POSTED" ? (
            <Alert tone="success">
              Stock removed and linked Debit Note #{selectedReturn.debitNoteId} posted to vendor.
            </Alert>
          ) : null}
          <Card>
            <CardHeader title="Return information" />
            <CardBody>
              <InfoGrid
                items={[
                  { label: "Vendor", value: selectedReturn.vendor?.name || "N/A" },
                  { label: "Reason", value: selectedReturn.reason || "N/A" },
                ]}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Returned items" />
            <CardBody>
              <DetailTable caption="Returned items" columns={lineColumns} rows={selectedReturn.lines || []} />
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  if (view === "create") {
    const remainingOf = (line) => line.remainingReturnableQuantity ?? line.quantity;
    const lineColumns = [
      { key: "product", header: "Product", render: (l) => <span className="font-medium">{l.product?.name || "N/A"}</span> },
      { key: "base", header: "Received", align: "right", render: (l) => formatNumber(l.quantity) },
      { key: "consumed", header: "Already returned", align: "right", render: (l) => <span className="text-ink-muted">{formatNumber(l.consumedQuantity ?? 0)}</span> },
      { key: "remaining", header: "Remaining", align: "right", render: (l) => <span className="font-medium text-warning-700">{formatNumber(remainingOf(l))}</span> },
      {
        key: "batch",
        header: "Batch",
        render: (l) => (
          <Select
            size="sm"
            aria-label={`Batch for ${l.product?.name || "item"}`}
            value={form.lines[l.id]?.batchId || ""}
            onChange={(e) => updateLine(l.id, "batchId", e.target.value, remainingOf(l))}
            disabled={remainingOf(l) <= 0}
            placeholder="Select batch"
            wrapperClassName="w-48"
            options={getBatchesForProduct(l.productId).map((b) => ({ value: b.batchId, label: `${b.batchNo} (${b.quantity} in stock)` }))}
          />
        ),
      },
      {
        key: "returnQty",
        header: "Return qty",
        align: "right",
        render: (l) => (
          <Input
            type="number"
            min="0"
            max={remainingOf(l)}
            aria-label={`Return quantity for ${l.product?.name || "item"}`}
            value={form.lines[l.id]?.quantity || ""}
            onChange={(e) => updateLine(l.id, "quantity", e.target.value, remainingOf(l))}
            disabled={remainingOf(l) <= 0}
            wrapperClassName="ml-auto w-28"
            className="text-right"
          />
        ),
      },
    ];
    return (
      <div>
        <PageHeader
          title="New purchase return"
          description="Return goods from a posted purchase invoice. Posting removes the stock and posts the linked debit note."
          actions={
            <>
              {backButton}
              <Button onClick={handleCreate} loading={loading} disabled={!selectedInvoice}>
                Create draft
              </Button>
            </>
          }
        />
        {error ? (
          <Alert tone="error" className="mb-4" onClose={() => setError("")}>
            {error}
          </Alert>
        ) : null}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Invoice" subtitle="Only posted invoices can be returned." />
            <CardBody>
              <Select
                label="Select purchase invoice"
                value={form.invoiceId}
                onChange={(e) => handleSelectInvoice(e.target.value)}
                placeholder="Select an invoice"
                wrapperClassName="max-w-xl"
                options={invoices.map((inv) => ({ value: inv.id, label: `${inv.invoice_number} — ${inv.vendor?.name || "N/A"}` }))}
              />
            </CardBody>
          </Card>
          {selectedInvoice ? (
            <Card>
              <CardHeader title="Return quantities" subtitle="Choose a batch and the quantity to return for each line." />
              <CardBody className="space-y-4">
                <Alert tone="info">“Remaining” is based on what was received, not current stock. If some units were already sold, posting the return may still fail with an insufficient-stock error.</Alert>
                <DetailTable caption="Invoice lines available for return" columns={lineColumns} rows={selectedInvoice.lines || []} />
                <Input label="Reason" value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} placeholder="e.g. Wrong item shipped, quality issue" wrapperClassName="max-w-xl" />
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    );
  }

  const columns = [
    { key: "number", header: "Number", sortable: true, accessor: (r) => r.return_number, render: (v, r) => (
      <button type="button" onClick={() => handleView(r.id)} className="font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button>
    ) },
    { key: "vendor", header: "Vendor", sortable: true, accessor: (r) => r.vendor?.name || "N/A" },
    { key: "reason", header: "Reason", accessor: (r) => r.reason || "-" },
    { key: "status", header: "Status", sortable: true, accessor: (r) => r.status, render: (v) => <StatusBadge status={v} domain="invoice" /> },
  ];
  const rowActions = (r) => {
    const items = [{ key: "view", label: "View details", icon: Eye, onClick: () => handleView(r.id) }];
    if (r.status === "DRAFT") {
      items.push(
        { key: "post", label: "Post return", icon: CircleCheck, disabled: rowActionId === r.id, hint: "Removes stock and posts the debit note", onClick: () => handlePost(r.id) },
        { key: "sep", divider: true },
        { key: "cancel", label: "Cancel draft", icon: Ban, danger: true, disabled: rowActionId === r.id, onClick: () => handleCancel(r.id) },
      );
    }
    return items;
  };

  return (
    <div>
      <PageHeader
        title="Purchase returns"
        description="Goods sent back to vendors against posted purchase invoices."
        actions={
          <Button leftIcon={Plus} onClick={openCreateForm}>
            New return
          </Button>
        }
      />
      {error ? (
        <Alert tone="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}
      <Card>
        <DataTable
          bare
          rowKey="id"
          caption="Purchase returns"
          columns={columns}
          data={returns}
          loading={loading && returns.length === 0}
          searchable
          searchPlaceholder="Search number, vendor, reason"
          rowActions={rowActions}
          responsive="cards"
          cardTitleKey="number"
          emptyIcon={RotateCcw}
          emptyTitle="No purchase returns yet"
          emptyDescription="Purchase returns you create will appear here."
        />
      </Card>
    </div>
  );
}
