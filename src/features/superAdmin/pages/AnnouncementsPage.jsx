import { useState } from "react";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input, { Textarea } from "../../../components/ui/Input";
import Modal from "../../../components/ui/Modal";
import PageHeader from "../../../components/ui/PageHeader";
import Select from "../../../components/ui/Select";
import { useConfirm, useToast } from "../../../components/feedback";
import DataTable from "../../../components/tables/DataTable";
import { formatDate } from "../../../utils/format";
import DemoNotice from "../components/DemoNotice";
import { ANNOUNCEMENTS } from "../demoData";

const TONE = { Published: "success", Scheduled: "info", Draft: "neutral" };
const AUDIENCES = ["All distributors", "All admins", "Growth and Enterprise", "Enterprise only"];
const CHANNELS = ["Banner", "Email", "Banner + email"];
const EMPTY = { title: "", message: "", audience: AUDIENCES[0], channel: CHANNELS[0] };

/** Super Admin → Announcements (sample data). Publishing only changes this page's local state. */
export default function AnnouncementsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState(ANNOUNCEMENTS);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const close = () => { setOpen(false); setForm(EMPTY); setError(""); };
  const publish = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Enter a title.");
    setItems((list) => [{ id: Date.now(), title: form.title.trim(), audience: form.audience, channel: form.channel, publishedAt: new Date().toISOString(), status: "Published" }, ...list]);
    toast.success("Announcement published (preview only).");
    close();
  };
  const remove = async (a) => {
    if (!(await confirm({ title: "Delete announcement?", message: a.title, tone: "danger", confirmLabel: "Delete" }))) return;
    setItems((list) => list.filter((x) => x.id !== a.id));
  };

  const columns = [
    { key: "title", header: "Announcement", sortable: true, render: (v) => <span className="font-medium">{v}</span> },
    { key: "audience", header: "Audience", sortable: true },
    { key: "channel", header: "Channel" },
    { key: "publishedAt", header: "Published", sortable: true, render: (v) => (v ? formatDate(v) : <span className="text-ink-subtle">—</span>) },
    { key: "status", header: "Status", sortable: true, render: (v) => <Badge tone={TONE[v]} dot>{v}</Badge> },
  ];

  return (
    <div>
      <PageHeader title="Announcements" description="Broadcast maintenance windows and product news to admins and distributors." actions={<Button leftIcon={Plus} onClick={() => setOpen(true)}>New announcement</Button>} />
      <DemoNotice />
      <Card>
        <DataTable bare rowKey="id" caption="Announcements" columns={columns} data={items} searchable searchPlaceholder="Search announcements" searchKeys={["title", "audience"]} rowActions={(a) => [{ key: "delete", label: "Delete", icon: Trash2, danger: true, onClick: () => remove(a) }]} responsive="cards" cardTitleKey="title" emptyIcon={Megaphone} emptyTitle="No announcements" />
      </Card>

      <Modal
        open={open}
        onClose={close}
        title="New announcement"
        footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="announcement-form">Publish</Button></>}
      >
        <form id="announcement-form" onSubmit={publish} noValidate className="space-y-4">
          <Input label="Title" required value={form.title} onChange={set("title")} error={error} placeholder="e.g. Scheduled maintenance on 25 Oct" />
          <Textarea label="Message" rows={4} value={form.message} onChange={set("message")} placeholder="What do people need to know?" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Audience" value={form.audience} onChange={set("audience")} options={AUDIENCES.map((a) => ({ value: a, label: a }))} />
            <Select label="Channel" value={form.channel} onChange={set("channel")} options={CHANNELS.map((c) => ({ value: c, label: c }))} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
