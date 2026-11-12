import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import PageHeader from "../../../components/ui/PageHeader";
import DataTable from "../../../components/tables/DataTable";
import { formatDate } from "../../../utils/format";
import { superAdminApi } from "../api/superAdminApi";

export default function OnboardingRequestsPage() {
  const [state, setState] = useState({ status: "loading", rows: [], error: null });
  const load = useCallback((signal) => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    superAdminApi.onboarding(signal)
      .then((rows) => setState({ status: "ready", rows: Array.isArray(rows) ? rows : [], error: null }))
      .catch((error) => { if (error?.name !== "AbortError") setState({ status: "error", rows: [], error }); });
  }, []);
  useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort(); }, [load]);
  const columns = [
    { key: "business", header: "Business", render: (v) => <span className="font-medium">{v || "—"}</span> },
    { key: "contact", header: "Contact person", render: (v) => v || "—" },
    { key: "email", header: "Email", render: (v) => v || "—" },
    { key: "city", header: "City", render: (v, r) => [v, r.region].filter(Boolean).join(", ") || "—" },
    { key: "taxNumber", header: "Tax number", render: (v) => v || "—" },
    { key: "submittedAt", header: "Submitted", render: (v) => formatDate(v) },
  ];
  return (
    <div>
      <PageHeader title="Onboarding Requests" description="Pending distributor records from the live database. This view is read-only." />
      <Card>
        {state.status === "error" ? <ErrorState title="Unable to load onboarding records" message={state.error?.message || "Please try again."} onRetry={() => load()} /> :
          <DataTable bare rowKey="id" caption="Pending onboarding records" columns={columns} data={state.rows} loading={state.status === "loading"} searchable searchPlaceholder="Search business, contact or city" searchKeys={["business", "contact", "email", "city", "region", "taxNumber"]} emptyIcon={ClipboardCheck} emptyTitle="No pending onboarding requests" emptyDescription="There are no distributor records with pending status." />}
      </Card>
    </div>
  );
}
