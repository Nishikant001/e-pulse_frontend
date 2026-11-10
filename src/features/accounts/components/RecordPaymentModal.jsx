import { useEffect, useMemo, useState } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import Alert from "../../../components/ui/Alert";
import Input, { Textarea } from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useToast } from "../../../components/feedback";
import { formatDate, formatINR } from "../../../utils/format";
import { MODE_LABEL } from "../api/accountsApi";
import { distributorOptions, retailerOptions } from "./accountsHooks";

const today = () => new Date().toISOString().slice(0, 10);
const BLANK = { distributorId: "", customerId: "", amount: "", paymentDate: today(), mode: "BANK_TRANSFER", referenceNo: "", remarks: "" };
const NEEDS_REF = ["BANK_TRANSFER", "UPI", "CHEQUE"];

/** Admin-only: record a payment, optionally allocated to invoices. The server re-validates everything (amount, tenant, allocations). */
export default function RecordPaymentModal({ open, onClose, api, lookups, onDone }) {
  const toast = useToast();
  const [f, setF] = useState(BLANK);
  const [mode, setMode] = useState("auto"); // auto | manual | none
  const [invoices, setInvoices] = useState([]);
  const [alloc, setAlloc] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (open) { setF({ ...BLANK, paymentDate: today() }); setMode("auto"); setInvoices([]); setAlloc({}); setError(null); } }, [open]);
  useEffect(() => {
    if (!f.customerId) { setInvoices([]); return undefined; }
    const c = new AbortController();
    api.openInvoices(f.customerId, c.signal).then(setInvoices).catch(() => setInvoices([]));
    return () => c.abort();
  }, [api, f.customerId]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value, ...(k === "distributorId" ? { customerId: "" } : {}) }));
  const amount = Number(f.amount) || 0;
  const allocated = useMemo(() => Object.values(alloc).reduce((t, v) => t + (Number(v) || 0), 0), [alloc]);
  const totalOpen = invoices.reduce((t, i) => t + i.open, 0);

  async function submit() {
    setBusy(true); setError(null);
    const body = { customerId: Number(f.customerId), distributorId: f.distributorId ? Number(f.distributorId) : undefined, amount: f.amount === "" ? undefined : Number(f.amount), paymentDate: f.paymentDate, mode: f.mode, referenceNo: f.referenceNo, remarks: f.remarks };
    if (mode === "auto") body.autoAllocate = true;
    if (mode === "manual") body.allocations = Object.entries(alloc).filter(([, v]) => Number(v) > 0).map(([invoiceId, v]) => ({ invoiceId: Number(invoiceId), amount: Number(v) }));
    try {
      const p = await api.createPayment(body);
      toast.success(`Payment ${p.number} recorded`);
      onDone?.(p); onClose();
    } catch (err) { setError(err.message || "Unable to record the payment"); } finally { setBusy(false); }
  }

  const canSubmit = f.customerId && amount > 0 && f.paymentDate && !busy && (mode !== "manual" || allocated <= amount + 0.005);
  return (
    <Modal open={open} onClose={busy ? undefined : onClose} size="lg" title="Record payment" description="Money received from a retailer. It reduces the retailer's receivable and is posted to the ledger."
      footer={<><Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} loading={busy} disabled={!canSubmit}>Record payment</Button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select label="Distributor" required placeholder="Select…" options={distributorOptions(lookups)} value={f.distributorId} onChange={set("distributorId")} />
        <Select label="Retailer" required placeholder="Select…" options={retailerOptions(lookups, f.distributorId)} value={f.customerId} onChange={set("customerId")} disabled={!f.distributorId} />
        <Input label="Amount (₹)" required type="number" min="0.01" step="0.01" value={f.amount} onChange={set("amount")} />
        <Input label="Payment date" required type="date" max={today()} value={f.paymentDate} onChange={set("paymentDate")} />
        <Select label="Payment mode" required options={Object.entries(MODE_LABEL).map(([value, label]) => ({ value, label }))} value={f.mode} onChange={set("mode")} />
        <Input label="Bank / UPI / cheque reference" required={NEEDS_REF.includes(f.mode)} maxLength={60} value={f.referenceNo} onChange={set("referenceNo")} hint="Must be unique per distributor" />
        <Textarea label="Remarks" wrapperClassName="sm:col-span-2" maxLength={500} value={f.remarks} onChange={set("remarks")} />
      </div>
      {f.customerId ? (
        <div className="mt-5">
          <Select label="Allocation" options={[{ value: "auto", label: "Allocate automatically to the oldest due invoices" }, { value: "manual", label: "Choose invoices" }, { value: "none", label: "Do not allocate (keep as unapplied credit)" }]} value={mode} onChange={(e) => setMode(e.target.value)} />
          {mode === "manual" ? (
            invoices.length ? (
              <div className="mt-3 overflow-x-auto rounded-card border border-line">
                <table className="w-full text-body"><thead className="bg-neutral-50 text-left text-caption text-ink-muted"><tr><th className="p-2">Invoice</th><th className="p-2">Due</th><th className="p-2 text-right">Open</th><th className="p-2 text-right">Allocate (₹)</th></tr></thead>
                  <tbody>{invoices.map((i) => (
                    <tr key={i.id} className="border-t border-line"><td className="p-2">{i.number}</td><td className="p-2">{formatDate(i.dueDate)}</td><td className="p-2 text-right tabular-nums">{formatINR(i.open)}</td>
                      <td className="p-2 text-right"><input aria-label={`Allocate to ${i.number}`} type="number" min="0" max={i.open} step="0.01" value={alloc[i.id] ?? ""} onChange={(e) => setAlloc((a) => ({ ...a, [i.id]: e.target.value }))} className="h-8 w-28 rounded-control border border-line-strong px-2 text-right" /></td></tr>
                  ))}</tbody></table>
              </div>
            ) : <p className="mt-2 text-caption text-ink-subtle">This retailer has no open invoices.</p>
          ) : null}
          <p className="mt-2 text-caption text-ink-subtle">
            Open invoices: {formatINR(totalOpen)}.{" "}
            {mode === "manual" ? `Allocated ${formatINR(allocated)} of ${formatINR(amount)}${allocated > amount + 0.005 ? " — more than the payment" : ""}.` : null}
            {amount > totalOpen && mode !== "none" ? ` ${formatINR(amount - totalOpen)} exceeds what is owed and will be kept as unapplied credit.` : null}
          </p>
        </div>
      ) : null}
      {error ? <Alert tone="error" title="Payment not recorded" className="mt-4">{error}</Alert> : null}
    </Modal>
  );
}
