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
import TaxFormModal from "../components/TaxFormModal";

const KEYS = ["q", "distributorId"];
const pct = (v) => (Number.isFinite(Number(v)) ? `${Number(v).toFixed(1)}%` : "—");

/** Tax Master (HSN/GST) — /admin/masters/taxes. The CGST/SGST/IGST split shown here comes from tax.service.js. */
export default function TaxesPage() {
  const toast = useToast();
  const [filters, setFilters] = useState(() => ({ q: "", distributorId: "" }));
  const lookups = useMastersLookups(filters.distributorId || undefined);
  const list = useMastersList({ fetcher: mastersApi.taxes.list, filters, defaultSort: { key: "hsn_code", dir: "asc" } });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    setFormOpen(true);
  };

  async function loadDetail(row) {
    try {
      const detail = await mastersApi.taxes.detail(row.id);
      setViewing(detail);
    } catch (err) {
      toast.error(err.message || "Unable to load tax details", { title: "Load failed" });
    }
  }

  const distributorOptions = useMemo(() => (lookups.distributors || []).map((d) => ({ value: String(d.id), label: d.name })), [lookups]);

  const columns = useMemo(
    () => [
      { key: "hsn_code", header: "HSN code", sortable: true, sticky: true, accessor: (r) => r.hsnCode, render: (v, r) => (
        <button type="button" onClick={() => loadDetail(r)} className="font-medium text-brand-700 hover:underline">{v}</button>
      ) },
      { key: "description", header: "Description", minWidth: "14rem", accessor: (r) => r.description },
      { key: "distributor", header: "Distributor", accessor: (r) => r.distributor.name },
      { key: "gst_rate", header: "GST", sortable: true, align: "right", accessor: (r) => r.gstRate, render: (v) => <span className="tabular-nums">{pct(v)}</span> },
      { key: "cgst", header: "CGST", align: "right", accessor: (r) => r.cgstRate, render: (v) => <span className="tabular-nums">{pct(v)}</span> },
      { key: "sgst", header: "SGST", align: "right", accessor: (r) => r.sgstRate, render: (v) => <span className="tabular-nums">{pct(v)}</span> },
      { key: "igst", header: "IGST", align: "right", accessor: (r) => r.igstRate, render: (v) => <span className="tabular-nums">{pct(v)}</span> },
      { key: "products", header: "Products", align: "right", accessor: (r) => r.productCount, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div>
      <PageHeader
        title="Tax Master"
        description="HSN / GST tax categories across every distributor. CGST, SGST and IGST are computed from the GST rate — the same split used when calculating a Sales Order line."
        actions={
          <>
            <IconButton icon={RefreshCw} label="Refresh tax records" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
            <Button leftIcon={Plus} onClick={openCreate}>Add tax record</Button>
          </>
        }
      />

      <FilterBar className="mb-4" activeCount={KEYS.filter((k) => filters[k]).length} onReset={() => setFilters({ q: "", distributorId: "" })}>
        <SearchFilter value={filters.q} onChange={(v) => setFilters((f) => ({ ...f, q: v }))} placeholder="HSN code or description" className="w-full sm:w-64" />
        <DistributorFilter value={filters.distributorId} onChange={(v) => setFilters((f) => ({ ...f, distributorId: v }))} options={distributorOptions} />
      </FilterBar>

      <Card>
        <DataTable
          bare manual rowKey="id" caption="Tax records"
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (list.error?.message || "Unable to load tax records. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort} onRowClick={loadDetail}
          rowActions={(row) => [
            { key: "view", label: "View details", icon: Eye, onClick: () => loadDetail(row) },
            { key: "edit", label: "Edit tax record", icon: Pencil, onClick: () => openEdit(row) },
          ]}
          emptyTitle="No tax records found" emptyDescription="Try changing the filters, or add a new HSN / GST tax record."
        />
      </Card>

      <TaxFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={list.reload} tax={editing} distributorOptions={lookups.distributors} distributorId={filters.distributorId} />

      <Modal open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing ? `HSN ${viewing.hsnCode}` : ""}>
        {viewing ? (
          <div className="space-y-4">
            <div>
              <div className="text-caption text-ink-subtle">Description</div>
              <div className="text-body text-ink">{viewing.description || "—"}</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><div className="text-caption text-ink-subtle">CGST</div><div className="text-body text-ink">{pct(viewing.cgstRate)}</div></div>
              <div><div className="text-caption text-ink-subtle">SGST</div><div className="text-body text-ink">{pct(viewing.sgstRate)}</div></div>
              <div><div className="text-caption text-ink-subtle">IGST</div><div className="text-body text-ink">{pct(viewing.igstRate)}</div></div>
            </div>
            <div>
              <div className="mb-1 text-caption text-ink-subtle">Products on this HSN ({viewing.products.length})</div>
              {viewing.products.length === 0 ? (
                <p className="text-body text-ink-subtle">No products currently use this HSN code.</p>
              ) : (
                <ul className="space-y-1 text-body text-ink">
                  {viewing.products.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <span>{p.name} ({p.sku})</span>
                      <span className="text-caption text-ink-subtle">{p.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
