import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { authFetch } from "../../../../utils/authFetch";
import { Button, Modal, PageHeader, StatusBadge, EmptyState, ErrorState, LoadingState, Alert } from "../../../ui";
import { useConfirm, useToast } from "../../../feedback";
import { ENDPOINTS, STATUS_OPTIONS, EMPTY_FORM, formFromBatch, mergeBalances, validateForm, buildPayload } from "./batchMaster";

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString("en-GB") : "—");
const fmtMoney = (v) => (v === null || v === undefined || v === "" ? "—" : Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const inputCls = (bad) => `h-9 w-full rounded-control border bg-surface px-3 text-body text-ink disabled:bg-neutral-100 disabled:text-ink-subtle ${bad ? "border-error-600" : "border-line-strong"}`;

function FormField({ id, label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body font-medium text-ink">{label}</label>
      {children}
      {hint ? <p className="text-caption text-ink-subtle">{hint}</p> : null}
      {error ? <p id={`${id}-err`} role="alert" className="text-caption text-error-700">{error}</p> : null}
    </div>
  );
}

/**
 * Batch Master — batch IDENTITY management on the existing /stock API (Phase 24).
 * Stock on hand is shown read-only from the stock ledger and is never edited here; adding stock happens through Purchase delivery or a stock adjustment.
 */
export default function BatchMaster() {
  const confirm = useConfirm();
  const toast = useToast();
  const [state, setState] = useState({ status: "loading", batches: [], products: [], error: "", balanceError: false });
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | { batch?: row }
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: "" }));
    try {
      const [batches, products] = await Promise.all([authFetch(ENDPOINTS.list), authFetch(ENDPOINTS.products)]);
      let ledger = []; let balanceError = false;
      try { ledger = await authFetch(ENDPOINTS.balances); } catch { balanceError = true; } // identity still usable; balances flagged as unavailable
      setState({ status: "ready", batches: mergeBalances(batches, ledger), products: Array.isArray(products) ? products : [], error: "", balanceError });
    } catch (err) { setState((s) => ({ ...s, status: "error", error: err.message || "Unable to load batches" })); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.batches;
    return state.batches.filter((b) => [b.batch_no, b.product?.name, b.product?.material_code, b.status].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [state.batches, search]);

  const editing = Boolean(modal?.batch);
  const locked = Boolean(modal?.batch?.hasMovements); // product & batch number are frozen once stock movements exist
  const openCreate = () => { setForm(EMPTY_FORM); setErrors({}); setFormError(""); setModal({}); };
  const openEdit = (b) => { setForm(formFromBatch(b)); setErrors({}); setFormError(""); setModal({ batch: b }); };
  const setField = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); if (errors[k]) setErrors((x) => ({ ...x, [k]: "" })); };

  async function save() {
    const e = validateForm(form, { editing });
    setErrors(e); if (Object.keys(e).length) return;
    setSaving(true); setFormError("");
    try {
      const body = buildPayload(form, { editing, lockIdentity: locked });
      if (editing) await authFetch(ENDPOINTS.update(modal.batch.id), { method: "PUT", body: JSON.stringify(body) });
      else await authFetch(ENDPOINTS.create, { method: "POST", body: JSON.stringify(body) });
      toast.success(editing ? "Batch updated" : "Batch created");
      setModal(null); await load();
    } catch (err) { setFormError(err.message || "Unable to save the batch"); } // the server's validation message (duplicate batch, dates, …) is shown as is
    finally { setSaving(false); }
  }

  async function remove(b) {
    const ok = await confirm({ title: `Delete batch ${b.batch_no}?`, message: "This removes the batch record. It is refused by the server if the batch has any stock movement.", tone: "danger", confirmLabel: "Delete" });
    if (!ok) return;
    try { await authFetch(ENDPOINTS.remove(b.id), { method: "DELETE" }); toast.success("Batch deleted"); await load(); }
    catch (err) { toast.error(err.message || "Unable to delete the batch", { title: "Delete failed" }); }
  }

  if (state.status === "loading") return <LoadingState label="Loading batches…" />;
  if (state.status === "error") return <ErrorState title="Unable to load batches" message={state.error} onRetry={load} />;

  return (
    <div className="dms-page-enter">
      <PageHeader
        title="Batch Master"
        description="Create and maintain batch records: batch number, product, manufacturing and expiry dates, purchase price, MRP and status. Stock on hand is calculated from the stock ledger and cannot be edited here."
        actions={<><Button variant="secondary" leftIcon={RefreshCw} onClick={load}>Refresh</Button><Button leftIcon={Plus} onClick={openCreate}>New batch</Button></>}
      />
      {state.balanceError ? <Alert tone="warning" title="Stock balances unavailable" className="mb-4">Batch records are shown, but the ledger balances could not be loaded. Use Refresh to retry.</Alert> : null}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="bm-search">Search batches</label>
        <input id="bm-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search batch, product, code or status" className={`${inputCls(false)} max-w-sm`} />
        <p className="text-caption text-ink-subtle">To add stock, receive goods via <Link className="text-brand-700 underline" to="/dashboard/purchase/delivery">Purchase delivery</Link> or post a stock adjustment; view balances in <Link className="text-brand-700 underline" to="/dashboard/inventory/batch">Batch Stock</Link>.</p>
      </div>
      {rows.length === 0 ? (
        <EmptyState title={state.batches.length ? "No batches match your search" : "No batches yet"} description={state.batches.length ? "Try a different search term." : "Create a batch for a product, or receive goods through a purchase delivery."} />
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
          <table className="w-full min-w-[56rem] text-left text-table">
            <caption className="sr-only">Batches</caption>
            <thead className="bg-surface-muted text-caption uppercase text-ink-subtle">
              <tr>{["Batch no.", "Product", "MFG", "EXP", "Purchase price", "MRP", "Stock on hand (ledger)", "Status", "Actions"].map((h) => <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((b) => (
                <tr key={b.id}>
                  <th scope="row" className="px-4 py-3 font-medium text-ink">{b.batch_no}</th>
                  <td className="px-4 py-3">{b.product?.name || "—"}<span className="block text-caption text-ink-subtle">{b.product?.material_code}</span></td>
                  <td className="px-4 py-3">{fmtDate(b.mfg_date)}</td><td className="px-4 py-3">{fmtDate(b.exp_date)}</td>
                  <td className="px-4 py-3">{fmtMoney(b.purchase_price)}</td><td className="px-4 py-3">{fmtMoney(b.mrp)}</td>
                  <td className="px-4 py-3">{state.balanceError ? "—" : <>{b.stockOnHand}{b.hasMovements ? null : <span className="block text-caption text-ink-subtle">No movements</span>}</>}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status === "inactive" ? "inactive" : "active"} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" leftIcon={Pencil} onClick={() => openEdit(b)} aria-label={`Edit batch ${b.batch_no}`}>Edit</Button>
                      <Button size="sm" variant="danger-outline" leftIcon={Trash2} onClick={() => remove(b)} disabled={b.hasMovements} title={b.hasMovements ? "Has stock movements — cannot be deleted" : undefined} aria-label={`Delete batch ${b.batch_no}`}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(modal)} onClose={() => !saving && setModal(null)} title={editing ? `Edit batch ${modal?.batch?.batch_no}` : "New batch"} size="md"
        footer={<><Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>Cancel</Button><Button onClick={save} loading={saving}>{editing ? "Save changes" : "Create batch"}</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          {formError ? <div className="sm:col-span-2"><Alert tone="error" title="Could not save">{formError}</Alert></div> : null}
          <FormField id="bm-product" label="Product *" error={errors.productId} hint={editing ? "A batch cannot be moved to another product." : undefined}>
            <select id="bm-product" className={inputCls(errors.productId)} value={form.productId} onChange={setField("productId")} disabled={editing} aria-invalid={Boolean(errors.productId)} aria-describedby={errors.productId ? "bm-product-err" : undefined}>
              <option value="">Select a product</option>
              {state.products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.material_code ? ` (${p.material_code})` : ""}</option>)}
            </select>
          </FormField>
          <FormField id="bm-batch" label="Batch number *" error={errors.batch_no} hint={locked ? "Locked: this batch already has stock movements." : undefined}>
            <input id="bm-batch" className={inputCls(errors.batch_no)} value={form.batch_no} onChange={setField("batch_no")} disabled={locked} maxLength={50} aria-invalid={Boolean(errors.batch_no)} aria-describedby={errors.batch_no ? "bm-batch-err" : undefined} />
          </FormField>
          <FormField id="bm-mfg" label="Manufacturing date" error={errors.mfg_date}><input id="bm-mfg" type="date" className={inputCls(errors.mfg_date)} value={form.mfg_date} onChange={setField("mfg_date")} aria-invalid={Boolean(errors.mfg_date)} aria-describedby={errors.mfg_date ? "bm-mfg-err" : undefined} /></FormField>
          <FormField id="bm-exp" label="Expiry date" error={errors.exp_date}><input id="bm-exp" type="date" className={inputCls(errors.exp_date)} value={form.exp_date} onChange={setField("exp_date")} aria-invalid={Boolean(errors.exp_date)} aria-describedby={errors.exp_date ? "bm-exp-err" : undefined} /></FormField>
          <FormField id="bm-pp" label="Purchase price" error={errors.purchase_price}><input id="bm-pp" type="number" min="0" step="0.01" inputMode="decimal" className={inputCls(errors.purchase_price)} value={form.purchase_price} onChange={setField("purchase_price")} aria-invalid={Boolean(errors.purchase_price)} aria-describedby={errors.purchase_price ? "bm-pp-err" : undefined} /></FormField>
          <FormField id="bm-mrp" label="MRP" error={errors.mrp}><input id="bm-mrp" type="number" min="0" step="0.01" inputMode="decimal" className={inputCls(errors.mrp)} value={form.mrp} onChange={setField("mrp")} aria-invalid={Boolean(errors.mrp)} aria-describedby={errors.mrp ? "bm-mrp-err" : undefined} /></FormField>
          <FormField id="bm-status" label="Status"><select id="bm-status" className={inputCls(false)} value={form.status} onChange={setField("status")}>{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></FormField>
          <p className="text-caption text-ink-subtle sm:col-span-2">Quantity is not a batch field. Stock on hand comes from the stock ledger (purchase deliveries, sales deliveries, returns and adjustments).</p>
        </div>
      </Modal>
    </div>
  );
}
