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

export default function SalesReturnPage() {
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

  const [form, setForm] = useState({ invoiceId: "", reason: "", lines: {} }); // lines: { [invoiceLineId]: { quantity, batchId } }

  useEffect(() => {
    fetchReturns();
    authFetch("/stockLedger/batch").then((d) => setBatchStock(Array.isArray(d) ? d : [])).catch(() => setBatchStock([]));
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authFetch("/sales-return");
      setReturns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching sales returns:", err);
      setError(err.message || "Failed to load sales returns");
    } finally {
      setLoading(false);
    }
  };

  const getBatchesForProduct = (productId) =>
    batchStock.filter((b) => b.productId === productId && !b.isExpired && !b.isOutOfStock);

  const openCreateForm = async () => {
    setView("create");
    setForm({ invoiceId: "", reason: "", lines: {} });
    setSelectedInvoice(null);
    try {
      const data = await authFetch("/sales-invoice");
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
      const invoice = await authFetch(`/sales-invoice/${invoiceId}`);
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
      await authFetch("/sales-return", {
        method: "POST",
        body: JSON.stringify({ invoiceId: Number(form.invoiceId), lines, reason: form.reason }),
      });
      setView("list");
      fetchReturns();
    } catch (err) {
      console.error("Error creating sales return:", err);
      setError(err.message || "Failed to create sales return");
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (id) => {
    if (!(await confirm({ title: "Post return?", message: "This adds the stock back in and posts the linked credit note.", confirmLabel: "Post return" }))) return;
    setRowActionId(id);
    try {
      await authFetch(`/sales-return/${id}/post`, { method: "POST" });
      fetchReturns();
    } catch (err) {
      toast.error(err.message || "Failed to post sales return", { title: "Action failed" });
    } finally {
      setRowActionId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!(await confirm({ title: "Cancel draft return?", message: "Cancel this DRAFT return?", tone: "danger", confirmLabel: "Cancel return", cancelLabel: "Keep it" }))) return;
    setRowActionId(id);
    try {
      await authFetch(`/sales-return/${id}/cancel`, { method: "POST" });
      fetchReturns();
    } catch (err) {
      toast.error(err.message || "Failed to cancel sales return", { title: "Action failed" });
    } finally {
      setRowActionId(null);
    }
  };

  const handleView = async (id) => {
    try {
      const data = await authFetch(`/sales-return/${id}`);
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
          title={`Sales return ${selectedReturn.return_number || ""}`}
          description="Goods returned by a customer against a posted invoice."
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
              Stock added back in and linked Credit Note #{selectedReturn.creditNoteId} posted.
            </Alert>
          ) : null}
          <Card>
            <CardHeader title="Return information" />
            <CardBody>
              <InfoGrid
                items={[
                  { label: "Customer", value: selectedReturn.customer?.name || "N/A" },
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
    const remainingOf = (line) => line.remainingCreditableQuantity ?? line.quantity;
    const lineColumns = [
      { key: "product", header: "Product", render: (l) => <span className="font-medium">{l.product?.name || "N/A"}</span> },
      { key: "base", header: "Sold", align: "right", render: (l) => formatNumber(l.quantity) },
      { key: "consumed", header: "Already returned / credited", align: "right", render: (l) => <span className="text-ink-muted">{formatNumber(l.consumedQuantity ?? 0)}</span> },
      { key: "remaining", header: "Remaining", align: "right", render: (l) => <span className="font-medium text-warning-700">{formatNumber(remainingOf(l))}</span> },
      {
        key: "batch",
        header: "Return batch",
        render: (l) => (
          <Select
            size="sm"
            aria-label={`Batch for ${l.product?.name || "item"}`}
            value={form.lines[l.id]?.batchId || ""}
            onChange={(e) => updateLine(l.id, "batchId", e.target.value, remainingOf(l))}
            disabled={remainingOf(l) <= 0}
            placeholder="Select batch"
            wrapperClassName="w-48"
            options={getBatchesForProduct(l.productId).map((b) => ({ value: b.batchId, label: b.batchNo }))}
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
          title="New sales return"
          description="Return goods from a posted sales invoice. Posting adds the stock back and posts the linked credit note."
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
                label="Select invoice"
                value={form.invoiceId}
                onChange={(e) => handleSelectInvoice(e.target.value)}
                placeholder="Select an invoice"
                wrapperClassName="max-w-xl"
                options={invoices.map((inv) => ({ value: inv.id, label: `${inv.invoice_number} — ${inv.customer?.name || "N/A"}` }))}
              />
            </CardBody>
          </Card>
          {selectedInvoice ? (
            <Card>
              <CardHeader title="Return quantities" subtitle="Choose a batch and the quantity to return for each line." />
              <CardBody className="space-y-4">
                
                <DetailTable caption="Invoice lines available for return" columns={lineColumns} rows={selectedInvoice.lines || []} />
                <Input label="Reason" value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} placeholder="e.g. Damaged in transit, wrong item" wrapperClassName="max-w-xl" />
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
    { key: "customer", header: "Customer", sortable: true, accessor: (r) => r.customer?.name || "N/A" },
    { key: "reason", header: "Reason", accessor: (r) => r.reason || "-" },
    { key: "status", header: "Status", sortable: true, accessor: (r) => r.status, render: (v) => <StatusBadge status={v} domain="invoice" /> },
  ];
  const rowActions = (r) => {
    const items = [{ key: "view", label: "View details", icon: Eye, onClick: () => handleView(r.id) }];
    if (r.status === "DRAFT") {
      items.push(
        { key: "post", label: "Post return", icon: CircleCheck, disabled: rowActionId === r.id, hint: "Adds stock back and posts the credit note", onClick: () => handlePost(r.id) },
        { key: "sep", divider: true },
        { key: "cancel", label: "Cancel draft", icon: Ban, danger: true, disabled: rowActionId === r.id, onClick: () => handleCancel(r.id) },
      );
    }
    return items;
  };

  return (
    <div>
      <PageHeader
        title="Sales returns"
        description="Goods returned by customers against posted sales invoices."
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
          caption="Sales returns"
          columns={columns}
          data={returns}
          loading={loading && returns.length === 0}
          searchable
          searchPlaceholder="Search number, customer, reason"
          rowActions={rowActions}
          responsive="cards"
          cardTitleKey="number"
          emptyIcon={RotateCcw}
          emptyTitle="No sales returns yet"
          emptyDescription="Sales returns you create will appear here."
        />
      </Card>
    </div>
  );
}
