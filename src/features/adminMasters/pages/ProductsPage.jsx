import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Plus, Power, PowerOff, RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import FilterBar from "../../../components/ui/FilterBar";
import DataTable from "../../../components/tables/DataTable";
import { CategoryFilter, DistributorFilter, SearchFilter, StatusFilter } from "../../../components/forms";
import { useToast, useConfirm } from "../../../components/feedback";
import { formatINR, formatNumber } from "../../../utils/format";
import { mastersApi } from "../api/mastersApi";
import { useMastersList } from "../hooks/useMastersList";
import { useMastersLookups } from "../hooks/useMastersLookups";
import ProductFormModal from "../components/ProductFormModal";

const KEYS = ["q", "distributorId", "category", "status"];

/** Product Master — /admin/masters/products */
export default function ProductsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [filters, setFilters] = useState(() => Object.fromEntries(KEYS.map((k) => [k, ""])));
  const lookups = useMastersLookups(filters.distributorId || undefined);
  const list = useMastersList({ fetcher: mastersApi.products.list, filters, defaultSort: { key: "name", dir: "asc" } });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (product) => {
    setEditing(product);
    setFormOpen(true);
  };

  async function toggleStatus(row) {
    const activating = row.status === "inactive";
    const ok = await confirm({
      title: activating ? "Reactivate product?" : "Deactivate product?",
      message: activating
        ? `${row.name} will become available again for orders, pricing and batches.`
        : `${row.name} will no longer be selectable for new orders. Existing batches, pricing and invoices are unaffected.`,
      tone: activating ? "primary" : "warning",
      confirmLabel: activating ? "Reactivate" : "Deactivate",
    });
    if (!ok) return;
    try {
      await (activating ? mastersApi.products.reactivate(row.id) : mastersApi.products.deactivate(row.id));
      toast.success(activating ? "Product reactivated" : "Product deactivated");
      list.reload();
    } catch (err) {
      toast.error(err.message || "Unable to update product status", { title: "Update failed" });
    }
  }

  const categoryOptions = useMemo(() => (lookups.categories || []).map((c) => ({ value: c, label: c })), [lookups]);
  const distributorOptions = useMemo(() => (lookups.distributors || []).map((d) => ({ value: String(d.id), label: d.name })), [lookups]);

  const columns = useMemo(
    () => [
      {
        key: "name", header: "Product", sortable: true, sticky: true, minWidth: "14rem", accessor: (r) => r.name,
        render: (v, r) => (
          <button type="button" onClick={() => navigate(`/admin/masters/products/${r.id}`)} className="block text-left">
            <span className="block font-medium text-brand-700 underline-offset-2 hover:underline">{v}</span>
            <span className="block text-caption text-ink-subtle">{r.sku}{r.genericName ? ` · ${r.genericName}` : ""}</span>
          </button>
        ),
      },
      { key: "category", header: "Category", sortable: true, accessor: (r) => r.category },
      { key: "dosage", header: "Dosage / Strength", accessor: (r) => `${r.dosageForm || "—"}${r.strength ? ` · ${r.strength}` : ""}` },
      { key: "distributor", header: "Distributor", sortable: true, minWidth: "11rem", accessor: (r) => r.distributor.name, render: (v, r) => (<><span className="block">{v}</span><span className="block text-caption text-ink-subtle">{r.distributor.code}</span></>) },
      { key: "hsn", header: "HSN / GST", accessor: (r) => r.hsnCode, render: (v, r) => (<span className="whitespace-nowrap">{v || "—"}{r.gstRate != null ? ` · ${r.gstRate}%` : ""}</span>) },
      { key: "mrp", header: "MRP", sortable: true, align: "right", accessor: (r) => r.mrp, render: (v) => (v != null ? <span className="tabular-nums">{formatINR(v)}</span> : <span className="text-ink-subtle">—</span>) },
      { key: "sale_price", header: "Sale Price", sortable: true, align: "right", accessor: (r) => r.salePrice, render: (v) => (v != null ? <span className="tabular-nums">{formatINR(v)}</span> : <span className="text-ink-subtle">—</span>) },
      { key: "batches", header: "Batches", align: "right", accessor: (r) => r.batchCount, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "status", header: "Status", sortable: true, accessor: (r) => r.status, render: (v) => <StatusBadge status={v} domain="inventory" /> },
    ],
    [navigate],
  );

  return (
    <div>
      <PageHeader
        title="Product Master"
        description="Products across every distributor — identity, classification, HSN/GST and MRP/sale price. Batches and pricing are managed from their own masters."
        actions={
          <>
            <IconButton icon={RefreshCw} label="Refresh products" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
            <Button leftIcon={Plus} onClick={openCreate}>Add product</Button>
          </>
        }
      />

      <FilterBar
        className="mb-4"
        activeCount={KEYS.filter((k) => filters[k]).length}
        onReset={() => setFilters(Object.fromEntries(KEYS.map((k) => [k, ""])))}
      >
        <SearchFilter value={filters.q} onChange={(v) => setFilters((f) => ({ ...f, q: v }))} placeholder="Name, SKU, generic name, brand" className="w-full sm:w-72" />
        <DistributorFilter value={filters.distributorId} onChange={(v) => setFilters((f) => ({ ...f, distributorId: v }))} options={distributorOptions} />
        <CategoryFilter value={filters.category} onChange={(v) => setFilters((f) => ({ ...f, category: v }))} options={categoryOptions} />
        <StatusFilter domain="inventory" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} value={filters.status} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} />
      </FilterBar>

      <Card>
        <DataTable
          bare manual rowKey="id" caption="Products"
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (list.error?.message || "Unable to load products. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort} onRowClick={(r) => navigate(`/admin/masters/products/${r.id}`)}
          rowActions={(row) => [
            { key: "view", label: "View details", icon: Eye, onClick: () => navigate(`/admin/masters/products/${row.id}`) },
            { key: "edit", label: "Edit product", icon: Pencil, onClick: () => openEdit(row) },
            row.status === "active"
              ? { key: "deactivate", label: "Deactivate", icon: PowerOff, onClick: () => toggleStatus(row) }
              : { key: "reactivate", label: "Reactivate", icon: Power, onClick: () => toggleStatus(row) },
          ]}
          emptyTitle="No products found" emptyDescription="Try changing the filters, or add a new product."
        />
      </Card>

      <ProductFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={list.reload} product={editing} lookups={lookups} distributorId={filters.distributorId} />
    </div>
  );
}
