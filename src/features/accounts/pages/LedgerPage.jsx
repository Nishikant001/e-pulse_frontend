import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import FilterBar from "../../../components/ui/FilterBar";
import Input from "../../../components/ui/Input";
import Alert from "../../../components/ui/Alert";
import DataTable from "../../../components/tables/DataTable";
import { SelectFilter } from "../../../components/forms";
import { formatDate, formatINR } from "../../../utils/format";
import { useAdminSession } from "../../adminAuth/adminSessionContext";
import { ACCOUNT_PORTALS, accountsApi } from "../api/accountsApi";
import { Dash, Money } from "../components/accountsUi";
import { distributorOptions, retailerOptions, useLookups } from "../components/accountsHooks";

/** Ledger over the existing journal: retailer / distributor receivables, or the distributor's scheme-claim account. */
export default function LedgerPage({ portal = "admin" }) {
  const cfg = ACCOUNT_PORTALS[portal];
  const api = useMemo(() => accountsApi(portal), [portal]);
  const { expire } = useAdminSession();
  const [f, setF] = useState({ entityType: portal === "admin" ? "RETAILER" : "DISTRIBUTOR", distributorId: "", entityId: "", account: "RECEIVABLE", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ status: "idle", data: null, error: null });
  const [n, setN] = useState(0);
  const lookups = useLookups(api, { distributorId: f.distributorId });
  const set = (k) => (v) => { setPage(1); setF((x) => ({ ...x, [k]: v, ...(k === "distributorId" ? { entityId: "" } : {}), ...(k === "entityType" ? { entityId: "", account: "RECEIVABLE" } : {}), ...(k === "account" && v === "CLAIMS" ? { entityType: "DISTRIBUTOR" } : {}) })); };

  // admin must pick an entity; a distributor defaults to its own book (the backend resolves "DISTRIBUTOR" with no id to itself)
  const entityId = f.entityType === "DISTRIBUTOR" ? (portal === "admin" ? f.distributorId : "") : f.entityId;
  const ready = portal === "distributor" ? (f.entityType === "DISTRIBUTOR" || Boolean(f.entityId)) : Boolean(entityId);

  useEffect(() => {
    if (!ready) { setState({ status: "idle", data: null, error: null }); return undefined; }
    const c = new AbortController();
    setState((s) => ({ status: "loading", data: s.data, error: null }));
    api.ledger({ entityType: f.entityType, entityId, account: f.account, from: f.from, to: f.to, page, pageSize: 50 }, c.signal)
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => { if (error?.name === "AbortError") return; if (error?.status === 401) expire?.(); setState({ status: "error", data: null, error }); });
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, ready, f.entityType, entityId, f.account, f.from, f.to, page, n]);

  const d = state.data;
  const columns = useMemo(() => [
    { key: "date", header: "Date", accessor: (r) => r.date, render: (v) => formatDate(v) },
    { key: "reference", header: "Reference", accessor: (r) => r.reference, render: (v) => <span className="font-medium">{v}</span> },
    { key: "type", header: "Transaction", accessor: (r) => r.type },
    ...(f.entityType === "DISTRIBUTOR" && f.account === "RECEIVABLE" ? [{ key: "retailer", header: "Retailer", accessor: (r) => r.retailer, render: (v) => v || <Dash /> }] : []),
    { key: "debit", header: "Debit", align: "right", accessor: (r) => r.debit, render: (v) => (v ? <Money value={v} /> : <Dash />) },
    { key: "credit", header: "Credit", align: "right", accessor: (r) => r.credit, render: (v) => (v ? <Money value={v} /> : <Dash />) },
    { key: "balance", header: "Running balance", align: "right", accessor: (r) => r.balance, render: (v) => <Money value={v} className="font-semibold" /> },
    { key: "remarks", header: "Remarks", minWidth: "16rem", accessor: (r) => r.remarks, render: (v) => v || <Dash /> },
  ], [f.entityType, f.account]);

  return (
    <div>
      <PageHeader title="Ledger" description="Built from the existing journal. Debit increases what is owed; credit (payments, credit notes, returns) reduces it." actions={<IconButton icon={RefreshCw} label="Refresh" variant="outline" onClick={() => setN((x) => x + 1)} disabled={state.status === "loading"} />} />
      <FilterBar className="mb-4" activeCount={["from", "to"].filter((k) => f[k]).length} onReset={() => setF((x) => ({ ...x, from: "", to: "" }))}>
        <SelectFilter label="Account" allLabel="Receivables" options={[{ value: "RECEIVABLE", label: "Receivables" }, { value: "CLAIMS", label: "Scheme claims (due from company)" }]} value={f.account} onChange={(v) => set("account")(v || "RECEIVABLE")} />
        <SelectFilter label="Ledger of" allLabel="Retailer" options={[{ value: "RETAILER", label: "Retailer" }, { value: "DISTRIBUTOR", label: portal === "admin" ? "Distributor (all retailers)" : "My account (all retailers)" }]} value={f.entityType} onChange={(v) => set("entityType")(v || "RETAILER")} disabled={f.account === "CLAIMS"} />
        {cfg.showDistributor ? <SelectFilter label="Distributor" allLabel="Select…" options={distributorOptions(lookups)} value={f.distributorId} onChange={set("distributorId")} /> : null}
        {f.entityType === "RETAILER" ? <SelectFilter label="Retailer" allLabel="Select…" options={retailerOptions(lookups, f.distributorId)} value={f.entityId} onChange={set("entityId")} /> : null}
        <Input type="date" label="From" value={f.from} max={f.to || undefined} onChange={(e) => set("from")(e.target.value)} className="w-40" />
        <Input type="date" label="To" value={f.to} min={f.from || undefined} onChange={(e) => set("to")(e.target.value)} className="w-40" />
      </FilterBar>
      {!ready ? <Alert tone="info" title="Choose whose ledger to view">{portal === "admin" ? "Select a distributor, and a retailer if you want a single retailer's ledger." : "Select a retailer, or choose “My account”."}</Alert> : null}
      {state.status === "error" ? <Alert tone="error" title="Unable to load the ledger">{state.error?.message}</Alert> : null}
      {d ? (
        <>
          <p className="mb-3 text-body text-ink-muted"><b>{d.entity.name}</b> ({d.entity.code}) · {d.accountName} · opening {formatINR(d.openingBalance)} · debit {formatINR(d.totalDebit)} · credit {formatINR(d.totalCredit)} · closing <b>{formatINR(d.closingBalance)}</b></p>
          <Card>
            <DataTable bare manual rowKey="id" caption="Ledger" columns={columns} data={d.entries} loading={state.status === "loading"} page={page} pageSize={50} total={d.total} onPageChange={setPage} emptyTitle="No ledger entries" emptyDescription="There are no postings in this period." />
          </Card>
        </>
      ) : null}
    </div>
  );
}
