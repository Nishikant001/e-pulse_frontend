import { useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import PageHeader from "../../../components/ui/PageHeader";
import DataTable from "../../../components/tables/DataTable";
import { superAdminApi } from "../api/superAdminApi";

export default function RolesPermissionsPage() {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const load = useCallback((signal) => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    superAdminApi.roles(signal)
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => { if (error?.name !== "AbortError") setState({ status: "error", data: null, error }); });
  }, []);
  useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort(); }, [load]);
  const columns = [
    { key: "name", header: "Role", render: (v) => <span className="font-medium">{v}</span> },
    { key: "permissions", header: "ERP permissions", render: (v) => v?.length ? <div className="flex flex-wrap gap-1">{v.map((p) => <Badge key={p} tone="info">{p}</Badge>)}</div> : "No ERP permissions" },
  ];
  return (
    <div>
      <PageHeader title="Roles & Permissions" description="Live role definitions from the backend. These roles currently govern ERP integration permissions only; they do not yet provide per-module access control across the entire Admin portal." />
      <Card>
        {state.status === "error" ? <ErrorState title="Unable to load roles" message={state.error?.message || "Please try again."} onRetry={() => load()} /> :
          <DataTable bare rowKey="id" caption="Configured ERP roles" columns={columns} data={state.data?.roles || []} loading={state.status === "loading"} emptyIcon={ShieldCheck} emptyTitle="No roles configured" emptyDescription="No role definitions were returned by the server." />}
      </Card>
      <p className="mt-3 text-sm text-ink-muted">Role assignments are selected when creating an admin account. Custom module-level permissions are not implemented in the current backend.</p>
    </div>
  );
}
