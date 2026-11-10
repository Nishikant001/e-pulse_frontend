import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Pencil, Plus, Power, PowerOff, RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import FilterBar from "../../../components/ui/FilterBar";
import DataTable from "../../../components/tables/DataTable";
import { DistributorFilter, ProductFilter, SearchFilter, StatusFilter } from "../../../components/forms";
import { useToast, useConfirm } from "../../../components/feedback";
import { formatDate, formatINR } from "../../../utils/format";
import { mastersApi } from "../api/mastersApi";
import { useMastersList } from "../hooks/useMastersList";
import { useMastersLookups } from "../hooks/useMastersLookups";
import BatchFormModal from "../components/BatchFormModal";

const KEYS = ["q", "distributorId", "productId", "status"];

/** Batch Master — /admin/masters/batches (identity + expiry; stock levels live on the Inventory > Batch Stock screen). */
export default function BatchesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({ q: "", distributorId: "", productId: searchParams.get("productId") || "", status: "" }));
  const lookups = useMastersLookups(filters.distributorId || undefined);
  const list = useMastersList({ fetcher: mastersApi.batches.list, filters, defaultSort: { key: "exp_date", dir: "asc" } });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  // Active products come from the same /masters/lookups call (unpaginated, scoped by the distributor filter).
  const productOptions = lookups.products || [];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row) => {
    setEditing({ id: row.id, batchNo: row.batchNo, mfgDate: row.mfgDate, expDate: row.expDate, mrp: row.mrp, purchasePrice: row.purchasePrice, productId: row.product.id, productName: row.product.name, distributorId: row.distributor.id, product: { distributorName: row.distributor.name } });
    setFormOpen(true);
  };

  async function toggleStatus(row) {
    const activating = row.status === "inactive";
    const ok = await confirm({
      title: activating ? "Reactivate batch?" : "Deactivate batch?",
      message: activating
        ? `${row.batchNo} will be treated as saleable stock again (subject to expiry).`
        : `${row.batchNo} will be excluded from saleable stock and FEFO allocation immediately.`,
      tone: activating ? "primary" : "warning",
      confirmLabel: activating ? "Reactivate" : "Deactivate",
    });
    if (!ok) return;
    try {
      await (activating ? mastersApi.batches.reactivate(row.id) : mastersApi.batches.deactivate(row.id));
      toast.success(activating ? "Batch reactivated" : "Batch deactivated");
      list.reload();
    } catch (err) {
      toast.error(err.message || "Unable to update batch status", { title: "Update failed" });
    }
  }

  const distributorOptions = useMemo(() => (lookups.distributors || []).map((d) => ({ value: String(d.id), label: d.name })), [lookups]);
  const productFilterOptions = useMemo(() => productOptions.map((p) => ({ value: String(p.id), label: `${p.name} (${p.sku})` })), [productOptions]);

  const columns = useMemo(
    () => [
      { key: "batch_no", header: "Batch no.", sortable: true, sticky: true, accessor: (r) => r.batchNo, render: (v, r) => (
        <button type="button" onClick={() => navigate(`/admin/masters/batches/${r.id}`)} className="font-medium text-brand-700 hover:underline">{v}</button>
      ) },
      { key: "product", header: "Product", sortable: true, minWidth: "12rem", accessor: (r) => r.product.name, render: (v, r) => (<><span className="block">{v}</span><span className="block text-caption text-ink-subtle">{r.product.sku}</span></>) },
      { key: "distributor", header: "Distributor", accessor: (r) => r.distributor.name },
      { key: "mfg_date", header: "MFG date", sortable: true, accessor: (r) => r.mfgDate, render: (v) => formatDate(v) },
      { key: "exp_date", header: "Expiry date", sortable: true, accessor: (r) => r.expDate, render: (v, r) => <span className={r.expired ? "font-medium text-error-700" : undefined}>{formatDate(v)}</span> },
      { key: "mrp", header: "MRP", sortable: true, align: "right", accessor: (r) => r.mrp, render: (v) => (v != null ? <span className="tabular-nums">{formatINR(v)}</span> : "—") },
      { key: "status", header: "Status", sortable: true, accessor: (r) => r.status, render: (v, r) => (
        <div className="flex items-center gap-1.5"><StatusBadge status={v} domain="inventory" />{r.expired ? <StatusBadge status="expired" domain="inventory" /> : null}</div>
      ) },
    ],
    [navigate],
  );

  return (
    <div>
      <PageHeader
        title="Batch Master"
        description="Batch identity and expiry across every distributor. Live stock quantities and FEFO allocation are on Inventory ▸ Batch Stock."
        actions={
          <>
            <IconButton icon={RefreshCw} label="Refresh batches" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
            <Button leftIcon={Plus} onClick={openCreate}>Add batch</Button>
          </>
        }
      />

      <FilterBar className="mb-4" activeCount={KEYS.filter((k) => filters[k]).length} onReset={() => setFilters({ q: "", distributorId: "", productId: "", status: "" })}>
        <SearchFilter value={filters.q} onChange={(v) => setFilters((f) => ({ ...f, q: v }))} placeholder="Batch no., product name or SKU" className="w-full sm:w-72" />
        <DistributorFilter value={filters.distributorId} onChange={(v) => setFilters((f) => ({ ...f, distributorId: v, productId: "" }))} options={distributorOptions} />
        <ProductFilter options={productFilterOptions} value={filters.productId} onChange={(v) => setFilters((f) => ({ ...f, productId: v }))} />
        <StatusFilter domain="inventory" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} value={filters.status} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} />
      </FilterBar>

      <Card>
        <DataTable
          bare manual rowKey="id" caption="Batches"
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (list.error?.message || "Unable to load batches. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort} onRowClick={(r) => navigate(`/admin/masters/batches/${r.id}`)}
          rowActions={(row) => [
            { key: "view", label: "View details", icon: Eye, onClick: () => navigate(`/admin/masters/batches/${row.id}`) },
            { key: "edit", label: "Edit batch", icon: Pencil, onClick: () => openEdit(row) },
            row.status === "active"
              ? { key: "deactivate", label: "Deactivate", icon: PowerOff, onClick: () => toggleStatus(row) }
              : { key: "reactivate", label: "Reactivate", icon: Power, onClick: () => toggleStatus(row) },
          ]}
          emptyTitle="No batches found" emptyDescription="Try changing the filters, or add a new batch."
        />
      </Card>

      <BatchFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={list.reload} batch={editing} productOptions={productOptions} distributorOptions={lookups.distributors} distributorId={filters.distributorId} productId={filters.productId} />
    </div>
  );
}