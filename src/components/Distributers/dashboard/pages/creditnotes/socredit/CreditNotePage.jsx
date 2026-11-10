import React, { useEffect, useState } from "react";
import { ArrowLeft, Ban, CircleCheck, Eye, FileText, Plus } from "lucide-react";

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
import { TotalsSummary } from "../../../shared/DocParts";
import { authFetch } from "../../../../../../utils/authFetch";

export default function CreditNotePage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [view, setView] = useState("list"); // list | create | detail
  const [notes, setNotes] = useState([]);
  const [invoices, setInvoices] = useState([]); // POSTED invoices eligible for credit
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rowActionId, setRowActionId] = useState(null);

  const [form, setForm] = useState({ invoiceId: "", reason: "", lines: {} }); // lines: { [invoiceLineId]: quantity }

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authFetch("/sales-creditnote");
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching credit notes:", err);
      setError(err.message || "Failed to load credit notes");
    } finally {
      setLoading(false);
    }
  };

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

  const updateLineQty = (invoiceLineId, qty, max) => {
    const value = Math.max(0, Math.min(Number(qty) || 0, max));
    setForm((prev) => ({ ...prev, lines: { ...prev.lines, [invoiceLineId]: value } }));
  };

  const handleCreate = async () => {
    const lines = Object.entries(form.lines)
      .filter(([, qty]) => qty > 0)
      .map(([invoiceLineId, quantity]) => ({ invoiceLineId: Number(invoiceLineId), quantity }));

    if (!form.invoiceId || lines.length === 0) {
      setError("Select an invoice and enter at least one credit quantity");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await authFetch("/sales-creditnote", {
        method: "POST",
        body: JSON.stringify({ invoiceId: Number(form.invoiceId), lines, reason: form.reason }),
      });
      setView("list");
      fetchNotes();
    } catch (err) {
      console.error("Error creating credit note:", err);
      setError(err.message || "Failed to create credit note");
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (id) => {
    if (!(await confirm({ title: "Post credit note?", message: "This creates the accounting entries and makes the credit note immutable.", confirmLabel: "Post credit note" }))) return;
    setRowActionId(id);
    try {
      await authFetch(`/sales-creditnote/${id}/post`, { method: "POST" });
      fetchNotes();
      if (selectedNote?.id === id) handleView(id);
    } catch (err) {
      toast.error(err.message || "Failed to post credit note", { title: "Unable to post" });
    } finally {
      setRowActionId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!(await confirm({ title: "Cancel draft credit note?", message: "Cancel this DRAFT credit note?", tone: "danger", confirmLabel: "Cancel credit note", cancelLabel: "Keep it" }))) return;
    setRowActionId(id);
    try {
      await authFetch(`/sales-creditnote/${id}/cancel`, { method: "POST" });
      fetchNotes();
    } catch (err) {
      toast.error(err.message || "Failed to cancel credit note", { title: "Unable to cancel" });
    } finally {
      setRowActionId(null);
    }
  };

  const handleView = async (id) => {
    try {
      const note = await authFetch(`/sales-creditnote/${id}`);
      setSelectedNote(note);
      setView("detail");
    } catch (err) {
      toast.error(err.message || "Failed to load credit note", { title: "Unable to open" });
    }
  };

  const backToList = () => {
    setView("list");
    setError("");
  };
  const backButton = (
    <Button variant="secondary" leftIcon={ArrowLeft} onClick={backToList}>
      Back to credit notes
    </Button>
  );

  // ---------------- DETAIL VIEW ----------------
  if (view === "detail" && selectedNote) {
    const lineColumns = [
      { key: "product", header: "Product", render: (l) => <span className="font-medium">{l.product?.name || "N/A"}</span> },
      { key: "quantity", header: "Qty", align: "right", render: (l) => formatNumber(l.quantity) },
      { key: "rate", header: "Rate", align: "right", render: (l) => formatINR(l.pricePerUnit) },
      { key: "total", header: "Total", align: "right", render: (l) => <span className="font-medium">{formatINR(l.lineTotal)}</span> },
    ];
    return (
      <div>
        <PageHeader
          title={`Credit note ${selectedNote.credit_note_number || ""}`}
          description="Credit note against a posted sales invoice."
          meta={<StatusBadge status={selectedNote.status} domain="invoice" />}
          actions={
            <>
              {backButton}
              {selectedNote.status === "DRAFT" ? (
                <Button leftIcon={CircleCheck} onClick={() => handlePost(selectedNote.id)} loading={rowActionId === selectedNote.id}>
                  Post credit note
                </Button>
              ) : null}
            </>
          }
        />
        <div className="space-y-4">
          <Card>
            <CardHeader title="Credit note information" />
            <CardBody>
              <InfoGrid
                items={[
                  { label: "Customer", value: selectedNote.customer?.name || "N/A" },
                  { label: "Reason", value: selectedNote.reason || "N/A" },
                ]}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Credited items" />
            <CardBody className="space-y-4">
              <DetailTable caption="Credit note lines" columns={lineColumns} rows={selectedNote.lines || []} />
              <div className="flex justify-end">
                <TotalsSummary
                  className="w-full sm:max-w-sm"
                  rows={[
                    ["Taxable value", Number(selectedNote.netValue || 0)],
                    ["CGST", Number(selectedNote.cgstAmount || 0)],
                    ["SGST", Number(selectedNote.sgstAmount || 0)],
                    ["IGST", Number(selectedNote.igstAmount || 0)],
                  ]}
                  grand={["Total", Number(selectedNote.totalAmount || 0)]}
                />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  // ---------------- CREATE VIEW ----------------
  if (view === "create") {
    const remainingOf = (line) => line.remainingCreditableQuantity ?? line.quantity;
    const lineColumns = [
      { key: "product", header: "Product", render: (l) => <span className="font-medium">{l.product?.name || "N/A"}</span> },
      { key: "invoiced", header: "Invoiced", align: "right", render: (l) => formatNumber(l.quantity) },
      { key: "consumed", header: "Already credited / returned", align: "right", render: (l) => <span className="text-ink-muted">{formatNumber(l.consumedQuantity ?? 0)}</span> },
      { key: "remaining", header: "Remaining", align: "right", render: (l) => <span className="font-medium text-warning-700">{formatNumber(remainingOf(l))}</span> },
      {
        key: "creditQty",
        header: "Credit qty",
        align: "right",
        render: (l) => (
          <Input
            type="number"
            min="0"
            max={remainingOf(l)}
            aria-label={`Credit quantity for ${l.product?.name || "item"}`}
            value={form.lines[l.id] || ""}
            onChange={(e) => updateLineQty(l.id, e.target.value, remainingOf(l))}
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
          title="New credit note"
          description="Credit part or all of a posted sales invoice. The credit note is created as a draft."
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
            <CardHeader title="Invoice" subtitle="Only posted invoices can be credited." />
            <CardBody>
              <Select
                label="Select invoice"
                value={form.invoiceId}
                onChange={(e) => handleSelectInvoice(e.target.value)}
                placeholder="Select an invoice"
                wrapperClassName="max-w-xl"
                options={invoices.map((inv) => ({ value: inv.id, label: `${inv.invoice_number} — ${inv.customer?.name || "N/A"} — ${formatINR(inv.totalAmount)}` }))}
              />
            </CardBody>
          </Card>
          {selectedInvoice ? (
            <Card>
              <CardHeader title="Credit quantities" subtitle="Enter the quantity to credit for each line (up to the remaining creditable quantity)." />
              <CardBody className="space-y-4">
                <DetailTable caption="Invoice lines available for credit" columns={lineColumns} rows={selectedInvoice.lines || []} />
                <Input label="Reason" value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} placeholder="e.g. Damaged goods, pricing correction" wrapperClassName="max-w-xl" />
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    );
  }

  // ---------------- LIST VIEW ----------------
  const columns = [
    { key: "number", header: "Number", sortable: true, accessor: (n) => n.credit_note_number, render: (v, n) => (
      <button type="button" onClick={() => handleView(n.id)} className="font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button>
    ) },
    { key: "customer", header: "Customer", sortable: true, accessor: (n) => n.customer?.name || "N/A" },
    { key: "reason", header: "Reason", accessor: (n) => n.reason || "-" },
    { key: "status", header: "Status", sortable: true, accessor: (n) => n.status, render: (v) => <StatusBadge status={v} domain="invoice" /> },
    { key: "total", header: "Total", sortable: true, align: "right", accessor: (n) => Number(n.totalAmount || 0), render: (v) => <span className="font-medium tabular-nums">{formatINR(v)}</span> },
  ];
  const rowActions = (n) => {
    const items = [{ key: "view", label: "View details", icon: Eye, onClick: () => handleView(n.id) }];
    if (n.status === "DRAFT") {
      items.push(
        { key: "post", label: "Post credit note", icon: CircleCheck, disabled: rowActionId === n.id, hint: "Creates the accounting entries", onClick: () => handlePost(n.id) },
        { key: "sep", divider: true },
        { key: "cancel", label: "Cancel draft", icon: Ban, danger: true, disabled: rowActionId === n.id, onClick: () => handleCancel(n.id) },
      );
    }
    return items;
  };

  return (
    <div>
      <PageHeader
        title="Credit Notes"
        description="Credit notes issued against posted sales invoices."
        actions={
          <Button leftIcon={Plus} onClick={openCreateForm}>
            New credit note
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
          caption="Credit notes"
          columns={columns}
          data={notes}
          loading={loading && notes.length === 0}
          searchable
          searchPlaceholder="Search number, customer, reason"
          rowActions={rowActions}
          responsive="cards"
          cardTitleKey="number"
          emptyIcon={FileText}
          emptyTitle="No credit notes yet"
          emptyDescription="Credit notes you create will appear here."
        />
      </Card>
    </div>
  );
}
