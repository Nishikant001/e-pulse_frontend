import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Boxes, Download, Eye, IndianRupee, Pencil, Percent, Plus, RefreshCw, ShoppingCart, Trash2 } from "lucide-react";
import {
  Alert, Avatar, Badge, Breadcrumb, Button, Card, CardBody, CardHeader, ConfirmationModal, DatePicker, DateRangePicker, Drawer, Dropdown,
  EmptyState, ErrorState, IconButton, Input, KpiCard, LoadingState, Modal, PageHeader, ProgressBar, SearchInput, SectionHeader, Select,
  Skeleton, SkeletonCard, SkeletonTable, SkeletonText, StatusBadge, Tabs, Textarea, Tooltip, STATUS_DOMAINS,
} from "../components/ui";
import { ActivityCard, AlertCard, ChartCard, ChartTooltip, DataTableCard, ProgressCard } from "../components/dashboard";
import { FilterBar, DateRangeFilter, DistributorFilter, SapStatusFilter, SearchFilter, StatusFilter } from "../components/forms";
import { useConfirm, useToast } from "../components/feedback";
import { chartAxis, chartGrid, chartPalette } from "../styles/tokens";
import { formatINRCompact } from "../utils/format";

/*
 * Design-system showcase (development builds only: /dashboard/design-system).
 * ALL figures on this page are SAMPLE DATA for illustration — nothing is read from the backend.
 */

const SAMPLE_ROWS = [
  { id: 1, batch: "B-24011", product: "Paracetamol 500 mg", expiry: "2027-03-31", qty: 1200, status: "healthy" },
  { id: 2, batch: "B-24017", product: "Amoxicillin 250 mg", expiry: "2026-11-15", qty: 340, status: "near_expiry" },
  { id: 3, batch: "B-23890", product: "Cetirizine 10 mg", expiry: "2026-08-30", qty: 60, status: "expired" },
  { id: 4, batch: "B-24102", product: "Metformin 500 mg", expiry: "2027-09-30", qty: 45, status: "low_stock" },
  { id: 5, batch: "B-24130", product: "Insulin Glargine", expiry: "2027-01-31", qty: 210, status: "quarantine" },
  { id: 6, batch: "B-24155", product: "Azithromycin 500 mg", expiry: "2027-06-30", qty: 780, status: "healthy" },
  { id: 7, batch: "B-24160", product: "Pantoprazole 40 mg", expiry: "2027-05-31", qty: 950, status: "healthy" },
  { id: 8, batch: "B-24171", product: "Atorvastatin 20 mg", expiry: "2026-12-31", qty: 130, status: "near_expiry" },
  { id: 9, batch: "B-24190", product: "Losartan 50 mg", expiry: "2027-08-31", qty: 25, status: "low_stock" },
  { id: 10, batch: "B-24201", product: "Omeprazole 20 mg", expiry: "2027-10-31", qty: 610, status: "healthy" },
  { id: 11, batch: "B-24215", product: "Ibuprofen 400 mg", expiry: "2026-10-15", qty: 90, status: "damaged" },
  { id: 12, batch: "B-24230", product: "Salbutamol Inhaler", expiry: "2027-02-28", qty: 320, status: "healthy" },
];

const SAMPLE_TREND = [
  { month: "Apr", sales: 1.6 }, { month: "May", sales: 1.9 }, { month: "Jun", sales: 1.7 }, { month: "Jul", sales: 2.1 },
  { month: "Aug", sales: 2.3 }, { month: "Sep", sales: 2.48 },
];

const SWATCHES = {
  Brand: ["bg-brand-50", "bg-brand-100", "bg-brand-200", "bg-brand-300", "bg-brand-400", "bg-brand-500", "bg-brand-600", "bg-brand-700", "bg-brand-800", "bg-brand-900"],
  Success: ["bg-success-50", "bg-success-100", "bg-success-200", "bg-success-500", "bg-success-600", "bg-success-700"],
  Warning: ["bg-warning-50", "bg-warning-100", "bg-warning-200", "bg-warning-500", "bg-warning-600", "bg-warning-700"],
  Error: ["bg-error-50", "bg-error-100", "bg-error-200", "bg-error-500", "bg-error-600", "bg-error-700"],
  Info: ["bg-info-50", "bg-info-100", "bg-info-200", "bg-info-500", "bg-info-600", "bg-info-700"],
  Neutral: ["bg-canvas", "bg-surface-muted", "bg-line", "bg-line-strong", "bg-ink-subtle", "bg-ink-muted", "bg-ink"],
};

function Section({ id, title, description, children }) {
  return (
    <section aria-labelledby={id} className="mb-10">
      <SectionHeader title={<span id={id}>{title}</span>} description={description} />
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [tableState, setTableState] = useState("data");
  const [range, setRange] = useState({ from: "", to: "" });
  const [filters, setFilters] = useState({ q: "", distributor: "", status: "", sap: "", range: { from: "", to: "" } });
  const [tab, setTab] = useState("overview");
  const [saving, setSaving] = useState(false);

  const activeFilters = useMemo(() => [filters.q, filters.distributor, filters.status, filters.sap, filters.range.from].filter(Boolean).length, [filters]);

  const columns = [
    { key: "batch", header: "Batch", sortable: true, sticky: true, cellClassName: "font-medium" },
    { key: "product", header: "Product", sortable: true },
    { key: "expiry", header: "Expiry", sortable: true },
    { key: "qty", header: "Qty", sortable: true, align: "right", render: (v) => v.toLocaleString("en-IN") },
    { key: "status", header: "Status", render: (v) => <StatusBadge status={v} domain="inventory" /> },
  ];

  const rowActions = (row) => [
    { key: "view", label: "View details", icon: Eye, onClick: () => toast.info(`Viewing ${row.batch}`) },
    { key: "edit", label: "Edit", icon: Pencil, onClick: () => toast.info(`Editing ${row.batch}`) },
    { key: "sep", divider: true },
    { key: "delete", label: "Delete", icon: Trash2, danger: true, onClick: async () => { if (await confirm({ title: `Delete ${row.batch}?`, message: "This is a demo — nothing will be deleted.", tone: "danger", confirmLabel: "Delete" })) toast.success(`${row.batch} deleted (demo)`); } },
  ];

  const tableData = tableState === "empty" ? [] : SAMPLE_ROWS;

  return (
    <div>
      <PageHeader
        title="Design System"
        description="Reusable components, tokens and states for the e-Pulse. Sample data only — visible in development builds."
        breadcrumbs={[{ label: "Developer", to: "/dashboard" }, { label: "Design System" }]}
        actions={<Button variant="secondary" leftIcon={Download}>Export tokens</Button>}
      />

      <Section id="ds-colors" title="Colour tokens" description="Blue is the brand colour. Status colours are used only for status — never decoratively.">
        <Card padding="md" className="space-y-4">
          {Object.entries(SWATCHES).map(([name, list]) => (
            <div key={name}>
              <p className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-subtle">{name}</p>
              <div className="flex flex-wrap gap-2">
                {list.map((cls) => (
                  <div key={cls} className="text-center">
                    <div className={`size-12 rounded-control border border-line ${cls}`} />
                    <p className="mt-1 max-w-12 truncate text-[10px] text-ink-subtle">{cls.replace("bg-", "")}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Card>
      </Section>

      <Section id="ds-type" title="Typography" description="Six steps plus KPI; Inter → Segoe UI → system fallback.">
        <Card padding="md" className="space-y-3">
          <p className="text-page font-semibold tracking-tight text-ink">Page title — text-page (24/32)</p>
          <p className="text-section font-semibold text-ink">Section title — text-section (18/28)</p>
          <p className="text-card-title font-semibold text-ink">Card title — text-card-title (16/24)</p>
          <p className="text-body text-ink">Body — text-body (14/22). Used for controls and paragraphs.</p>
          <p className="text-body text-ink-muted">Secondary text — text-ink-muted</p>
          <p className="text-table text-ink">Table text — text-table (13/20)</p>
          <p className="text-caption text-ink-subtle">Caption — text-caption (12/16)</p>
          <p className="text-kpi font-semibold tabular-nums text-ink">{formatINRCompact(24800000)} — text-kpi</p>
        </Card>
      </Section>

      <Section id="ds-buttons" title="Buttons">
        <Card padding="md" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button leftIcon={Plus}>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="danger-outline">Danger outline</Button>
            <Button disabled>Disabled</Button>
            <Button loading={saving} onClick={() => { setSaving(true); setTimeout(() => { setSaving(false); toast.success("Saved (demo)"); }, 1200); }}>Save changes</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <IconButton icon={RefreshCw} label="Refresh" />
            <IconButton icon={Pencil} label="Edit" variant="outline" />
            <IconButton icon={Trash2} label="Delete" variant="danger" />
          </div>
        </Card>
      </Section>

      <Section id="ds-forms" title="Form controls" description="Every control has a label; errors are linked with aria-describedby.">
        <Card padding="md">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Input label="Retailer name" placeholder="e.g. City Pharmacy" required hint="As printed on the drug licence." />
            <Input label="GSTIN" defaultValue="27ABCDE1234F1Z" error="GSTIN must be 15 characters." />
            <Select label="Territory" placeholder="Select territory" options={[{ value: "n", label: "North" }, { value: "s", label: "South" }, { value: "w", label: "West" }]} />
            <DatePicker label="Invoice date" />
            <div>
              <span className="mb-1.5 block text-body font-medium text-ink">Date range</span>
              <DateRangePicker value={range} onChange={setRange} align="start" />
            </div>
            <div>
              <span className="mb-1.5 block text-body font-medium text-ink">Search</span>
              <SearchInput placeholder="Search products…" />
            </div>
            <Textarea label="Remarks" wrapperClassName="md:col-span-2 xl:col-span-3" placeholder="Optional notes" />
          </div>
        </Card>
      </Section>

      <Section id="ds-status" title="Status system" description="Icon + label + colour, defined once in components/ui/statusConfig.js.">
        <Card padding="md" className="space-y-4">
          {["salesOrder", "inventory", "sap", "claim", "delivery", "invoice"].map((domain) => (
            <div key={domain}>
              <p className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-subtle">{domain}</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(STATUS_DOMAINS[domain]).map((key) => (
                  <StatusBadge key={key} status={key} domain={domain} />
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-subtle">Badge (generic)</p>
            <div className="flex flex-wrap gap-2">
              <Badge tone="brand">Brand</Badge>
              <Badge tone="success" dot>Active</Badge>
              <Badge tone="warning" dot>Attention</Badge>
              <Badge tone="error" dot>Blocked</Badge>
              <Badge tone="info">Info</Badge>
              <Badge tone="neutral" variant="outline">Outline</Badge>
            </div>
          </div>
        </Card>
      </Section>

      <Section id="ds-kpi" title="KPI cards" description="Presentational only — values, trend and comparison are props. Sample values below.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard title="Total Secondary Sales" value={formatINRCompact(24800000)} icon={IndianRupee} trend={{ direction: "up", value: "+12.6%" }} comparison="vs last month" />
          <KpiCard title="Open Orders" value="128" icon={ShoppingCart} status="info" trend={{ direction: "down", value: "-3.2%" }} comparison="vs last week" />
          <KpiCard title="Returns" value="42" icon={Boxes} status="warning" trend={{ direction: "up", value: "+8.0%", sentiment: "negative" }} comparison="rising is bad" />
          <KpiCard title="Scheme Utilisation" value="72%" icon={Percent} status="success" trend={{ direction: "flat", value: "0.0%" }} />
          <KpiCard title="Loading state" loading icon={Boxes} />
          <KpiCard title="Error state" error onRetry={() => toast.info("Retry clicked")} icon={Boxes} />
          <SkeletonCard />
        </div>
      </Section>

      <Section id="ds-tabs" title="Tabs">
        <Card padding="md">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "overview", label: "Overview", content: <p className="text-body text-ink-muted">Overview content. Use arrow keys to move between tabs.</p> },
              { id: "batches", label: "Batches", count: 12, content: <p className="text-body text-ink-muted">Batch list goes here.</p> },
              { id: "history", label: "History", content: <p className="text-body text-ink-muted">Audit history goes here.</p> },
              { id: "locked", label: "Locked", disabled: true },
            ]}
          />
        </Card>
      </Section>

      <Section id="ds-table" title="Data table" description="Sorting, search, pagination, sticky first column, row actions, and loading / error / empty states.">
        <div className="mb-3 flex flex-wrap gap-2">
          {["data", "loading", "error", "empty"].map((s) => (
            <Button key={s} size="sm" variant={tableState === s ? "primary" : "secondary"} onClick={() => setTableState(s)}>
              {s}
            </Button>
          ))}
        </div>
        <DataTableCard
          title="Batch stock (sample)"
          subtitle="12 sample batches"
          actions={<Button size="sm" leftIcon={Download} variant="secondary">Export</Button>}
          columns={columns}
          data={tableData}
          searchable
          searchPlaceholder="Search batch or product…"
          loading={tableState === "loading"}
          error={tableState === "error" ? "Unable to load batch data." : null}
          onRetry={() => setTableState("data")}
          rowActions={rowActions}
          emptyTitle="No batches found"
          emptyDescription="Batches appear here once stock is received."
          emptyAction={<Button leftIcon={Plus}>Receive stock</Button>}
          responsive="cards"
          initialPageSize={5}
          pageSizeOptions={[5, 10, 25]}
          caption="Sample batch stock"
        />
      </Section>

      <Section id="ds-filters" title="Filters" description="Reusable filter controls; the caller owns state and options.">
        <FilterBar
          activeCount={activeFilters}
          onReset={() => setFilters({ q: "", distributor: "", status: "", sap: "", range: { from: "", to: "" } })}
        >
          <SearchFilter value={filters.q} onChange={(q) => setFilters((f) => ({ ...f, q }))} />
          <DateRangeFilter value={filters.range} onChange={(range) => setFilters((f) => ({ ...f, range }))} />
          <DistributorFilter value={filters.distributor} onChange={(distributor) => setFilters((f) => ({ ...f, distributor }))} options={[{ value: "1", label: "Sample Distributor A" }, { value: "2", label: "Sample Distributor B" }]} />
          <StatusFilter domain="inventory" value={filters.status} onChange={(status) => setFilters((f) => ({ ...f, status }))} />
          <SapStatusFilter value={filters.sap} onChange={(sap) => setFilters((f) => ({ ...f, sap }))} />
        </FilterBar>
      </Section>

      <Section id="ds-dashboard" title="Dashboard building blocks">
        <div className="grid gap-4 xl:grid-cols-3">
          <ChartCard className="xl:col-span-2" title="Secondary sales trend" subtitle="Sample data · ₹ Cr" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SAMPLE_TREND} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="dsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartPalette[0]} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={chartPalette[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartGrid} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chartAxis, fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip content={<ChartTooltip valueFormatter={(v) => `₹${v} Cr`} />} />
                <Area type="monotone" dataKey="sales" name="Sales" stroke={chartPalette[0]} strokeWidth={2} fill="url(#dsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ProgressCard
            title="Credit utilisation"
            subtitle="Sample data"
            items={[
              { id: 1, label: "Sample Distributor A", value: 72, max: 100, tone: "brand", hint: "₹36 L of ₹50 L" },
              { id: 2, label: "Sample Distributor B", value: 91, max: 100, tone: "warning", hint: "Approaching limit" },
              { id: 3, label: "Sample Distributor C", value: 104, max: 100, tone: "error", hint: "Over limit" },
            ]}
          />
          <AlertCard
            title="Needs attention"
            subtitle="Sample data"
            items={[
              { id: 1, tone: "error", title: "3 batches expired", description: "Stock blocked from sale", time: "Today" },
              { id: 2, tone: "warning", title: "12 batches near expiry", description: "Within 90 days", time: "Today" },
              { id: 3, tone: "info", title: "Scheme ends in 5 days", description: "Monsoon Offer", time: "Yesterday" },
            ]}
          />
          <ActivityCard
            title="Recent activity"
            subtitle="Sample data"
            items={[
              { id: 1, title: "Invoice INV-1042 posted", description: "City Pharmacy · ₹48,200", time: "10 min ago", tone: "success" },
              { id: 2, title: "Delivery DL-0871 dispatched", description: "Route 4", time: "1 hr ago", tone: "info" },
              { id: 3, title: "Return RT-0113 created", description: "Damaged in transit", time: "3 hrs ago", tone: "warning" },
            ]}
          />
          <AlertCard title="Empty alerts" items={[]} />
        </div>
      </Section>

      <Section id="ds-overlays" title="Overlays and feedback" description="Modal, drawer, confirmation, toasts, dropdown and tooltip.">
        <Card padding="md" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setModal(true)}>Open modal</Button>
            <Button variant="secondary" onClick={() => setDrawer(true)}>Open drawer</Button>
            <Button variant="danger-outline" onClick={() => setConfirming(true)}>Confirmation modal</Button>
            <Button variant="secondary" onClick={async () => { const ok = await confirm({ title: "Discard changes?", message: "useConfirm() replaces window.confirm().", confirmLabel: "Discard", tone: "warning" }); toast[ok ? "success" : "info"](ok ? "Discarded" : "Kept editing"); }}>useConfirm()</Button>
            <Dropdown items={[{ key: "a", label: "Duplicate", icon: Plus, onClick: () => toast.info("Duplicate") }, { key: "b", label: "Archive", disabled: true }, { key: "c", divider: true }, { key: "d", label: "Delete", icon: Trash2, danger: true }]} label="Example menu">
              <Button variant="secondary">Dropdown ▾</Button>
            </Dropdown>
            <Tooltip content="Tooltips work on hover and keyboard focus"><Button variant="ghost">Hover / focus me</Button></Tooltip>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="subtle" onClick={() => toast.success("Customer saved")}>Success toast</Button>
            <Button size="sm" variant="subtle" onClick={() => toast.error("Unable to save customer", { title: "Save failed" })}>Error toast</Button>
            <Button size="sm" variant="subtle" onClick={() => toast.warning("Batch B-24017 expires in 30 days")}>Warning toast</Button>
            <Button size="sm" variant="subtle" onClick={() => toast.info("Sync started")}>Info toast</Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Alert tone="info" title="Information">Inline alert for neutral guidance.</Alert>
            <Alert tone="success" title="Saved">Changes were saved successfully.</Alert>
            <Alert tone="warning" title="Near expiry">12 batches expire within 90 days.</Alert>
            <Alert tone="error" title="Sync failed" action={<Button size="sm" variant="secondary">Retry</Button>}>The SAP job returned an error.</Alert>
          </div>
        </Card>
      </Section>

      <Section id="ds-states" title="Loading, empty and error states">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card><LoadingState label="Loading distributors…" compact /></Card>
          <Card><EmptyState title="No distributors found" description="Add your first distributor to get started." action={<Button leftIcon={Plus}>Add distributor</Button>} /></Card>
          <Card><ErrorState message="Unable to load distributor data." onRetry={() => toast.info("Retry clicked")} /></Card>
          <Card padding="md"><SkeletonText lines={4} /></Card>
          <Card className="lg:col-span-2"><SkeletonTable rows={4} columns={5} /></Card>
        </div>
      </Section>

      <Section id="ds-misc" title="Avatar, progress, breadcrumb">
        <Card padding="md" className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name="Asha Verma" size="xs" /><Avatar name="Rahul Nair" size="sm" /><Avatar name="Meera Iyer" size="md" /><Avatar name="Dev Patel" size="lg" />
            <Skeleton className="h-9 w-40" />
          </div>
          <ProgressBar label="Target achieved" value={68} showValue />
          <Breadcrumb items={[{ label: "Distributor Portal", to: "/dashboard" }, { label: "Inventory" }, { label: "Batch Stock" }]} />
        </Card>
      </Section>

      <Modal open={modal} onClose={() => setModal(false)} title="Batch details" description="Sample modal content" footer={<><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={() => { setModal(false); toast.success("Saved (demo)"); }}>Save</Button></>}>
        <div className="space-y-4">
          <Input label="Batch number" defaultValue="B-24017" />
          <DatePicker label="Expiry date" defaultValue="2026-11-15" />
          <Textarea label="Remarks" />
        </div>
      </Modal>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Claim details" description="Sample drawer content" footer={<Button onClick={() => setDrawer(false)}>Close</Button>}>
        <Card padding="md" className="space-y-3">
          <CardHeader title="CLM-0042" subtitle="Scheme claim" bordered={false} className="p-0!" />
          <CardBody className="p-0!"><StatusBadge status="under_review" domain="claim" /></CardBody>
        </Card>
      </Drawer>
      <ConfirmationModal open={confirming} tone="danger" title="Delete this record?" message="This is a demo. Nothing will be deleted." confirmLabel="Delete" onCancel={() => setConfirming(false)} onConfirm={() => { setConfirming(false); toast.success("Deleted (demo)"); }} />
    </div>
  );
}
