import { useCallback, useEffect, useState } from "react";
import { Building2, Users, Store, ShieldCheck } from "lucide-react";
import WelcomeBanner from "../../../components/dashboard/WelcomeBanner";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import KpiCard from "../../../components/ui/KpiCard";
import PageHeader from "../../../components/ui/PageHeader";
import { useOptionalAdminSession } from "../../adminAuth/adminSessionContext";
import { superAdminApi } from "../api/superAdminApi";

export default function SuperAdminHomePage() {
  const admin = useOptionalAdminSession()?.admin;
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  const load = useCallback((signal) => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    superAdminApi.overview(signal)
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => {
        if (error?.name !== "AbortError") setState({ status: "error", data: null, error });
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const totals = state.data?.totals;
  return (
    <div>
      <WelcomeBanner
        tone="super"
        name={admin?.name}
        subtitle="Live platform overview from the e-Pulse database."
        actions={[{ label: "Admins & Users", to: "/admin/super-admin", icon: Users }]}
      />
      <PageHeader title="Platform Dashboard" description="Only live records returned by the server are shown here." />
      {state.status === "error" ? (
        <Card><ErrorState title="Unable to load platform data" message={state.error?.message || "Please try again."} onRetry={() => load()} /></Card>
      ) : (
        <>
          <section aria-label="Platform totals" className="mb-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Admin accounts" icon={Users} status="brand" value={totals ? totals.admins.total : "—"} footer={totals ? `${totals.admins.active} active · ${totals.admins.inactive} inactive` : undefined} loading={state.status === "loading"} />
            <KpiCard title="Distributors" icon={Building2} status="info" value={totals ? totals.distributors.total : "—"} footer={totals ? `${totals.distributors.active} active` : undefined} loading={state.status === "loading"} />
            <KpiCard title="Retailers" icon={Store} status="success" value={totals ? totals.retailers : "—"} loading={state.status === "loading"} />
            <KpiCard title="Unassigned distributors" icon={ShieldCheck} status="warning" value={totals ? totals.distributors.unassigned : "—"} loading={state.status === "loading"} />
          </section>
          <Card>
            {state.status === "loading" ? <p className="p-5 text-sm text-ink-muted">Loading live platform data…</p> :
              <EmptyState title="Live overview loaded" description="Use Admins & Users to manage administrator accounts and inspect distributor ownership." />}
          </Card>
        </>
      )}
    </div>
  );
}
