import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import IconButton from "../../../components/ui/IconButton";
import Alert from "../../../components/ui/Alert";
import PageHeader from "../../../components/ui/PageHeader";
import LoadingState from "../../../components/ui/LoadingState";
import ErrorState from "../../../components/ui/ErrorState";
import Input, { Textarea } from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useToast, useConfirm } from "../../../components/feedback";
import { formatDate, formatINR } from "../../../utils/format";
import { CLAIM_PORTALS, claimsApi } from "../api/claimsApi";

const api = claimsApi("distributor");
const base = CLAIM_PORTALS.distributor.base;
const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * New / edit claim — /dashboard/claims/new and /dashboard/claims/:id/edit (Distributor only).
 * The distributor, retailer and amount are NOT sent: the server derives the first two from the session and the invoice, and
 * calculates the amount with the Scheme Engine. The table below is only a preview of what the server will check.
 */
export default function ClaimFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [form, setForm] = useState({ invoice_id: "", scheme_id: "", period_from: "", period_to: todayIso(), description: "" });
  const [qty, setQty] = useState({}); // invoice_line_id → quantity (string); 0/blank = not claimed
  const [lookups, setLookups] = useState({});
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [issues, setIssues] = useState([]);
  const [load, setLoad] = useState({ status: isEdit ? "loading" : "ready", error: null });

  useEffect(() => {
    const c = new AbortController();
    api.lookups(c.signal).then(setLookups).catch(() => {});
    return () => c.abort();
  }, []);

  const fetchClaim = useCallback(() => {
    if (!isEdit) return undefined;
    const c = new AbortController();
    api.detail(id, c.signal).then((d) => {
      if (!d.editable) { setLoad({ status: "error", error: { message: "This claim can no longer be edited." } }); return; }
      setForm({ invoice_id: String(d.invoiceId), scheme_id: String(d.schemeId), period_from: d.periodFrom, period_to: d.periodTo, description: d.description || "" });
      setQty(Object.fromEntries(d.items.map((i) => [i.invoiceLineId, String(i.quantity)])));
      setLoad({ status: "ready", error: null });
    }).catch((error) => { if (error?.name !== "AbortError") setLoad({ status: "error", error }); });
    return () => c.abort();
  }, [id, isEdit]);
  useEffect(() => fetchClaim(), [fetchClaim]);

  // Line preview whenever invoice / scheme change
  useEffect(() => {
    if (!form.invoice_id || !form.scheme_id) { setPreview(null); return undefined; }
    const c = new AbortController();
    api.invoiceLines(form.invoice_id, form.scheme_id, c.signal).then(setPreview).catch((e) => { if (e?.name !== "AbortError") setPreview({ error: e.message, lines: [] }); });
    return () => c.abort();
  }, [form.invoice_id, form.scheme_id]);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "invoice_id") setQty({});
    setErrors((p) => (p[key] ? { ...p, [key]: undefined } : p));
  };

  const lines = preview?.lines || [];
  const picked = lines.filter((l) => Number(qty[l.id]) > 0);
  const total = picked.reduce((s, l) => s + (l.eligible ? (l.benefitAmount || 0) : 0), 0);

  async function handleSave() {
    const e = {};
    if (!form.invoice_id) e.invoice_id = "Select an invoice";
    if (!form.scheme_id) e.scheme_id = "Select a scheme";
    if (!form.period_from) e.period_from = "Period start is required";
    if (!form.period_to) e.period_to = "Period end is required";
    if (form.period_from && form.period_to && form.period_to < form.period_from) e.period_to = "Period end cannot be before period start";
    if (picked.length === 0) e.items = "Enter a quantity for at least one invoice line";
    if (picked.some((l) => !Number.isInteger(Number(qty[l.id])) || Number(qty[l.id]) > l.quantity)) e.items = "Quantities must be whole numbers not above the invoiced quantity";
    setErrors(e);
    if (Object.keys(e).length) { toast.error("Please fix the highlighted fields", { title: "Check the form" }); return; }
    const ok = await confirm({ title: isEdit ? "Save changes?" : "Save claim?", message: "The claim is saved as a draft. You can submit it for review from the claim page. The amount is calculated by the system.", confirmLabel: "Save draft" });
    if (!ok) return;
    const payload = { invoice_id: Number(form.invoice_id), scheme_id: Number(form.scheme_id), period_from: form.period_from, period_to: form.period_to, description: form.description.trim(), items: picked.map((l) => ({ invoice_line_id: l.id, quantity: Number(qty[l.id]) })) };
    setSaving(true);
    try {
      const out = isEdit ? await api.update(id, payload) : await api.create(payload);
      toast.success(`Claim ${out.number} saved`);
      if (out.issues?.length) toast.info?.("Saved, but the claim has problems that must be fixed before it can be submitted.");
      navigate(`${base}/${out.id}`);
    } catch (err) {
      if (err?.details?.field) setErrors((p) => ({ ...p, [err.details.field]: err.message }));
      setIssues(err?.details?.issues || []);
      toast.error(err.message || "Unable to save claim", { title: "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  const back = () => navigate(isEdit ? `${base}/${id}` : base);
  const invoiceOptions = useMemo(() => (lookups.invoices || []).map((i) => ({ value: String(i.id), label: `${i.number} · ${formatDate(i.date)}${i.customer ? ` · ${i.customer}` : ""}` })), [lookups.invoices]);
  if (load.status === "loading") return <LoadingState label="Loading claim…" />;
  if (load.status === "error") return <ErrorState message={load.error?.status === 404 ? "This claim does not exist." : load.error?.message || "Unable to load this claim."} onRetry={fetchClaim} />;

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit claim" : "New claim"}
        description="Claim a scheme benefit you already gave on a posted invoice. Your account is applied automatically, and the amount is calculated from the scheme."
        actions={<IconButton icon={ArrowLeft} label="Back" variant="outline" onClick={back} />}
      />
      <div className="space-y-4">
        <Card>
          <CardHeader title="Claim details" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Invoice" required value={form.invoice_id} onChange={set("invoice_id")} error={errors.invoice_id} disabled={isEdit} placeholder="Select invoice" options={invoiceOptions} hint={isEdit ? "Cannot be changed — create a new claim instead" : "Only posted invoices can be claimed"} />
            <Select label="Scheme" required value={form.scheme_id} onChange={set("scheme_id")} error={errors.scheme_id} disabled={isEdit} placeholder="Select scheme" options={(lookups.schemes || []).map((s) => ({ value: String(s.id), label: `${s.name} (${s.code}) — ${s.ruleSummary}` }))} />
            <Input label="Period from" type="date" required value={form.period_from} onChange={set("period_from")} error={errors.period_from} />
            <Input label="Period to" type="date" required value={form.period_to} onChange={set("period_to")} error={errors.period_to} hint="The invoice date must fall inside the period" />
            <Textarea label="Description" rows={3} maxLength={2000} value={form.description} onChange={set("description")} wrapperClassName="sm:col-span-2" hint="Explain the benefit given. Required before the administrator can approve." />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Invoice lines" subtitle="Enter the purchased quantity the scheme was applied on" />
          <CardBody>
            {!preview ? <p className="text-body text-ink-muted">Select an invoice and a scheme to see its lines.</p> : preview.error ? <Alert tone="error">{preview.error}</Alert> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[40rem] text-left text-body">
                  <thead><tr className="border-b border-line text-caption text-ink-subtle">{["Product", "Invoiced", "Scheme applies", "Benefit", "Claim quantity"].map((h, i) => <th key={h} scope="col" className={`px-3 py-2 font-medium ${i > 0 && i !== 2 ? "text-right" : ""}`}>{h}</th>)}</tr></thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.id} className="border-b border-line last:border-0">
                        <td className="px-3 py-2"><span className="block">{l.productName}</span><span className="block text-caption text-ink-subtle">{l.productCode}</span></td>
                        <td className="px-3 py-2 text-right tabular-nums">{l.quantity}</td>
                        <td className="px-3 py-2">{l.alreadyClaimedIn ? `Already claimed in ${l.alreadyClaimedIn}` : l.eligible ? "Yes" : "No"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{l.eligible ? `${l.freeQuantity ? `${l.freeQuantity} free · ` : ""}${formatINR(l.benefitAmount || 0)}` : "—"}</td>
                        <td className="px-3 py-2 text-right"><input type="number" min="0" max={l.quantity} aria-label={`Claim quantity for ${l.productName}`} className="h-9 w-24 rounded-control border border-line px-2 text-right" value={qty[l.id] ?? ""} disabled={Boolean(l.alreadyClaimedIn && !isEdit)} onChange={(e) => setQty((q) => ({ ...q, [l.id]: e.target.value }))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-caption text-ink-subtle">Preview total at full quantity: {formatINR(total)}. The final amount is calculated by the system when you save.</p>
              </div>
            )}
            {errors.items ? <p role="alert" className="mt-2 text-caption text-red-600">{errors.items}</p> : null}
          </CardBody>
        </Card>

        {issues.length ? <Alert tone="error" title="Problems with this claim"><ul className="list-disc pl-5">{issues.map((i, n) => <li key={n}>{i.message}</li>)}</ul></Alert> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={back} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>{isEdit ? "Save changes" : "Save draft"}</Button>
        </div>
      </div>
    </div>
  );
}
