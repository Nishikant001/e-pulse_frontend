import { useMemo, useState } from "react";
import { Pencil, RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import FilterBar from "../../../components/ui/FilterBar";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Alert from "../../../components/ui/Alert";
import DataTable from "../../../components/tables/DataTable";
import { SearchFilter, SelectFilter } from "../../../components/forms";
import { useToast } from "../../../components/feedback";
import { useMastersList } from "../../adminMasters/hooks/useMastersList";
import { ACCOUNT_PORTALS, accountsApi } from "../api/accountsApi";
import { Dash, Money } from "../components/accountsUi";
import { distributorOptions, useLookups } from "../components/accountsHooks";

const EMPTY = { search: "", entityType: "", distributorId: "" };

/** Credit limit, utilisation and available credit. Limits are informational (NOT enforced on orders — business-rule decision, see docs). */
export default function CreditPage({ portal = "admin" }) {
  const cfg = ACCOUNT_PORTALS[portal];
  const api = useMemo(() => accountsApi(portal), [portal]);
  const toast = useToast();
  const [filters, setFilters] = useState(EMPTY);
  const [edit, setEdit] = useState(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const lookups = useLookups(api, {});
  const list = useMastersList({ fetcher: api.credit, filters, defaultSort: { key: "utilised", dir: "desc" } });
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));

  const begin = (r) => { setEdit(r); setValue(r.creditLimit ?? ""); setError(null); };
  async function save() {
    setBusy(true); setError(null);
    try {
      await api.updateCredit(edit.entityId, { entityType: edit.entityType, creditLimit: value === "" ? null : Number(value) });
      toast.success("Credit limit updated"); setEdit(null); list.reload();
    } catch (err) { setError(err.message || "Unable to update"); } finally { setBusy(false); }
  }

  const columns = useMemo(() => [
    { key: "name", header: "Entity", sticky: true, minWidth: "13rem", accessor: (r) => r.name, render: (v, r) => (<><span className="block font-medium">{v}</span><span className="block text-caption text-ink-subtle">{r.code}</span></>) },
    { key: "entityType", header: "Type", accessor: (r) => r.entityType, render: (v) => (v === "RETAILER" ? "Retailer" : "Distributor") },
    ...(cfg.showDistributor ? [{ key: "distributorName", header: "Distributor", accessor: (r) => r.distributorName, render: (v, r) => (r.entityType === "RETAILER" ? v : <Dash />) }] : []),
    { key: "creditLimit", header: "Credit limit", align: "right", accessor: (r) => r.creditLimit, render: (v) => (v === null ? <span className="text-ink-subtle">Not set</span> : <Money value={v} />) },
    { key: "utilised", header: "Utilised", align: "right", accessor: (r) => r.utilised, render: (v) => <Money value={v} /> },
    { key: "availableCredit", header: "Available", align: "right", accessor: (r) => r.availableCredit, render: (v, r) => (v === null ? <Dash /> : <Money value={v} className={r.overLimit ? "font-semibold text-error-700" : ""} />) },
    { key: "utilisationPct", header: "Utilisation", align: "right", accessor: (r) => r.utilisationPct, render: (v, r) => (v === null ? <Dash /> : <span className={r.overLimit ? "font-semibold text-error-700" : "tabular-nums"}>{v}%{r.overLimit ? " · over limit" : ""}</span>) },
    ...(cfg.showDistributor ? [{ key: "paymentTerms", header: "Payment terms", accessor: (r) => r.paymentTerms, render: (v) => v || <Dash /> }] : []),
  ], [cfg]);

  return (
    <div>
      <PageHeader title="Credit limits" description="Utilised credit is the entity's current receivable balance; available credit is the limit less that. Limits are shown for information and do not block orders." actions={<IconButton icon={RefreshCw} label="Refresh" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />} />
      <FilterBar className="mb-4" activeCount={Object.keys(EMPTY).filter((k) => filters[k] && (cfg.showDistributor || k !== "distributorId")).length} onReset={() => setFilters(EMPTY)}>
        <SearchFilter value={filters.search} onChange={set("search")} placeholder="Name or code" className="w-full sm:w-64" />
        <SelectFilter label="Entity type" allLabel="All" options={[{ value: "DISTRIBUTOR", label: "Distributors" }, { value: "RETAILER", label: "Retailers" }]} value={filters.entityType} onChange={set("entityType")} />
        {cfg.showDistributor ? <SelectFilter label="Distributor" allLabel="All distributors" options={distributorOptions(lookups)} value={filters.distributorId} onChange={set("distributorId")} /> : null}
      </FilterBar>
      <Card>
        <DataTable bare manual rowKey="key" caption="Credit limits" columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (list.error?.message || "Unable to load credit limits.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          rowActions={cfg.canWrite ? (row) => [{ key: "edit", label: "Set credit limit", icon: Pencil, onClick: () => begin(row) }] : undefined}
          emptyTitle="No entities" emptyDescription="No distributors or retailers match these filters." />
      </Card>
      {cfg.canWrite ? (
        <Modal open={Boolean(edit)} onClose={busy ? undefined : () => setEdit(null)} title={`Credit limit — ${edit?.name || ""}`} description="Leave blank to clear the limit."
          footer={<><Button variant="secondary" onClick={() => setEdit(null)} disabled={busy}>Cancel</Button><Button onClick={save} loading={busy}>Save</Button></>}>
          <Input label="Credit limit (₹)" type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          {edit ? <p className="mt-2 text-caption text-ink-subtle">Currently utilised: ₹{edit.utilised.toLocaleString("en-IN")}</p> : null}
          {error ? <Alert tone="error" title="Not saved" className="mt-3">{error}</Alert> : null}
        </Modal>
      ) : null}
    </div>
  );
}
