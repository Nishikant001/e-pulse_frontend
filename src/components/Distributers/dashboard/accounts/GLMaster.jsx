import React, { useEffect, useState } from "react";
import { FileSpreadsheet, Layers, Pencil, Plus, Trash2, Upload } from "lucide-react";
import Alert from "../../../ui/Alert";
import Badge from "../../../ui/Badge";
import Button from "../../../ui/Button";
import Card, { CardBody, CardHeader } from "../../../ui/Card";
import Input from "../../../ui/Input";
import Modal from "../../../ui/Modal";
import PageHeader from "../../../ui/PageHeader";
import Select from "../../../ui/Select";
import { useConfirm, useToast } from "../../../feedback";
import DataTable from "../../../tables/DataTable";
import { formatINR } from "../../../../utils/format";
import { authFetch } from "../../../../utils/authFetch";

function GLMaster() {
  const toast = useToast();
  const confirm = useConfirm();
  const [gl, setGL] = useState([]);
  const [loading, setLoading] = useState(true);
  const [excelFile, setExcelFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    id: null,
    gl_name: "",
    gl_type: "",
    opening_balance: 0,
  });

  /* ---------------- LOAD GL ---------------- */
  const loadGL = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authFetch("/gl-master");
      setGL(data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load GL Master");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGL();
  }, []);

  /* ---------------- FORM ---------------- */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ id: null, gl_name: "", gl_type: "", opening_balance: 0 });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (form.id) {
        await authFetch(`/gl-master/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await authFetch("/gl-master", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      resetForm();
      loadGL();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save GL account");
    }
  };

  const onEdit = (g) => {
    setForm(g);
    setShowForm(true);
  };

  const onDelete = async (id) => {
    if (!(await confirm({ title: "Delete GL account?", message: "Are you sure you want to delete this GL?", tone: "danger", confirmLabel: "Delete" }))) return;

    try {
      const res = await authFetch(`/gl-master/${id}`, { method: "DELETE" });

      if (res?.message?.includes("Cannot delete")) {
        toast.error("This GL is used in transactions and cannot be deleted.", { title: "Delete blocked" });
      }

      loadGL();
    } catch (err) {
      toast.error(err.message || "Delete failed", { title: "Delete failed" });
    }
  };

  /* ---------------- EXCEL UPLOAD ---------------- */
  const handleUpload = async () => {
    if (!excelFile) return toast.warning("Select an Excel file first.");

    const formData = new FormData();
    formData.append("file", excelFile);

    try {
      await authFetch("/gl-master/bulk-upload", {
        method: "POST",
        body: formData,
      });
      setExcelFile(null);
      loadGL();
    } catch (err) {
      toast.error(err.message || "Upload failed", { title: "Upload failed" });
    }
  };

  const TYPE_TONES = { asset: "info", liability: "error", income: "success", expense: "warning" };

  const columns = [
    { key: "id", header: "ID", sortable: true, render: (v) => `#${v}` },
    { key: "gl_name", header: "Name", sortable: true },
    { key: "gl_type", header: "Type", sortable: true, render: (v) => <Badge tone={TYPE_TONES[v] || "neutral"}>{v ? v.charAt(0).toUpperCase() + v.slice(1) : "—"}</Badge> },
    { key: "opening_balance", header: "Opening", sortable: true, align: "right", accessor: (g) => Number(g.opening_balance || 0), render: (v) => <span className="tabular-nums">{formatINR(v)}</span> },
    { key: "closing_balance", header: "Closing", sortable: true, align: "right", accessor: (g) => Number(g.closing_balance || 0), render: (v) => <span className="font-medium tabular-nums">{formatINR(v)}</span> },
  ];
  const rowActions = (g) => [
    { key: "edit", label: "Edit", icon: Pencil, onClick: () => onEdit(g) },
    { key: "sep", divider: true },
    { key: "delete", label: "Delete", icon: Trash2, danger: true, onClick: () => onDelete(g.id) },
  ];

  return (
    <div>
      <PageHeader
        title="GL Master"
        description="Manage general ledger accounts."
        actions={
          <Button leftIcon={Plus} onClick={() => setShowForm(true)}>
            New GL account
          </Button>
        }
      />

      {error ? (
        <Alert tone="error" className="mb-4" onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      <Card className="mb-4">
        <CardHeader icon={FileSpreadsheet} title="Bulk upload" subtitle="Import GL accounts from an Excel file (.xls, .xlsx)." />
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".xls,.xlsx"
              aria-label="Excel file to upload"
              onChange={(e) => setExcelFile(e.target.files[0])}
              className="text-body text-ink-muted file:mr-3 file:rounded-control file:border file:border-line-strong file:bg-surface file:px-3 file:py-1.5 file:text-body file:font-medium file:text-ink hover:file:bg-neutral-50"
            />
            <Button variant="secondary" leftIcon={Upload} onClick={handleUpload} disabled={!excelFile}>
              Upload
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <DataTable
          bare
          rowKey="id"
          caption="GL accounts"
          columns={columns}
          data={gl}
          loading={loading}
          searchable
          searchPlaceholder="Search name or type"
          searchKeys={["gl_name", "gl_type"]}
          rowActions={rowActions}
          responsive="cards"
          cardTitleKey="gl_name"
          emptyIcon={Layers}
          emptyTitle="No GL accounts found"
          emptyDescription="Create a GL account to get started."
          initialPageSize={25}
        />
      </Card>

      <Modal
        open={showForm}
        onClose={resetForm}
        title={form.id ? "Edit GL account" : "Create GL account"}
        footer={
          <>
            <Button variant="secondary" onClick={resetForm}>
              Cancel
            </Button>
            <Button type="submit" form="gl-form">
              {form.id ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <form id="gl-form" onSubmit={handleSubmit} className="space-y-4">
          <Input label="GL name" required name="gl_name" value={form.gl_name} onChange={handleChange} />
          <Select
            label="Type"
            required
            name="gl_type"
            value={form.gl_type}
            onChange={handleChange}
            placeholder="Select type"
            options={[
              { value: "asset", label: "Asset" },
              { value: "liability", label: "Liability" },
              { value: "income", label: "Income" },
              { value: "expense", label: "Expense" },
            ]}
          />
          <Input label="Opening balance" type="number" step="0.01" name="opening_balance" value={form.opening_balance} onChange={handleChange} />
        </form>
      </Modal>
    </div>
  );
}

export default GLMaster;
