import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/ui/PageHeader";
import FilterBar from "../../../components/ui/FilterBar";
import DataTable from "../../../components/tables/DataTable";
import Modal from "../../../components/ui/Modal";
import { DistributorFilter, SearchFilter } from "../../../components/forms";
import { useToast } from "../../../components/feedback";
import { formatNumber } from "../../../utils/format";
import { mastersApi } from "../api/mastersApi";
import { useMastersList } from "../hooks/useMastersList";
import { useMastersLookups } from "../hooks/useMastersLookups";
import CustomerGroupFormModal from "../components/CustomerGroupFormModal";

const KEYS = ["q", "distributorId"];

/** Customer Group Master — /admin/masters/customer-groups. Groups drive Pricing Master (price per product + customer group). */
export default function CustomerGroupsPage() {
  const toast = useToast();
  const [filters, setFilters] = useState(() => ({ q: "", distributorId: "" }));
  const lookups = useMastersLookups(filters.distributorId || undefined);
  const list = useMastersList({ fetcher: mastersApi.customerGroups.list, filters, defaultSort: { key: "code", dir: "asc" } });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (row) => { setEditing(row); setFormOpen(true); };

  async function loadDetail(row) {
    try {
      setViewing(await mastersApi.customerGroups.detail(row.id));
    } catch (err) {
      toast.error(err.message || "Unable to load customer group", { title: "Load failed" });
    }
  }

  const distributorOptions = useMemo(() => (lookups.distributors || []).map((d) => ({ value: String(d.id), label: d.name })), [lookups]);

  const columns = useMemo(
    () => [
      { key: "code", header: "Group code", sortable: true, sticky: true, accessor: (r) => r.code, render: (v, r) => (
        <button type="button" onClick={() => loadDetail(r)} className="font-medium text-brand-700 hover:underline">{v}</button>
      ) },
      { key: "name", header: "Group name", sortable: true, minWidth: "12rem", accessor: (r) => r.name },
      { key: "distributor", header: "Distributor", accessor: (r) => r.distributor.name },
      { key: "customers", header: "Customers", align: "right", accessor: (r) => r.customerCount, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
      { key: "pricing", header: "Pricing records", align: "right", accessor: (r) => r.pricingCount, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div>
      <PageHeader
        title="Customer Group Master"
        description="Customer groups (e.g. Retail, Wholesale) across every distributor. Pricing Master sets a price per product and customer group."
        actions={
          <>
            <IconButton icon={RefreshCw} label="Refresh customer groups" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
            <Button leftIcon={Plus} onClick={openCreate}>Add customer group</Button>
          </>
        }
      />

      <FilterBar className="mb-4" activeCount={KEYS.filter((k) => filters[k]).length} onReset={() => setFilters({ q: "", distributorId: "" })}>
        <SearchFilter value={filters.q} onChange={(v) => setFilters((f) => ({ ...f, q: v }))} placeholder="Group code or name" className="w-full sm:w-64" />
        <DistributorFilter value={filters.distributorId} onChange={(v) => setFilters((f) => ({ ...f, distributorId: v }))} options={distributorOptions} />
      </FilterBar>

      <Card>
        <DataTable
          bare manual rowKey="id" caption="Customer groups"
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (list.error?.message || "Unable to load customer groups. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort} onRowClick={loadDetail}
          rowActions={(row) => [
            { key: "view", label: "View details", icon: Eye, onClick: () => loadDetail(row) },
            { key: "edit", label: "Edit customer group", icon: Pencil, onClick: () => openEdit(row) },
          ]}
          emptyTitle="No customer groups found" emptyDescription="Try changing the filters, or add a new customer group."
        />
      </Card>

      <CustomerGroupFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={list.reload} group={editing} distributorOptions={lookups.distributors} distributorId={filters.distributorId} />

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing ? `${viewing.code} — ${viewing.name}` : ""}>
        {viewing ? (
          <div className="space-y-4">
            <div>
              <div className="text-caption text-ink-subtle">Distributor</div>
              <div className="text-body text-ink">{viewing.distributor.name} ({viewing.distributor.code})</div>
            </div>
            <div>
              <div className="mb-1 text-caption text-ink-subtle">Customers in this group ({viewing.customers.length})</div>
              {viewing.customers.length === 0 ? (
                <p className="text-body text-ink-subtle">No customers are assigned to this group yet.</p>
              ) : (
                <ul className="space-y-1 text-body text-ink">{viewing.customers.map((c) => <li key={c.id}>{c.name}</li>)}</ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
