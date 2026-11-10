import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import FilterBar from "../../../components/ui/FilterBar";
import Input from "../../../components/ui/Input";
import DataTable from "../../../components/tables/DataTable";
import { SearchFilter, SelectFilter } from "../../../components/forms";
import { useAdminSession } from "../../adminAuth/adminSessionContext";
import { ACCOUNT_PORTALS, BUCKET_LABEL, accountsApi } from "../api/accountsApi";
import { BucketBadge, Dash, Money } from "../components/accountsUi";
import { distributorOptions, useLookups } from "../components/accountsHooks";

const EMPTY = { search: "", entityType: "RETAILER", distributorId: "", asOf: "" };

/** Receivable ageing from each invoice's DUE date (not its creation date). */
export default function AgeingPage({ portal = "admin" }) {
  const cfg = ACCOUNT_PORTALS[portal];
  const api = useMemo(() => accountsApi(portal), [portal]);
  const { expire } = useAdminSession();
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [n, setN] = useState(0);
  const lookups = useLookups(api, {});
  const set = (k) => (v) => { setPage(1); setFilters((f) => ({ ...f, [k]: v })); };

  useEffect(() => {
    const c = new AbortController();
    setState((s) => ({ status: "loading", data: s.data, error: null }));
    api.ageing({ ...filters, page, pageSize: 25 }, c.signal).then((data) => setState({ status: "ready", data, error: null })).catch((error) => {
      if (error?.name === "AbortError") return;
      if (error?.status === 401) expire?.();
      setState({ status: "error", data: null, error });
    });
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, JSON.stringify(filters), page, n]);

  const d = state.data;
  const columns = useMemo(() => [
    { key: "name", header: filters.entityType === "DISTRIBUTOR" ? "Distributor" : "Retailer", sticky: true, minWidth: "13rem", accessor: (r) => r.name, render: (v, r) => (<><span className="block font-medium">{v}</span><span className="block text-caption text-ink-subtle">{r.code}</span></>) },
    ...(cfg.showDistributor && filters.entityType === "RETAILER" ? [{ key: "distributorName", header: "Distributor", accessor: (r) => r.distributorName }] : []),
    { key: "invoiceCount", header: "Open invoices", align: "right", accessor: (r) => r.invoiceCount },
    ...Object.keys(BUCKET_LABEL).map((b) => ({ key: b, header: BUCKET_LABEL[b], align: "right", accessor: (r) => r.buckets[b], render: (v) => (v > 0 ? <Money value={v} /> : <Dash />) })),
    { key: "outstanding", header: "Outstanding", align: "right", accessor: (r) => r.outstanding, render: (v) => <Money value={v} className="font-semibold" /> },
    { key: "overdue", header: "Overdue", align: "right", accessor: (r) => r.overdue, render: (v) => (v > 0 ? <Money value={v} className="text-error-700" /> : <Dash />) },
    { key: "ageingBucket", header: "Worst bucket", accessor: (r) => r.ageingBucket, render: (v) => <BucketBadge bucket={v} /> },
  ], [cfg, filters.entityType]);

  return (
    <div>
      <PageHeader title="Receivables ageing" description={`Open invoices grouped by days past due date${d ? ` as of ${d.asOf}` : ""}.`} actions={<IconButton icon={RefreshCw} label="Refresh" variant="outline" onClick={() => setN((x) => x + 1)} disabled={state.status === "loading"} />} />
      <FilterBar className="mb-4" activeCount={["search", "distributorId", "asOf"].filter((k) => filters[k]).length} onReset={() => { setPage(1); setFilters(EMPTY); }}>
        <SearchFilter value={filters.search} onChange={set("search")} placeholder="Name or code" className="w-full sm:w-64" />
        {cfg.showDistributor ? <SelectFilter label="Group by" allLabel="Retailer" options={[{ value: "RETAILER", label: "Retailer" }, { value: "DISTRIBUTOR", label: "Distributor" }]} value={filters.entityType} onChange={(v) => set("entityType")(v || "RETAILER")} /> : null}
        {cfg.showDistributor ? <SelectFilter label="Distributor" allLabel="All distributors" options={distributorOptions(lookups)} value={filters.distributorId} onChange={set("distributorId")} /> : null}
        <Input type="date" label="As of" value={filters.asOf} onChange={(e) => set("asOf")(e.target.value)} className="w-40" />
      </FilterBar>
      {d ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {d.buckets.map((b) => <div key={b.key} className="rounded-card border border-line bg-surface p-3"><p className="text-caption text-ink-subtle">{b.label}</p><p className="mt-1 text-body font-semibold tabular-nums"><Money value={d.totals.buckets[b.key]} /></p></div>)}
        </div>
      ) : null}
      <Card>
        <DataTable bare manual rowKey="entityId" caption="Receivables ageing" columns={columns} data={d?.items || []} loading={state.status === "loading"}
          error={state.status === "error" ? (state.error?.message || "Unable to load ageing.") : null} onRetry={() => setN((x) => x + 1)}
          page={page} pageSize={25} total={d?.total ?? 0} onPageChange={setPage} emptyTitle="No open receivables" emptyDescription="Nothing is outstanding for the selected filters." />
      </Card>
    </div>
  );
}
