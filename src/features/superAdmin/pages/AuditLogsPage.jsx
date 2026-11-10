import { useMemo, useState } from "react";
import { Download, ScrollText } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import FilterBar from "../../../components/ui/FilterBar";
import PageHeader from "../../../components/ui/PageHeader";
import { SearchFilter, SelectFilter } from "../../../components/forms";
import { useToast } from "../../../components/feedback";
import DataTable from "../../../components/tables/DataTable";
import { formatDateTime } from "../../../utils/format";
import DemoNotice from "../components/DemoNotice";
import { AUDIT_LOGS } from "../demoData";

const OUTCOME_TONE = { Success: "success", Failed: "error", Denied: "warning" };
const MODULES = [...new Set(AUDIT_LOGS.map((l) => l.module))].sort();

/** Super Admin → Audit Logs (sample data): who did what, when and from where. */
export default function AuditLogsPage() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("");
  const [outcome, setOutcome] = useState("");

  const rows = useMemo(
    () =>
      AUDIT_LOGS.filter(
        (l) => (!module || l.module === module) && (!outcome || l.outcome === outcome) && (!search || `${l.actor} ${l.action} ${l.target}`.toLowerCase().includes(search.toLowerCase())),
      ),
    [search, module, outcome],
  );

  const columns = [
    { key: "at", header: "When", sortable: true, render: (v) => <span className="whitespace-nowrap">{formatDateTime(v)}</span> },
    { key: "actor", header: "Actor", sortable: true, render: (v, l) => (<><span className="block font-medium">{v}</span><span className="block text-caption text-ink-subtle">{l.role}</span></>) },
    { key: "action", header: "Action", sortable: true },
    { key: "target", header: "Target" },
    { key: "module", header: "Module", sortable: true, render: (v) => <Badge tone="neutral">{v}</Badge> },
    { key: "ip", header: "IP address", render: (v) => <span className="font-mono text-ink-muted">{v}</span> },
    { key: "outcome", header: "Outcome", sortable: true, render: (v) => <Badge tone={OUTCOME_TONE[v]} dot>{v}</Badge> },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="A tamper-evident record of sensitive actions taken on the platform."
        actions={<Button variant="secondary" leftIcon={Download} onClick={() => toast.info("Export is not available in this preview.")}>Export</Button>}
      />
      <DemoNotice />

      <FilterBar className="mb-4" activeCount={(search ? 1 : 0) + (module ? 1 : 0) + (outcome ? 1 : 0)} onReset={() => { setSearch(""); setModule(""); setOutcome(""); }}>
        <SearchFilter label="Search" value={search} onChange={setSearch} placeholder="Actor, action or target" className="w-full sm:w-72" />
        <SelectFilter label="Module" allLabel="All modules" value={module} onChange={setModule} options={MODULES.map((m) => ({ value: m, label: m }))} />
        <SelectFilter label="Outcome" allLabel="All outcomes" value={outcome} onChange={setOutcome} options={["Success", "Failed", "Denied"].map((o) => ({ value: o, label: o }))} />
      </FilterBar>

      <Card>
        <DataTable bare rowKey="id" caption="Audit log" columns={columns} data={rows} responsive="cards" cardTitleKey="action" emptyIcon={ScrollText} emptyTitle="No events match" emptyDescription="Try changing the filters." />
      </Card>
    </div>
  );
}
