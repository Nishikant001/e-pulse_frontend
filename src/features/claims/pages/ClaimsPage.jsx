import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Plus, RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import FilterBar from "../../../components/ui/FilterBar";
import DataTable from "../../../components/tables/DataTable";
import Input from "../../../components/ui/Input";
import { SearchFilter, SelectFilter } from "../../../components/forms";
import { formatDate, formatINR } from "../../../utils/format";
import { useMastersList } from "../../adminMasters/hooks/useMastersList"; // reused: generic server-driven list state
import { CLAIM_PORTALS, claimsApi } from "../api/claimsApi";

const EMPTY = { q: "", status: "", type: "", distributorId: "", schemeId: "", customerId: "", from: "", to: "" };
const STATUS_LABEL = { DRAFT: "Draft", SUBMITTED: "Submitted", UNDER_REVIEW: "Under review", APPROVED: "Approved", REJECTED: "Rejected", NEEDS_CORRECTION: "Needs correction", RESUBMITTED: "Resubmitted" };
const Dash = () => <span className="text-ink-subtle">—</span>;
const date = (v) => (v ? formatDate(v) : <Dash />);

/** Claims list — /admin/claims (all claims) and /dashboard/claims (own claims only). */
export default function ClaimsPage({ portal = "distributor" }) {
  const cfg = CLAIM_PORTALS[portal];
  const navigate = useNavigate();
  const api = useMemo(() => claimsApi(portal), [portal]);
  const [filters, setFilters] = useState(EMPTY);
  const [lookups, setLookups] = useState({});
  const list = useMastersList({ fetcher: api.list, filters, defaultSort: { key: "createdAt", dir: "desc" } });
  const keys = cfg.showDistributor ? Object.keys(EMPTY) : Object.keys(EMPTY).filter((k) => k !== "distributorId");

  useEffect(() => {
    const c = new AbortController();
    api.lookups(c.signal).then(setLookups).catch(() => {});
    return () => c.abort();
  }, [api]);

  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));
  const open = (id) => navigate(`${cfg.base}/${id}`);

  const columns = useMemo(() => {
    const cols = [
      { key: "number", header: "Claim", sortable: true, sticky: true, minWidth: "11rem", accessor: (r) => r.number,
        render: (v, r) => (<button type="button" onClick={() => open(r.id)} className="block text-left"><span className="block font-medium text-brand-700 underline-offset-2 hover:underline">{v}</span><span className="block text-caption text-ink-subtle">{r.invoiceNumber ? `Invoice ${r.invoiceNumber}` : "Scheme claim"}</span></button>) },
      { key: "type", header: "Type", accessor: () => "Scheme claim", render: (v) => v },
    ];
    if (cfg.showDistributor) cols.push({ key: "distributor", header: "Distributor", sortable: true, minWidth: "12rem", accessor: (r) => r.distributor?.name, render: (v, r) => (<><span className="block">{v || <Dash />}</span><span className="block text-caption text-ink-subtle">{r.distributor?.code}</span></>) });
    cols.push(
      { key: "retailer", header: "Retailer", sortable: true, minWidth: "11rem", accessor: (r) => r.retailer?.name, render: (v) => v || <Dash /> },
      { key: "scheme", header: "Scheme", sortable: true, minWidth: "11rem", accessor: (r) => r.scheme?.code, render: (v, r) => (<><span className="block">{r.scheme?.name}</span><span className="block text-caption text-ink-subtle">{v}</span></>) },
      { key: "amount", header: "Amount", sortable: true, accessor: (r) => r.amount, render: (v) => <span className="tabular-nums">{formatINR(v)}</span> },
      { key: "claimDate", header: "Claim date", sortable: true, accessor: (r) => r.claimDate, render: date },
      { key: "period", header: "Period", sortable: true, accessor: (r) => r.periodFrom, render: (v, r) => `${formatDate(r.periodFrom)} – ${formatDate(r.periodTo)}` },
      { key: "status", header: "Status", sortable: true, accessor: (r) => r.status, render: (v) => <StatusBadge status={v} domain="claim" /> },
      { key: "submittedAt", header: "Submitted", sortable: true, accessor: (r) => r.submittedAt, render: date },
      { key: "reviewedAt", header: "Reviewed", sortable: true, accessor: (r) => r.reviewedAt, render: date },
      { key: "createdAt", header: "Created", sortable: true, accessor: (r) => r.createdAt, render: date },
    );
    return cols;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg, navigate]);

  return (
    <div>
      <PageHeader
        title="Claims"
        description={portal === "admin" ? "Scheme claims from every distributor. Only an administrator can review, approve, reject or return a claim." : "Your scheme claims and their status. Claims are decided by the administrator."}
        actions={(
          <>
            <IconButton icon={RefreshCw} label="Refresh claims" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
            {cfg.canCreate ? <Button leftIcon={Plus} onClick={() => navigate(`${cfg.base}/new`)}>New claim</Button> : null}
          </>
        )}
      />
      <FilterBar className="mb-4" activeCount={keys.filter((k) => filters[k]).length} onReset={() => setFilters(EMPTY)}>
        <SearchFilter value={filters.q} onChange={set("q")} placeholder={portal === "admin" ? "Claim no., distributor, scheme, invoice" : "Claim no., scheme, invoice"} className="w-full sm:w-72" />
        <SelectFilter label="Status" allLabel="All statuses" options={(lookups.statuses || Object.keys(STATUS_LABEL)).map((s) => ({ value: s, label: STATUS_LABEL[s] || s }))} value={filters.status} onChange={set("status")} />
        <SelectFilter label="Claim type" allLabel="All types" options={(lookups.types || []).map((t) => ({ value: t.value, label: t.label }))} value={filters.type} onChange={set("type")} />
        {cfg.showDistributor ? <SelectFilter label="Distributor" allLabel="All distributors" options={(lookups.distributors || []).map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }))} value={filters.distributorId} onChange={set("distributorId")} /> : null}
        <SelectFilter label="Scheme" allLabel="All schemes" options={(lookups.schemes || []).map((s) => ({ value: String(s.id), label: `${s.name} (${s.code})` }))} value={filters.schemeId} onChange={set("schemeId")} />
        <SelectFilter label="Retailer" allLabel="All retailers" options={(lookups.retailers || []).map((r) => ({ value: String(r.id), label: r.name }))} value={filters.customerId} onChange={set("customerId")} />
        <Input type="date" aria-label="Claim date from" value={filters.from} max={filters.to || undefined} onChange={(e) => set("from")(e.target.value)} className="w-40" />
        <Input type="date" aria-label="Claim date to" value={filters.to} min={filters.from || undefined} onChange={(e) => set("to")(e.target.value)} className="w-40" />
      </FilterBar>
      <Card>
        <DataTable
          bare manual rowKey="id" caption="Claims" columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? (list.error?.message || "Unable to load claims. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort} onRowClick={(r) => open(r.id)}
          rowActions={(row) => [
            { key: "view", label: "View claim", icon: Eye, onClick: () => open(row.id) },
            ...(cfg.canCreate && row.editable ? [{ key: "edit", label: "Edit claim", icon: Pencil, onClick: () => navigate(`${cfg.base}/${row.id}/edit`) }] : []),
          ]}
          emptyTitle="No claims found" emptyDescription={cfg.canCreate ? "Create a claim for a scheme benefit you gave on an invoice." : "Try changing the filters."}
        />
      </Card>
    </div>
  );
}
