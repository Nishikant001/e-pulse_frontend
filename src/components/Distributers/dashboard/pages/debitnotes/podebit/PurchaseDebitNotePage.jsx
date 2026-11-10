import React, { useEffect, useState } from "react";
import { ArrowLeft, Ban, CircleCheck, Eye, Receipt } from "lucide-react";

import Alert from "../../../../../ui/Alert";
import Button from "../../../../../ui/Button";
import Card, { CardBody, CardHeader } from "../../../../../ui/Card";
import PageHeader from "../../../../../ui/PageHeader";
import StatusBadge from "../../../../../ui/StatusBadge";
import { useConfirm, useToast } from "../../../../../feedback";
import DataTable from "../../../../../tables/DataTable";
import InfoGrid from "../../../../../../features/adminSales/components/InfoGrid";
import { formatINR } from "../../../../../../utils/format";
import { TotalsSummary } from "../../../shared/DocParts";
import { authFetch } from "../../../../../../utils/authFetch";

// Purchase Debit Notes are only ever generated automatically by a Purchase
// Return (see PurchaseReturnPage.jsx) — there is no standalone "create"
// here, only viewing, posting, and cancelling.
export default function PurchaseDebitNotePage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [view, setView] = useState("list");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rowActionId, setRowActionId] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authFetch("/purchase-debitnote");
      setNotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching purchase debit notes:", err);
      setError(err.message || "Failed to load debit notes");
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (id) => {
    if (!(await confirm({ title: "Post debit note?", message: "This creates the accounting entries and makes the debit note immutable.", confirmLabel: "Post debit note" }))) return;
    setRowActionId(id);
    try {
      await authFetch(`/purchase-debitnote/${id}/post`, { method: "POST" });
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
      await authFetch(`/purchase-debitnote/${id}/cancel`, { method: "POST" });
      fetchNotes();
    } catch (err) {
      toast.error(err.message || "Failed to cancel debit note", { title: "Unable to cancel" });
    } finally {
      setRowActionId(null);
    }
  };

  const handleView = async (id) => {
    try {
      const note = await authFetch(`/purchase-debitnote/${id}`);
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
          title={`Purchase debit note ${selectedNote.debit_note_number || ""}`}
          description="Generated automatically when a purchase return is posted. Create one from Purchase → Return."
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
                  { label: "Vendor", value: selectedNote.vendor?.name || "N/A" },
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

  const columns = [
    { key: "number", header: "Number", sortable: true, accessor: (n) => n.debit_note_number, render: (v, n) => (
      <button type="button" onClick={() => handleView(n.id)} className="font-medium text-brand-700 underline-offset-2 hover:underline">{v}</button>
    ) },
    { key: "vendor", header: "Vendor", sortable: true, accessor: (n) => n.vendor?.name || "N/A" },
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
        title="Purchase Debit Notes"
        description="Generated automatically when a purchase return is posted. Create one from Purchase → Return."
        
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
          caption="Purchase Debit Notes"
          columns={columns}
          data={notes}
          loading={loading && notes.length === 0}
          searchable
          searchPlaceholder="Search number, vendor, reason"
          rowActions={rowActions}
          responsive="cards"
          cardTitleKey="number"
          emptyIcon={Receipt}
          emptyTitle="No purchase debit notes yet"
          emptyDescription="Purchase debit notes will appear here."
        />
      </Card>
    </div>
  );
}
