import { useMemo, useState } from "react";
import { Building2, CircleCheck, Clock, Download, Eye, Store } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Drawer from "../../../components/ui/Drawer";
import FilterBar from "../../../components/ui/FilterBar";
import KpiCard from "../../../components/ui/KpiCard";
import PageHeader from "../../../components/ui/PageHeader";
import SectionHeader from "../../../components/ui/SectionHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import { SearchFilter, SelectFilter } from "../../../components/forms";
import { useToast } from "../../../components/feedback";
import DataTable from "../../../components/tables/DataTable";
import InfoGrid from "../../adminSales/components/InfoGrid";
import { formatDate, formatDateTime, formatNumber } from "../../../utils/format";
import DemoNotice from "../components/DemoNotice";
import { DISTRIBUTORS } from "../demoData";

const PLAN_TONE = { Starter: "neutral", Growth: "info", Enterprise: "brand" };

/** Super Admin → All Distributors (sample data): the whole network, with the admin who owns each one. */
export default function NetworkDistributorsPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);

  const rows = useMemo(
    () => DISTRIBUTORS.filter((d) => (!status || d.status === status) && (!search || `${d.code} ${d.name} ${d.city} ${d.owner}`.toLowerCase().includes(search.toLowerCase()))),
    [search, status],
  );
  const count = (s) => DISTRIBUTORS.filter((d) => d.status === s).length;

  const columns = [
    { key: "code", header: "Code", sortable: true, render: (v) => <span className="font-mono text-ink-muted">{v}</span> },
    {
      key: "name", header: "Distributor", sortable: true, accessor: (d) => d.name,
      render: (v, d) => (
        <button type="button" onClick={() => setSelected(d)} className="text-left font-medium text-brand-700 underline-offset-2 hover:underline">
          {v}
          <span className="block text-caption font-normal text-ink-subtle">{d.city}, {d.state}</span>
        </button>
      ),
    },
    { key: "owner", header: "Managed by", sortable: true },
    { key: "plan", header: "Plan", sortable: true, render: (v) => <Badge tone={PLAN_TONE[v]}>{v}</Badge> },
    { key: "retailers", header: "Retailers", sortable: true, align: "right", render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
    { key: "status", header: "Status", sortable: true, render: (v) => <StatusBadge status={v} domain="distributor" /> },
  ];
  const rowActions = (d) => [{ key: "view", label: "View details", icon: Eye, onClick: () => setSelected(d) }];

  return (
    <div>
      <PageHeader
        title="All Distributors"
        description="Every distributor on the platform, across all admin accounts."
        actions={<Button variant="secondary" leftIcon={Download} onClick={() => toast.info("Export is not available in this preview.")}>Export</Button>}
      />
      <DemoNotice />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total distributors" icon={Building2} status="brand" value={formatNumber(DISTRIBUTORS.length)} />
        <KpiCard title="Active" icon={CircleCheck} status="success" value={formatNumber(count("active"))} />
        <KpiCard title="Pending" icon={Clock} status="warning" value={formatNumber(count("pending"))} />
        <KpiCard title="Retailers served" icon={Store} status="info" value={formatNumber(DISTRIBUTORS.reduce((a, d) => a + d.retailers, 0))} />
      </div>

      <FilterBar className="mb-4" activeCount={(search ? 1 : 0) + (status ? 1 : 0)} onReset={() => { setSearch(""); setStatus(""); }}>
        <SearchFilter label="Search" value={search} onChange={setSearch} placeholder="Code, name, city or admin" className="w-full sm:w-80" />
        <SelectFilter label="Status" allLabel="All statuses" value={status} onChange={setStatus} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "pending", label: "Pending" }]} />
      </FilterBar>

      <Card>
        <DataTable bare rowKey="id" caption="Distributors" columns={columns} data={rows} rowActions={rowActions} responsive="cards" cardTitleKey="name" emptyIcon={Building2} emptyTitle="No distributors match" emptyDescription="Try changing the search or status filter." />
      </Card>

      <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} size="md" title={selected?.name || ""} description={selected ? `${selected.code} · ${selected.city}, ${selected.state}` : undefined}>
        {selected ? (
          <div className="space-y-6">
            <section>
              <SectionHeader as="h3" title="Account" />
              <InfoGrid
                columns="sm:grid-cols-2"
                items={[
                  { label: "Status", value: <StatusBadge status={selected.status} domain="distributor" /> },
                  { label: "Plan", value: <Badge tone={PLAN_TONE[selected.plan]}>{selected.plan}</Badge> },
                  { label: "Managed by", value: selected.owner },
                  { label: "Onboarded", value: formatDate(selected.onboardedAt) },
                  { label: "Last active", value: selected.lastActiveAt ? formatDateTime(selected.lastActiveAt) : "Never" },
                  { label: "Retailers", value: formatNumber(selected.retailers) },
                ]}
              />
            </section>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
