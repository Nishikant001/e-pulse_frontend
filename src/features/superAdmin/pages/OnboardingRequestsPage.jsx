import { useState } from "react";
import { Ban, CircleCheck, ClipboardCheck, Eye } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Drawer from "../../../components/ui/Drawer";
import PageHeader from "../../../components/ui/PageHeader";
import { useConfirm, useToast } from "../../../components/feedback";
import DataTable from "../../../components/tables/DataTable";
import InfoGrid from "../../adminSales/components/InfoGrid";
import { formatDate } from "../../../utils/format";
import DemoNotice from "../components/DemoNotice";
import { ONBOARDING_REQUESTS } from "../demoData";

const TONE = { Pending: "warning", "Under review": "info", Approved: "success", Rejected: "error" };
const OPEN = ["Pending", "Under review"];

/** Super Admin → Onboarding Requests (sample data). Approve / reject only change this page's local state. */
export default function OnboardingRequestsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [requests, setRequests] = useState(ONBOARDING_REQUESTS);
  const [selected, setSelected] = useState(null);

  const decide = async (req, status) => {
    const approve = status === "Approved";
    const ok = await confirm({
      title: approve ? "Approve distributor?" : "Reject request?",
      message: approve ? `${req.business} will be created as a distributor.` : `${req.business} will be told their request was not accepted.`,
      tone: approve ? "primary" : "danger",
      confirmLabel: approve ? "Approve" : "Reject",
    });
    if (!ok) return;
    setRequests((rs) => rs.map((r) => (r.id === req.id ? { ...r, status } : r)));
    setSelected((s) => (s && s.id === req.id ? { ...s, status } : s));
    toast.success(`${req.business} ${approve ? "approved" : "rejected"} (preview only).`);
  };

  const columns = [
    {
      key: "business", header: "Business", sortable: true, accessor: (r) => r.business,
      render: (v, r) => (
        <button type="button" onClick={() => setSelected(r)} className="text-left font-medium text-brand-700 underline-offset-2 hover:underline">
          {v}
          <span className="block text-caption font-normal text-ink-subtle">{r.contact}</span>
        </button>
      ),
    },
    { key: "city", header: "City", sortable: true },
    { key: "gstin", header: "GSTIN", render: (v) => <span className="font-mono text-ink-muted">{v}</span> },
    { key: "submittedAt", header: "Submitted", sortable: true, render: (v) => formatDate(v) },
    { key: "status", header: "Status", sortable: true, render: (v) => <Badge tone={TONE[v]} dot>{v}</Badge> },
  ];
  const rowActions = (r) => {
    const items = [{ key: "view", label: "View request", icon: Eye, onClick: () => setSelected(r) }];
    if (OPEN.includes(r.status)) items.push({ key: "approve", label: "Approve", icon: CircleCheck, onClick: () => decide(r, "Approved") }, { key: "sep", divider: true }, { key: "reject", label: "Reject", icon: Ban, danger: true, onClick: () => decide(r, "Rejected") });
    return items;
  };

  return (
    <div>
      <PageHeader title="Onboarding Requests" description="Distributors that applied to join the platform, waiting for a decision." />
      <DemoNotice />
      <Card>
        <DataTable bare rowKey="id" caption="Onboarding requests" columns={columns} data={requests} searchable searchPlaceholder="Search business, contact, city" searchKeys={["business", "contact", "city", "gstin"]} rowActions={rowActions} responsive="cards" cardTitleKey="business" emptyIcon={ClipboardCheck} emptyTitle="No requests" />
      </Card>

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        size="md"
        title={selected?.business || ""}
        description={selected ? `Request #${selected.id} · submitted ${formatDate(selected.submittedAt)}` : undefined}
        footer={
          selected && OPEN.includes(selected.status) ? (
            <>
              <Button variant="secondary" leftIcon={Ban} onClick={() => decide(selected, "Rejected")}>Reject</Button>
              <Button leftIcon={CircleCheck} onClick={() => decide(selected, "Approved")}>Approve</Button>
            </>
          ) : undefined
        }
      >
        {selected ? (
          <InfoGrid
            columns="sm:grid-cols-2"
            items={[
              { label: "Status", value: <Badge tone={TONE[selected.status]} dot>{selected.status}</Badge> },
              { label: "Contact person", value: selected.contact },
              { label: "Email", value: selected.email },
              { label: "City", value: selected.city },
              { label: "GSTIN", value: selected.gstin },
              { label: "Drug licence no.", value: selected.licence },
            ]}
          />
        ) : null}
      </Drawer>
    </div>
  );
}
