import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Power, PowerOff } from "lucide-react";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import LoadingState from "../../../components/ui/LoadingState";
import ErrorState from "../../../components/ui/ErrorState";
import { useToast, useConfirm } from "../../../components/feedback";
import { formatDate, formatINR, formatNumber } from "../../../utils/format";
import { mastersApi } from "../api/mastersApi";
import { useMastersLookups } from "../hooks/useMastersLookups";
import BatchFormModal from "../components/BatchFormModal";

function Field({ label, children }) {
  return (
    <div>
      <div className="text-caption text-ink-subtle">{label}</div>
      <div className="text-body text-ink">{children ?? "—"}</div>
    </div>
  );
}

/** Batch Master detail — /admin/masters/batches/:id. Stock, expiry bucket and FEFO priority are the SAME read the
 * Inventory ▸ Batch Stock screen already uses (Phase 5/6); this page adds only the identity edit/deactivate actions. */
export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const lookups = useMastersLookups();
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(() => {
    const controller = new AbortController();
    setState((s) => ({ status: "loading", data: s.data, error: null }));
    mastersApi.batches
      .detail(id, controller.signal)
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => {
        if (error?.name !== "AbortError") setState({ status: "error", data: null, error });
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => load(), [load]);

  async function toggleStatus() {
    const b = state.data;
    const activating = !b.batchActive;
    const ok = await confirm({
      title: activating ? "Reactivate batch?" : "Deactivate batch?",
      message: activating ? `${b.batchNo} will be treated as saleable stock again (subject to expiry).` : `${b.batchNo} will be excluded from saleable stock and FEFO allocation immediately.`,
      tone: activating ? "primary" : "warning",
      confirmLabel: activating ? "Reactivate" : "Deactivate",
    });
    if (!ok) return;
    try {
      await (activating ? mastersApi.batches.reactivate(b.batchId) : mastersApi.batches.deactivate(b.batchId));
      toast.success(activating ? "Batch reactivated" : "Batch deactivated");
      load();
    } catch (err) {
      toast.error(err.message || "Unable to update batch status", { title: "Update failed" });
    }
  }

  if (state.status === "loading" && !state.data) return <LoadingState label="Loading batch…" />;
  if (state.status === "error") return <ErrorState message={state.error?.message || "Unable to load this batch."} onRetry={load} />;
  const b = state.data;
  if (!b) return null;

  const editable = {
    id: b.batchId, batchNo: b.batchNo, mfgDate: b.mfgDate, expDate: b.expDate, mrp: b.mrp, purchasePrice: b.unitCost,
    productId: b.product.id, productName: b.product.name, distributorId: b.distributor.id, product: { distributorName: b.distributor.name },
  };

  return (
    <div>
      <PageHeader
        title={b.batchNo}
        description={`${b.product.name} (${b.product.sku}) · ${b.distributor.name} (${b.distributor.code})`}
        meta={
          <>
            <StatusBadge status={b.status} domain="inventory" />
            <StatusBadge status={b.batchActive ? "active" : "inactive"} domain="inventory" />
          </>
        }
        actions={
          <>
            <IconButton icon={ArrowLeft} label="Back to Batch Master" variant="outline" onClick={() => navigate("/admin/masters/batches")} />
            <Button variant="secondary" leftIcon={Pencil} onClick={() => setFormOpen(true)}>Edit</Button>
            <Button variant={b.batchActive ? "danger-outline" : "primary"} leftIcon={b.batchActive ? PowerOff : Power} onClick={toggleStatus}>
              {b.batchActive ? "Deactivate" : "Reactivate"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Identity & expiry" />
          <CardBody className="space-y-3">
            <Field label="Manufacturing date">{formatDate(b.mfgDate)}</Field>
            <Field label="Expiry date">{formatDate(b.expDate)}</Field>
            <Field label="Days to expiry">{b.daysToExpiry != null ? formatNumber(b.daysToExpiry) : "—"}</Field>
            <Field label="Expiry bucket"><StatusBadge status={b.expiryBucket} domain="inventory" /></Field>
            <Field label="MRP">{b.mrp != null ? formatINR(b.mrp) : "—"}</Field>
            <Field label="Purchase price">{b.unitCost != null ? formatINR(b.unitCost) : "—"}</Field>
            <Field label="HSN / GST">{b.hsn ? `${b.hsn}${b.gstRate != null ? ` · ${b.gstRate}%` : ""}` : "—"}</Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Stock" subtitle="Live, from Inventory" />
          <CardBody className="space-y-3">
            <Field label="On hand">{formatNumber(b.stock.totalQty)}</Field>
            <Field label="Saleable">{formatNumber(b.stock.saleableQty)}</Field>
            <Field label="Non-saleable">{formatNumber(b.stock.nonSaleableQty)}</Field>
            <Field label="Reserved (open orders)">{formatNumber(b.stock.reservedQty)}</Field>
            <Field label="Stock value">{formatINR(b.stock.stockValue)}</Field>
            {b.stock.nonSaleableBreakdown.length > 0 ? (
              <div>
                <div className="text-caption text-ink-subtle">Non-saleable breakdown</div>
                <ul className="mt-1 space-y-0.5 text-body text-ink">
                  {b.stock.nonSaleableBreakdown.map((r) => (
                    <li key={r.reason}>{r.label}: <span className="tabular-nums">{formatNumber(r.qty)}</span></li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="FEFO" subtitle="Dispatch warehouse" />
          <CardBody className="space-y-3">
            <Field label="Priority">{b.fefo.priority != null ? `#${b.fefo.priority}` : "Not eligible"}</Field>
            <Field label="Warehouse">{b.fefo.warehouse?.name}</Field>
            {b.fefo.note ? <p className="text-caption text-ink-subtle">{b.fefo.note}</p> : null}
          </CardBody>
        </Card>

        {b.locations.length > 0 ? (
          <Card className="lg:col-span-3">
            <CardHeader title="Stock by warehouse" />
            <CardBody className="overflow-x-auto">
              <table className="w-full text-body">
                <thead>
                  <tr className="text-left text-caption text-ink-subtle">
                    <th className="pb-2 pr-4">Warehouse</th><th className="pb-2 pr-4 text-right">On hand</th>
                    <th className="pb-2 pr-4 text-right">Saleable</th><th className="pb-2 text-right">Non-saleable</th>
                  </tr>
                </thead>
                <tbody>
                  {b.locations.map((loc) => (
                    <tr key={loc.warehouse?.id} className="border-t border-line">
                      <td className="py-2 pr-4">{loc.warehouse?.name}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{formatNumber(loc.totalQty)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{formatNumber(loc.saleableQty)}</td>
                      <td className="py-2 text-right tabular-nums">{formatNumber(loc.nonSaleableQty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        ) : null}
      </div>

      <BatchFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} batch={editable} distributorOptions={lookups.distributors} />
    </div>
  );
}
