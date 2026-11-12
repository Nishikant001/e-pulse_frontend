import { useCallback, useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/tables/DataTable";
import { superAdminApi } from "../api/superAdminApi";

export default function NetworkDistributorsPage() {
  const [state, setState] = useState({ status: "loading", rows: [], error: null });
  const load = useCallback((signal) => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    superAdminApi.distributors(signal)
      .then((rows) => setState({ status: "ready", rows: Array.isArray(rows) ? rows : [], error: null }))
      .catch((error) => { if (error?.name !== "AbortError") setState({ status: "error", rows: [], error }); });
  }, []);
  useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort(); }, [load]);
  const columns = [
    { key: "code", header: "Code", render: (v) => v || "—" },
    { key: "name", header: "Distributor", render: (v) => <span className="font-medium">{v || "—"}</span> },
    { key: "city", header: "City", render: (v, r) => [v, r.region].filter(Boolean).join(", ") || "—" },
    { key: "owner", header: "Created by", render: (v, r) => v ? <span>{v}<span className="block text-xs text-ink-subtle">{r.ownerEmail}</span></span> : "Unassigned" },
    { key: "retailers", header: "Retailers", align: "right" },
    { key: "status", header: "Status", render: (v) => <StatusBadge status={v} domain="distributor" /> },
  ];
  return (
    <div>
      <PageHeader title="All Distributors" description="Live distributor records read from the production database." />
      <Card>
        {state.status === "error" ? <ErrorState title="Unable to load distributors" message={state.error?.message || "Please try again."} onRetry={() => load()} /> :
          <DataTable bare rowKey="id" caption="Live distributors" columns={columns} data={state.rows} loading={state.status === "loading"} searchable searchPlaceholder="Search distributor, code or city" searchKeys={["code", "name", "city", "region", "owner", "ownerEmail"]} emptyIcon={Building2} emptyTitle="No distributors yet" emptyDescription="No distributor records exist in the database." />}
      </Card>
    </div>
  );
}
