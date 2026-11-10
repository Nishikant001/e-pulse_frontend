import React, { useEffect, useState } from "react";
import { ArrowLeft, Ban, CircleCheck, Eye, Receipt, Plus } from "lucide-react";

import Alert from "../../../../../ui/Alert";
import Button from "../../../../../ui/Button";
import Card, { CardBody, CardHeader } from "../../../../../ui/Card";
import Input from "../../../../../ui/Input";
import Select from "../../../../../ui/Select";
import PageHeader from "../../../../../ui/PageHeader";
import StatusBadge from "../../../../../ui/StatusBadge";
import { useConfirm, useToast } from "../../../../../feedback";
import DataTable from "../../../../../tables/DataTable";
import InfoGrid from "../../../../../../features/adminSales/components/InfoGrid";
import { formatINR } from "../../../../../../utils/format";
import { TotalsSummary } from "../../../shared/DocParts";
import { authFetch } from "../../../../../../utils/authFetch";

export default function DebitNotePage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [view, setView] = useState("list");
  const [notes, setNotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rowActionId, setRowActionId] = useState(null);

  const [form, setForm] = useState({ invoiceId: "", taxableValue: "", cgstAmount: "", sgstAmount: "", igstAmount: "", reason: "" });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authFetch("/sales-debitnote");
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching debit notes:", err);
      setError(err.message || "Failed to load debit notes");
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = async () => {
    setView("create");
    setForm({ invoiceId: "", taxableValue: "", cgstAmount: "", sgstAmount: "", igstAmount: "", reason: "" });
    try {
      const data = await authFetch("/sales-invoice");
      setInvoices((Array.isArray(data) ? data : []).filter((inv) => inv.status === "POSTED"));
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  const handleCreate = async () => {
    const taxableValue = Number(form.taxableValue);
    if (!form.invoiceId || !taxableValue || taxableValue <= 0) {
      setError("Select an invoice and enter a positive taxable amount");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authFetch("/sales-debitnote", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: Number(form.invoiceId),
          taxableValue,
          cgstAmount: Number(form.cgstAmount) || 0,
          sgstAmount: Number(form.sgstAmount) || 0,
          igstAmount: Number(form.igstAmount) || 0,
          reason: form.reason,
        }),
      });
      setView("list");
      fetchNotes();
    } catch (err) {
      console.error("Error creating debit note:", err);
      setError(err.message || "Failed to create debit note");
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (id) => {
    if (!(await confirm({ title: "Post debit note?", message: "This creates the accounting entries and makes the debit note immutable.", confirmLabel: "Post debit note" }))) return;
    setRowActionId(id);
    try {
      await authFetch(`/sales-debitnote/${id}/post`, { method: "POST" });
      fetchNotes();
    } catch (err) {
      toast.error(err.message || "Failed to post debit note", { title: "Unable to post" });
    } finally {
      setRowActionId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!(await confirm({ title: "Cancel draft debit note?", message: "Cancel this DRAFT debit note?", tone: "danger", confirmLabel: "Cancel debit note", cancelLabel: "Keep it" }))) return;
    setRowActionId(id);
    try {
      await authFetch(`/sales-debitnote/${id}/cancel`, { method: "POST" });
      fetchNotes();
    } catch (err) {
      toast.error(err.message || "Failed to cancel debit note", { title: "Unable to cancel" });
    } finally {
      setRowActionId(null);
    }
  };

  const handleView = async (id) => {
    try {
      const note = await authFetch(`/sales-debitnote/${id}`);
      setSelectedNote(note);
      setView("detail");
    } catch (err) {
      toast.error(err.message || "Failed to load debit note", { title: "Unable to open" });
    }
  };

  const backToList = () => {
    setView("list");
    setError("");
  };
  const backButton = (
    <Button variant="secondary" leftIcon={ArrowLeft} onClick={backToList}>
      Back to debit notes
    </Button>
  );

  if (view === "detail" && selectedNote) {
    return (
      <div>
        <PageHeader
          title={`Debit note ${selectedNote.debit_note_number || ""}`}
          description="Debit notes raised against posted sales invoices."
          meta={<StatusBadge status={selectedNote.status} domain="invoice" />}
          actions={
            <>
              {backButton}
              {selectedNote.status === "DRAFT" ? (
                <Button leftIcon={CircleCheck} onClick={() => handlePost(selectedNote.id)} loading={rowActionId === selectedNote.id}>
                  Post debit note
                </Button>
              ) : null}
            </>
          }
        />
        <div className="space-y-4">
          <Card>
            <CardHeader title="Debit note information" />
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
            <CardHeader title="Amounts" />
            <CardBody>
              <div className="flex justify-end">
                <TotalsSummary
                  className="w-full sm:max-w-sm"
                  rows={[
                    ["Taxable value", Number(selectedNote.taxableValue || 0)],
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

  if (view === "create") {
    const setF = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
    return (
      <div>
        <PageHeader
          title="New debit note"
          description="Debit a posted sales invoice for an additional charge. The debit note is created as a draft."
          actions={
            <>
              {backButton}
              <Button onClick={handleCreate} loading={loading}>
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
            <CardHeader title="Invoice" subtitle="Only posted invoices can be debited." />
            <CardBody>
              <Select
                label="Select invoice"
                value={form.invoiceId}
                onChange={setF("invoiceId")}
                placeholder="Select an invoice"
                wrapperClassName="max-w-xl"
                options={invoices.map((inv) => ({ value: inv.id, label: `${inv.invoice_number} — ${inv.customer?.name || "N/A"}` }))}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Amounts" subtitle="Enter the additional taxable amount and its taxes." />
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Input label="Taxable amount" type="number" min="0" value={form.taxableValue} onChange={setF("taxableValue")} />
                <Input label="CGST" type="number" min="0" value={form.cgstAmount} onChange={setF("cgstAmount")} />
                <Input label="SGST" type="number" min="0" value={form.sgstAmount} onChange={setF("sgstAmount")} />
                <Input label="IGST" type="number" min="0" value={form.igstAmount} onChange={setF("igstAmount")} />
              </div>
              <Input label="Reason" value={form.reason} onChange={setF("reason")} placeholder="e.g. Under-billed freight charge" wrapperClassName="max-w-xl" />
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  const columns = [
    { key: "number", header: "Number", sortable: true, accessor: (n) => n.debit_note_number, render: (v, n) => (
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
        { key: "post", label: "Post debit note", icon: CircleCheck, disabled: rowActionId === n.id, hint: "Creates the accounting entries", onClick: () => handlePost(n.id) },
        { key: "sep", divider: true },
        { key: "cancel", label: "Cancel draft", icon: Ban, danger: true, disabled: rowActionId === n.id, onClick: () => handleCancel(n.id) },
      );
    }
    return items;
  };

  return (
    <div>
      <PageHeader
        title="Debit Notes"
        description="Debit notes raised against posted sales invoices."
        actions={
          <Button leftIcon={Plus} onClick={openCreateForm}>
            New debit note
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
          caption="Debit Notes"
          columns={columns}
          data={notes}
          loading={loading && notes.length === 0}
          searchable
          searchPlaceholder="Search number, customer, reason"
          rowActions={rowActions}
          responsive="cards"
          cardTitleKey="number"
          emptyIcon={Receipt}
          emptyTitle="No debit notes yet"
          emptyDescription="Debit notes will appear here."
        />
      </Card>
    </div>
  );
}
