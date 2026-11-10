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
import { formatDate, formatINR } from "../../../utils/format";

const pct = (v) => (Number.isFinite(Number(v)) ? `${Number(v).toFixed(1)}%` : "—");
import { mastersApi } from "../api/mastersApi";
import { useMastersLookups } from "../hooks/useMastersLookups";
import ProductFormModal from "../components/ProductFormModal";

function Field({ label, children }) {
  return (
    <div>
      <div className="text-caption text-ink-subtle">{label}</div>
      <div className="text-body text-ink">{children ?? "—"}</div>
    </div>
  );
}

/** Product Master detail — /admin/masters/products/:id */
export default function ProductDetailPage() {
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
    mastersApi.products
      .detail(id, controller.signal)
      .then((data) => setState({ status: "ready", data, error: null }))
      .catch((error) => {
        if (error?.name !== "AbortError") setState({ status: "error", data: null, error });
      });
    return () => controller.abort();
  }, [id]);

  useEffect(() => load(), [load]);

  async function toggleStatus() {
    const p = state.data;
    const activating = p.status === "inactive";
    const ok = await confirm({
      title: activating ? "Reactivate product?" : "Deactivate product?",
      message: activating ? `${p.name} will become available again for orders, pricing and batches.` : `${p.name} will no longer be selectable for new orders.`,
      tone: activating ? "primary" : "warning",
      confirmLabel: activating ? "Reactivate" : "Deactivate",
    });
    if (!ok) return;
    try {
      await (activating ? mastersApi.products.reactivate(p.id) : mastersApi.products.deactivate(p.id));
      toast.success(activating ? "Product reactivated" : "Product deactivated");
      load();
    } catch (err) {
      toast.error(err.message || "Unable to update product status", { title: "Update failed" });
    }
  }

  if (state.status === "loading" && !state.data) return <LoadingState label="Loading product…" />;
  if (state.status === "error") return <ErrorState message={state.error?.message || "Unable to load this product."} onRetry={load} />;
  const p = state.data;
  if (!p) return null;

  return (
    <div>
      <PageHeader
        title={p.name}
        description={`${p.sku}${p.genericName ? ` · ${p.genericName}` : ""} · ${p.distributor.name} (${p.distributor.code})`}
        meta={<StatusBadge status={p.status} domain="inventory" />}
        actions={
          <>
            <IconButton icon={ArrowLeft} label="Back to Product Master" variant="outline" onClick={() => navigate("/admin/masters/products")} />
            <Button variant="secondary" leftIcon={Pencil} onClick={() => setFormOpen(true)}>Edit</Button>
            <Button variant={p.status === "active" ? "danger-outline" : "primary"} leftIcon={p.status === "active" ? PowerOff : Power} onClick={toggleStatus}>
              {p.status === "active" ? "Deactivate" : "Reactivate"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Product details" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Category">{p.category}</Field>
            <Field label="Brand">{p.brand}</Field>
            <Field label="Dosage form">{p.dosageForm}</Field>
            <Field label="Strength">{p.strength}</Field>
            <Field label="Pack size">{p.packSize}</Field>
            <Field label="Unit">{p.unit}</Field>
            <Field label="Manufacturer">{p.manufacturer}</Field>
            <Field label="Country of origin">{p.countryOfOrigin}</Field>
            <Field label="Drug licence no.">{p.drugLicenceNumber}</Field>
            <Field label="Reorder level">{p.reorderLevel}</Field>
            <Field label="MRP">{p.mrp != null ? formatINR(p.mrp) : "—"}</Field>
            <Field label="Sale price">{p.salePrice != null ? formatINR(p.salePrice) : "—"}</Field>
            {p.description ? (
              <div className="sm:col-span-3">
                <div className="text-caption text-ink-subtle">Description</div>
                <p className="text-body text-ink">{p.description}</p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="HSN & GST" />
          <CardBody className="space-y-3">
            <Field label="HSN code">{p.hsn?.code}</Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="CGST">{pct(p.gst.cgstRate)}</Field>
              <Field label="SGST">{pct(p.gst.sgstRate)}</Field>
              <Field label="IGST">{pct(p.gst.igstRate)}</Field>
            </div>
            <p className="text-caption text-ink-subtle">Intra-state sales split the rate into CGST + SGST; inter-state sales charge the full rate as IGST (see Tax Master).</p>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Batches" subtitle={`${p.batches.length} batch${p.batches.length === 1 ? "" : "es"}`} actions={<Button variant="secondary" size="sm" onClick={() => navigate(`/admin/masters/batches?productId=${p.id}`)}>View all in Batch Master</Button>} />
          <CardBody className="overflow-x-auto">
            {p.batches.length === 0 ? (
              <p className="text-body text-ink-subtle">No batches recorded for this product yet.</p>
            ) : (
              <table className="w-full text-body">
                <thead>
                  <tr className="text-left text-caption text-ink-subtle">
                    <th className="pb-2 pr-4">Batch no.</th><th className="pb-2 pr-4">MFG date</th><th className="pb-2 pr-4">Expiry date</th>
                    <th className="pb-2 pr-4 text-right">MRP</th><th className="pb-2 pr-4 text-right">Purchase price</th><th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {p.batches.map((b) => (
                    <tr key={b.id} className="border-t border-line">
                      <td className="py-2 pr-4">
                        <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => navigate(`/admin/masters/batches/${b.id}`)}>{b.batchNo}</button>
                      </td>
                      <td className="py-2 pr-4">{formatDate(b.mfgDate)}</td>
                      <td className="py-2 pr-4">{formatDate(b.expDate)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{b.mrp != null ? formatINR(b.mrp) : "—"}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{formatINR(b.purchasePrice)}</td>
                      <td className="py-2"><StatusBadge status={b.status} domain="inventory" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Pricing" subtitle={`${p.pricing.length} customer-group price${p.pricing.length === 1 ? "" : "s"}`} actions={<Button variant="secondary" size="sm" onClick={() => navigate(`/admin/masters/pricing?productId=${p.id}`)}>View all in Pricing Master</Button>} />
          <CardBody className="overflow-x-auto">
            {p.pricing.length === 0 ? (
              <p className="text-body text-ink-subtle">No pricing configured for this product yet.</p>
            ) : (
              <table className="w-full text-body">
                <thead>
                  <tr className="text-left text-caption text-ink-subtle">
                    <th className="pb-2 pr-4">Customer group</th><th className="pb-2 pr-4 text-right">Base price</th><th className="pb-2 pr-4 text-right">Discount</th>
                    <th className="pb-2 pr-4">Valid from</th><th className="pb-2 pr-4">Valid to</th><th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {p.pricing.map((pr) => (
                    <tr key={pr.id} className="border-t border-line">
                      <td className="py-2 pr-4">{pr.customerGroup.name}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{formatINR(pr.basePrice)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{pct(pr.discountPercent)}</td>
                      <td className="py-2 pr-4">{formatDate(pr.validFrom)}</td>
                      <td className="py-2 pr-4">{pr.validTo ? formatDate(pr.validTo) : "—"}</td>
                      <td className="py-2"><StatusBadge status={pr.active ? "active" : "inactive"} domain="inventory" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>

      <ProductFormModal open={formOpen} onClose={() => setFormOpen(false)} onSaved={load} product={p} lookups={lookups} />
    </div>
  );
}
