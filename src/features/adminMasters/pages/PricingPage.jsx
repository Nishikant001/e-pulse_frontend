import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil, Plus, RefreshCw, XCircle } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import FilterBar from "../../../components/ui/FilterBar";
import DataTable from "../../../components/tables/DataTable";
import { DistributorFilter, ProductFilter, SearchFilter, SelectFilter, StatusFilter } from "../../../components/forms";
import { useToast, useConfirm } from "../../../components/feedback";
import { formatDate, formatINR } from "../../../utils/format";
import { mastersApi } from "../api/mastersApi";
import { useMastersList } from "../hooks/useMastersList";
import { useMastersLookups } from "../hooks/useMastersLookups";
import PricingFormModal from "../components/PricingFormModal";

const KEYS = ["q", "distributorId", "productId", "customerGroupId", "status"];
const pct = (v) => (Number.isFinite(Number(v)) ? `${Number(v).toFixed(1)}%` : "—");

/** Pricing Master — /admin/masters/pricing. Reuses pricing.service.js's fields (base price, discount, validity) as-is. */
export default function PricingPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({ q: "", distributorId: "", productId: searchParams.get("productId") || "", customerGroupId: "", status: "" }));
  const lookups = useMastersLookups(filters.distributorId || undefined);
  const list = useMastersList({ fetcher: mastersApi.pricing.list, filters, defaultSort: { key: "createdAt", dir: "desc" } });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  // Active products come from the same /masters/lookups call (unpaginated, scoped by the distributor filter).
  const productOptions = lookups.products || [];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    setFormOpen(true);
  };

  async function deactivate(row) {
    const ok = await confirm({
      title: "Deactivate pricing?",
      message: `The price for ${row.product.name} · ${row.customerGroup.name} will stop applying to new orders from today. History is kept.`,
      tone: "warning",
      confirmLabel: "Deactivate",
    });
    if (!ok) return;
    try {
      await mastersApi.pricing.deactivate(row.id);
      toast.success("Pricing deactivated");
      list.reload();
    } catch (err) {
      toast.error(err.message || "Unable to deactivate pricing", { title: "Update failed" });
    }
  }

  const distributorOptions = useMemo(() => (lookups.distributors || []).map((d) => ({ value: String(d.id), label: d.name })), [lookups]);
  const productFilterOptions = useMemo(() => productOptions.map((p) => ({ value: String(p.id), label: `${p.name} (${p.sku})` })), [productOptions]);
  const groupOptions = useMemo(
    () => (lookups.customerGroups || []).filter((g) => !filters.distributorId || String(g.distributorId) === String(filters.distributorId)).map((g) => ({ value: String(g.id), label: g.name })),
    [lookups, filters.distributorId],
  );

  const columns = useMemo(
    () => [
      { key: "product", header: "Product", sortable: true, sticky: true, minWidth: "12rem", accessor: (r) => r.product.name, render: (v, r) => (<><span className="block font-medium">{v}</span><span className="block text-caption text-ink-subtle">{r.product.sku}</span></>) },
      { key: "customerGroup", header: "Customer group", sortable: true, accessor: (r) => r.customerGroup.name },
      { key: "distributor", header: "Distributor", accessor: (r) => r.distributor.name },
      { key: "base_price", header: "Base price", sortable: true, align: "right", accessor: (r) => r.basePrice, render: (v) => <span className="tabular-nums">{formatINR(v)}</span> },
      { key: "discount", header: "Discount", align: "right", accessor: (r) => r.discountPercent, render: (v) => <span className="tabular-nums">{pct(v)}</span> },
      { key: "unit_price", header: "Unit price", align: "right", accessor: (r) => r.unitPrice, render: (v) => <span className="font-medium tabular-nums">{formatINR(v)}</span> },
      { key: "valid_from", header: "Effective from", sortable: true, accessor: (r) => r.validFrom, render: (v) => formatDate(v) },
      { key: "valid_to", header: "Effective to", sortable: true, accessor: (r) => r.validTo, render: (v) => (v ? formatDate(v) : "—") },
      { key: "status", header: "Status", accessor: (r) => r.active, render: (v) => <StatusBadge status={v ? "active" : "inactive"} domain="inventory" /> },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Pricing Master"
        description="Product-wise pricing by customer group, across every distributor. Deactivating ends validity today; history is preserved."
        actions={
          <>
            <IconButton icon={RefreshCw} label="Refresh pricing" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
            <Button leftIcon={Plus} onClick={openCreate}>Add pricing</Button>
          </>
        }
      />

      <FilterBar className="mb-4" activeCount={KEYS.filter((k) => filters[k]).length} onReset={() => setFilters({ q: "", distributorId: "", productId: "", customerGroupId: "", status: "" })}>
        <SearchFilter value={filters.q} onChange={(v) => setFilters((f) => ({ ...f, q: v }))} placeholder="Product name or SKU" className="w-full sm:w-64" />
        <DistributorFilter value={filters.distributorId} onChange={(v) => setFilters((f) => ({ ...f, distributorId: v, productId: "", customerGroupId: "" }))} options={distributorOptions} />
        <ProductFilter options={productFilterOptions} value={filters.productId} onChange={(v) => setFilters((f) => ({ ...f, productId: v }))} />
        <SelectFilter label="Customer group" allLabel="All groups" options={groupOptions} value={filters.customerGroupId} onChange={(v) => setFilters((f) => ({ ...f, customerGroupId: v }))} />
        <StatusFilter domain="inventory" options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} value={filters.status} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} />
      </FilterBar>

      <Card>
        <DataTable
          bare manual rowKey="id" caption="Pricing"
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (list.error?.message || "Unable to load pricing. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort}
          rowActions={(row) => [
            { key: "edit", label: "Edit pricing", icon: Pencil, onClick: () => openEdit(row) },
            row.active ? { key: "deactivate", label: "Deactivate", icon: XCircle, onClick: () => deactivate(row) } : null,
          ].filter(Boolean)}
          emptyTitle="No pricing found" emptyDescription="Try changing the filters, or add pricing for a product and customer group."
        />
      </Card>

      <PricingFormModal
        open={formOpen} onClose={() => setFormOpen(false)} onSaved={list.reload} pricing={editing}
        productOptions={productOptions} customerGroupOptions={lookups.customerGroups} distributorOptions={lookups.distributors}
        distributorId={filters.distributorId} productId={filters.productId}
      />
    </div>
  );
}