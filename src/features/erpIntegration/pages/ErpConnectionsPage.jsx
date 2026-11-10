import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import FilterBar from "../../../components/ui/FilterBar";
import IconButton from "../../../components/ui/IconButton";
import LoadingState from "../../../components/ui/LoadingState";
import PageHeader from "../../../components/ui/PageHeader";
import { SearchFilter, SelectFilter } from "../../../components/forms";
import { useToast } from "../../../components/feedback";
import { useAsyncData } from "../../inventory/hooks/useAsyncData"; // reused: fetch-on-change hook
import { erpApi } from "../api/erpApi";
import { errorText } from "../erpDisplay";
import { useErpPermissions } from "../erpPermissions";
import ErpConnectionCard from "../components/ErpConnectionCard";
import ErpDetailDrawer from "../components/ErpDetailDrawer";
import ErpFormModal from "../components/ErpFormModal";
import ErpStatusDialog from "../components/ErpStatusDialog";
import ErpMappingModal from "../components/ErpMappingModal";
import ErpStartSyncModal from "../components/ErpStartSyncModal";
import ErpScheduleModal from "../components/ErpScheduleModal";
import ErpCodeMappingModal from "../components/ErpCodeMappingModal";
import { useNavigate } from "react-router-dom";

const EMPTY = { q: "", status: "", erpType: "" };

/** ERP Integration — /admin/sap/connections (Admin only; path kept from Phase 13). Lists ALL of the tenant's ERP connections. */
export default function ErpConnectionsPage() {
  const toast = useToast();
  const perm = useErpPermissions();
  const navigate = useNavigate();
  const [mapTarget, setMapTarget] = useState(null);
  const [syncTarget, setSyncTarget] = useState(null);
  const [scheduleTarget, setScheduleTarget] = useState(null);
  const [codesTarget, setCodesTarget] = useState(null);
  const [filters, setFilters] = useState(EMPTY);
  const [form, setForm] = useState({ open: false, connection: null });
  const [view, setView] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const lookups = useAsyncData((s) => erpApi.lookups(s), []);
  const list = useAsyncData((s) => erpApi.list(filters, s), [filters.q, filters.status, filters.erpType]);
  const items = list.data?.items || [];
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }));

  async function runTest(c) {
    setTestingId(c.id);
    try {
      const r = await erpApi.test(c.id);
      if (r.ok) toast.success(`${c.name}: connected${r.latencyMs != null ? ` (${r.latencyMs} ms)` : ""}`, { title: "Connection test passed" });
      else toast.error(`${r.message} (${r.code})${r.correlationId ? ` (ref ${r.correlationId})` : ""}`, { title: `${c.name}: connection failed` });
      (r.warnings || []).forEach((w) => toast.warning(w));
      list.reload();
    } catch (err) {
      toast.error(errorText(err, "The test could not be run"), { title: "Test failed" });
    } finally {
      setTestingId(null);
    }
  }
  async function makeDefault(c) {
    setBusyId(c.id);
    try { await erpApi.setDefault(c.id); toast.success(`${c.name} is now the default ERP`); list.reload(); }
    catch (err) { toast.error(errorText(err, "Unable to set default"), { title: "Update failed" }); }
    finally { setBusyId(null); }
  }

  const hasDefault = list.data?.hasDefault;
  const tenantTotal = list.data?.tenantTotal ?? 0;
  const active = Object.values(filters).filter(Boolean).length;

  return (
    <div>
      <PageHeader title="ERP Integrations"
        description="ERP connections for this tenant (SAP, Oracle, Dynamics, custom REST and others). Configure several and mark one as the default. Saving a connection does not contact the ERP; use Test."
        actions={<>
          <IconButton icon={RefreshCw} label="Refresh connections" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
          {perm.manage ? <Button leftIcon={Plus} onClick={() => setForm({ open: true, connection: null })}>Add ERP connection</Button> : null}
        </>} />

      {list.status === "ready" && tenantTotal > 0 && !hasDefault ? (
        <Alert tone="warning" title="No default ERP" className="mb-4">None of the connections is marked as default. Choose one with “Set default” — the system never picks one for you.</Alert>
      ) : null}

      <FilterBar className="mb-4" activeCount={active} onReset={() => setFilters(EMPTY)}>
        <SearchFilter value={filters.q} onChange={set("q")} placeholder="Name or code" className="w-full sm:w-72" />
        <SelectFilter label="Status" allLabel="All statuses" options={(lookups.data?.statuses || []).map((s) => ({ value: s.value, label: s.label }))} value={filters.status} onChange={set("status")} />
        <SelectFilter label="ERP type" allLabel="All types" options={(lookups.data?.erpTypes || []).map((t) => ({ value: t.value, label: t.label }))} value={filters.erpType} onChange={set("erpType")} />
      </FilterBar>

      {list.status === "loading" && !list.data ? <LoadingState label="Loading ERP connections…" /> : null}
      {list.status === "error" ? <ErrorState message={errorText(list.error, "Unable to load ERP connections.")} onRetry={list.reload} /> : null}
      {list.status !== "error" && list.data && items.length === 0 ? (
        <EmptyState title={tenantTotal === 0 ? "No ERP connections yet" : "No connections match the filters"}
          description={tenantTotal === 0 ? "Add the first ERP connection for this tenant. You can add more later." : "Try changing the filters."}
          action={tenantTotal === 0 && perm.manage ? <Button leftIcon={Plus} onClick={() => setForm({ open: true, connection: null })}>Add ERP connection</Button> : undefined} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {items.map((c) => (
          <ErpConnectionCard key={c.id} connection={c} testing={testingId === c.id} busy={busyId === c.id || testingId === c.id}
            onView={setView} onEdit={(x) => setForm({ open: true, connection: x })} onTest={runTest} onSetDefault={makeDefault} onToggleStatus={setStatusTarget}
            onMap={setMapTarget} onSync={setSyncTarget} onSchedule={setScheduleTarget} onCodes={setCodesTarget} />
        ))}
      </div>

      <ErpFormModal open={form.open} connection={form.connection} lookups={lookups.data} onClose={() => setForm({ open: false, connection: null })} onSaved={list.reload} />
      <ErpDetailDrawer open={Boolean(view)} connection={items.find((c) => c.id === view?.id) || view} onClose={() => setView(null)} />
      <ErpMappingModal open={Boolean(mapTarget)} connection={mapTarget} onClose={() => setMapTarget(null)} />
      <ErpCodeMappingModal open={Boolean(codesTarget)} readOnly={!perm.manage} connection={codesTarget} lookups={lookups.data} onClose={() => setCodesTarget(null)} />
      <ErpScheduleModal open={Boolean(scheduleTarget)} connection={scheduleTarget} onClose={() => setScheduleTarget(null)} onChanged={list.reload} />
      <ErpStartSyncModal open={Boolean(syncTarget)} connection={syncTarget} onClose={() => setSyncTarget(null)} onStarted={() => navigate("/admin/sap/sync-history")} />
      <ErpStatusDialog open={Boolean(statusTarget)} connection={statusTarget} onClose={() => setStatusTarget(null)} onChanged={list.reload} />
    </div>
  );
}
