import { useState } from "react";
import { Check, Eye, Lock, Minus, Pencil, Plus, ShieldCheck } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Drawer from "../../../components/ui/Drawer";
import PageHeader from "../../../components/ui/PageHeader";
import { useToast } from "../../../components/feedback";
import DataTable from "../../../components/tables/DataTable";
import DetailTable from "../../adminSales/components/DetailTable";
import { formatNumber } from "../../../utils/format";
import DemoNotice from "../components/DemoNotice";
import { PERMISSION_MODULES, ROLE_ACCESS, ROLES } from "../demoData";

const ACCESS = {
  full: { label: "Full access", tone: "success", icon: Check },
  edit: { label: "View & edit", tone: "info", icon: Pencil },
  view: { label: "View only", tone: "neutral", icon: Eye },
  none: { label: "No access", tone: "neutral", icon: Minus },
};

/** Super Admin → Roles & Permissions (sample data). */
export default function RolesPermissionsPage() {
  const toast = useToast();
  const [selected, setSelected] = useState(null);

  const columns = [
    {
      key: "name", header: "Role", sortable: true, accessor: (r) => r.name,
      render: (v, r) => (
        <button type="button" onClick={() => setSelected(r)} className="flex items-center gap-2 font-medium text-brand-700 underline-offset-2 hover:underline">
          {v}
          {r.system ? <Lock className="size-3.5 text-ink-subtle" aria-label="System role" /> : null}
        </button>
      ),
    },
    { key: "description", header: "Description", accessor: (r) => r.description },
    { key: "users", header: "Users", sortable: true, align: "right", accessor: (r) => r.users, render: (v) => <span className="tabular-nums">{formatNumber(v)}</span> },
    { key: "type", header: "Type", accessor: (r) => (r.system ? "System" : "Custom"), render: (v) => <Badge tone={v === "System" ? "brand" : "neutral"}>{v}</Badge> },
  ];

  const matrixRows = selected ? PERMISSION_MODULES.map((m, i) => ({ id: m, module: m, level: ROLE_ACCESS[selected.id][i] })) : [];
  const matrixColumns = [
    { key: "module", header: "Module", render: (r) => <span className="font-medium">{r.module}</span> },
    {
      key: "level", header: "Access",
      render: (r) => {
        const a = ACCESS[r.level];
        return <Badge tone={a.tone} icon={a.icon}>{a.label}</Badge>;
      },
    },
  ];

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        description="Control what each kind of admin account can see and change."
        actions={<Button leftIcon={Plus} onClick={() => toast.info("Creating custom roles is not available in this preview.")}>New role</Button>}
      />
      <DemoNotice />
      <Card>
        <DataTable bare rowKey="id" caption="Roles" columns={columns} data={ROLES} searchable searchPlaceholder="Search roles" searchKeys={["name", "description"]} onRowClick={setSelected} responsive="cards" cardTitleKey="name" emptyIcon={ShieldCheck} emptyTitle="No roles found" />
      </Card>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        size="md"
        title={selected ? selected.name : ""}
        description={selected ? `${selected.description} ${selected.system ? "System roles cannot be edited." : ""}` : undefined}
        footer={selected ? <Button variant="secondary" disabled={selected.system} onClick={() => toast.info("Editing permissions is not available in this preview.")}>Edit permissions</Button> : undefined}
      >
        {selected ? <DetailTable caption={`${selected.name} permissions`} columns={matrixColumns} rows={matrixRows} /> : null}
      </Drawer>
    </div>
  );
}
