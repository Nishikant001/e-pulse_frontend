import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Building2, CircleCheck, Clock, Ban, ShieldCheck, ShieldAlert, UserCheck, Users, RefreshCw } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Card from "../../../components/ui/Card";
import Drawer from "../../../components/ui/Drawer";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import IconButton from "../../../components/ui/IconButton";
import KpiCard from "../../../components/ui/KpiCard";
import PageHeader from "../../../components/ui/PageHeader";
import { SkeletonTable } from "../../../components/ui/Skeleton";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/tables/DataTable";
import { formatDate, formatDateTime, formatNumber } from "../../../utils/format";
import { superAdminApi } from "../api/superAdminApi";

const Dash = () => <span className="text-ink-subtle">—</span>;
const roleLabel = (r) => String(r || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const roleTone = (r) => (String(r).trim().toUpperCase() === "SUPER_ADMIN" ? "brand" : "neutral");
const isForbidden = (err) => err?.status === 403;

/** Lists the distributors one admin created (loaded when the drawer opens). */
function AdminDistributorsPanel({ admin }) {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const c = new AbortController();
    setState({ status: "loading", data: null, error: null });
    superAdminApi
      .adminDistributors(admin.id, c.signal)
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => {
        if (error?.name !== "AbortError") setState({ status: "error", data: null, error });
      });
    return () => c.abort();
  }, [admin.id, attempt]);

  if (state.status === "loading") {
    return (
      <div role="status" aria-label="Loading distributors">
        <SkeletonTable rows={4} columns={2} />
      </div>
    );
  }
  if (state.status === "error") {
    return <ErrorState compact message={state.error?.message || "Unable to load distributors."} onRetry={() => setAttempt((n) => n + 1)} />;
  }
  const items = state.data?.distributors || [];
  if (!items.length) {
    return <EmptyState compact icon={Building2} title="No distributors created" description="Distributors this admin adds from the Admin portal will be listed here." />;
  }
  return (
    <ul className="divide-y divide-line rounded-card border border-line">
      {items.map((d) => (
        <li key={d.id}>
          <Link
            to={`/admin/distributors/${d.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3 outline-none hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 font-medium text-brand-700">
                <span className="truncate">{d.name}</span>
                <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
              </span>
              <span className="block truncate text-caption text-ink-subtle">
                {d.code}
                {d.city ? ` · ${d.city}` : ""} · Added {formatDate(d.createdAt)}
              </span>
            </span>
            <StatusBadge status={d.status} domain="distributor" size="sm" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Super Admin overview — intended route /admin/super-admin (SUPER_ADMIN only; the API enforces it). */
export default function SuperAdminDashboardPage() {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [selected, setSelected] = useState(null);

  const load = useCallback((signal) => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    superAdminApi
      .overview(signal)
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => {
        if (error?.name !== "AbortError") setState({ status: "error", data: null, error });
      });
  }, []);

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);
    return () => c.abort();
  }, [load]);

  const columns = useMemo(
    () => [
      {
        key: "name", header: "Admin", sortable: true, sticky: true, minWidth: "13rem", accessor: (r) => r.name,
        render: (v, r) => (
          <button
            type="button"
            onClick={() => setSelected(r)}
            aria-label={`View distributors created by ${r.name}`}
            className="block rounded-sm text-left font-medium text-brand-700 underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {v}
          </button>
        ),
      },
      { key: "email", header: "Email", sortable: true, minWidth: "14rem", accessor: (r) => r.email, render: (v) => <span className="break-all">{v}</span> },
      { key: "role", header: "Role", sortable: true, accessor: (r) => r.role, render: (v) => <Badge tone={roleTone(v)}>{roleLabel(v)}</Badge> },
      { key: "status", header: "Status", sortable: true, accessor: (r) => (r.isActive ? "active" : "inactive"), render: (v) => <StatusBadge status={v} domain="distributor" /> },
      {
        key: "created", header: "Distributors created", sortable: true, align: "right", minWidth: "11rem", accessor: (r) => r.distributorsCreated,
        render: (v, r) => (
          <>
            <span className="block font-medium tabular-nums text-ink">{formatNumber(v)}</span>
            <span className="block whitespace-nowrap text-caption text-ink-subtle tabular-nums">
              {formatNumber(r.activeDistributors)} active · {formatNumber(r.inactiveDistributors)} inactive
            </span>
          </>
        ),
      },
      { key: "lastLogin", header: "Last login", sortable: true, accessor: (r) => r.lastLoginAt, render: (v) => (v ? <span className="whitespace-nowrap">{formatDateTime(v)}</span> : <span className="text-ink-subtle">Never</span>) },
      { key: "createdAt", header: "Created", sortable: true, accessor: (r) => r.createdAt, render: (v) => (v ? <span className="whitespace-nowrap">{formatDate(v)}</span> : <Dash />) },
    ],
    [],
  );

  const header = (
    <PageHeader
      title="Admins & Users"
      description="Every admin account and how many distributors each one has onboarded, with network-wide totals. Distributors that signed up themselves, or existed before tracking began, are shown as unassigned."
      actions={<IconButton icon={RefreshCw} label="Refresh overview" variant="outline" onClick={() => load()} disabled={state.status === "loading"} />}
    />
  );

  if (state.status === "error" && isForbidden(state.error)) {
    return (
      <div>
        {header}
        <Card>
          <EmptyState icon={ShieldAlert} title="Only Super Admins can view this page" description="Your account does not have the Super Admin role. Ask a Super Admin if you need access." />
        </Card>
      </div>
    );
  }

  const loading = state.status === "loading";
  const t = state.data?.totals;
  const kpis = [
    { title: "Admins", value: t && formatNumber(t.admins.total), icon: Users, status: "brand", footer: t && `${formatNumber(t.admins.active)} active · ${formatNumber(t.admins.inactive)} inactive` },
    { title: "Distributors", value: t && formatNumber(t.distributors.total), icon: Building2, status: "brand", footer: t && `${formatNumber(t.retailers)} retailers across the network` },
    { title: "Active distributors", value: t && formatNumber(t.distributors.active), icon: CircleCheck, status: "success" },
    { title: "Inactive distributors", value: t && formatNumber(t.distributors.inactive), icon: Ban, status: "neutral" },
    { title: "Pending distributors", value: t && formatNumber(t.distributors.pending), icon: Clock, status: "warning" },
    { title: "Unassigned distributors", value: t && formatNumber(t.distributors.unassigned), icon: ShieldCheck, status: "info", footer: "Self sign-ups and pre-existing records" },
  ];

  return (
    <div>
      {header}

      <section aria-label="Network totals" className="mb-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <KpiCard
            key={k.title} title={k.title} value={k.value} icon={k.icon} status={k.status} footer={k.footer}
            loading={loading} error={state.status === "error"} onRetry={() => load()}
          />
        ))}
      </section>

      <Card>
        {state.status === "error" ? (
          <ErrorState title="Unable to load the overview" message={state.error?.message || "Please try again."} onRetry={() => load()} />
        ) : (
          <DataTable
            bare rowKey="id" caption="Admins" columns={columns} data={state.data?.admins || []} loading={loading}
            searchable searchPlaceholder="Search by name, email or role" searchKeys={["name", "email", "role"]}
            initialPageSize={10} onRowClick={(r) => setSelected(r)}
            emptyTitle="No admins found" emptyDescription="No admin account matches your search."
          />
        )}
      </Card>

      <Drawer
        open={Boolean(selected)} onClose={() => setSelected(null)} size="md"
        title={selected ? selected.name : ""}
        description={selected ? `${selected.email} · ${formatNumber(selected.distributorsCreated)} distributor${selected.distributorsCreated === 1 ? "" : "s"} created` : undefined}
      >
        {selected ? <AdminDistributorsPanel admin={selected} /> : null}
      </Drawer>
    </div>
  );
}
