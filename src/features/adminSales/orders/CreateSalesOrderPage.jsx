import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import DatePicker from "../../../components/ui/DatePicker";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import IconButton from "../../../components/ui/IconButton";
import Input, { Textarea } from "../../../components/ui/Input";
import LoadingState from "../../../components/ui/LoadingState";
import PageHeader from "../../../components/ui/PageHeader";
import Select from "../../../components/ui/Select";
import { useToast } from "../../../components/feedback";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { formatDate, formatINR, formatNumber } from "../../../utils/format";
import { salesErrorMessage } from "../api/salesErrors";
import TotalsPanel from "../components/TotalsPanel";
import { useSalesScreen } from "../hooks/useSalesScreen";

const PAYMENT_TERMS = ["Cash", "Advance", "Net 15", "Net 30", "Net 45", "Net 60"].map((t) => ({ value: t, label: t }));
const today = () => new Date().toISOString().slice(0, 10);
let lineCounter = 0;
const newLine = (over = {}) => ({ key: `l${(lineCounter += 1)}`, productId: "", batchId: "", quantity: "", discount: "0", ...over });

const isValidQty = (q) => /^\d+$/.test(String(q)) && Number(q) >= 1 && Number(q) <= 1000000;
const isValidDiscount = (d) => d === "" || (Number.isFinite(Number(d)) && Number(d) >= 0 && Number(d) <= 100);

/**
 * CreateSalesOrderPage — /admin/sales/orders/new and /admin/sales/orders/:id/edit (drafts only).
 *
 * The browser sends only ids, quantities and the discount %. Dealer price, GST, tax, net amounts, totals, batch availability and
 * every stock / pricing / ownership validation come from the backend (POST /sales/orders/preview, re-run authoritatively on save).
 */
export default function CreateSalesOrderPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { setSource, api, lookups, isSample } = useSalesScreen();

  const [header, setHeader] = useState({ distributorId: "", customerId: "", orderDate: today(), paymentTerms: "Net 30", remarks: "" });
  const [lines, setLines] = useState([newLine()]);
  const [orderNumber, setOrderNumber] = useState(null);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [load, setLoad] = useState({ status: editing ? "loading" : "ready", error: null });

  const [retailers, setRetailers] = useState([]);
  const [products, setProducts] = useState([]);
  const [lookupError, setLookupError] = useState(null);
  const [batches, setBatches] = useState({}); // productId → { status, items }
  const requested = useRef(new Set());

  // ─── edit mode: load the draft ───
  useEffect(() => {
    if (!editing || isSample) return undefined;
    const controller = new AbortController();
    setLoad({ status: "loading", error: null });
    api
      .getOrder(id, controller.signal)
      .then((d) => {
        if (!d) return setLoad({ status: "error", error: "Order not found." });
        if (!d.order.actions.includes("edit")) return setLoad({ status: "error", error: "This order can no longer be edited (only drafts can)." });
        setOrderNumber(d.order.orderNumber);
        setHeader({ distributorId: String(d.order.distributor.id), customerId: String(d.order.retailer.id), orderDate: d.order.orderDate, paymentTerms: d.order.paymentTerms || "Net 30", remarks: d.order.remarks || "" });
        setLines(d.lines.map((l) => newLine({ productId: String(l.productId), batchId: l.batch ? String(l.batch.id) : "", quantity: String(l.quantity), discount: String(l.discountPercent) })));
        setLoad({ status: "ready", error: null });
      })
      .catch((e) => e?.name !== "AbortError" && setLoad({ status: "error", error: salesErrorMessage(e, "Unable to load the order.") }));
    return () => controller.abort();
  }, [editing, id, api, isSample]);

  // ─── retailers + products of the selected distributor ───
  useEffect(() => {
    if (!header.distributorId || isSample) {
      setRetailers([]);
      setProducts([]);
      return undefined;
    }
    const controller = new AbortController();
    setLookupError(null);
    requested.current = new Set();
    setBatches({});
    Promise.all([api.retailers({ distributorId: header.distributorId }, controller.signal), api.products({ distributorId: header.distributorId }, controller.signal)])
      .then(([r, p]) => {
        setRetailers(r);
        setProducts(p);
      })
      .catch((e) => e?.name !== "AbortError" && setLookupError(salesErrorMessage(e, "Unable to load retailers and products.")));
    return () => controller.abort();
  }, [header.distributorId, api, isSample]);

  // ─── batches of every product used on a line (each product requested once) ───
  const loadBatches = useCallback(
    (productId) => {
      if (!productId || requested.current.has(productId)) return;
      requested.current.add(productId);
      setBatches((b) => ({ ...b, [productId]: { status: "loading", items: [] } }));
      api
        .batches({ distributorId: header.distributorId, productId })
        .then((items) => setBatches((b) => ({ ...b, [productId]: { status: "ready", items } })))
        .catch(() => setBatches((b) => ({ ...b, [productId]: { status: "error", items: [] } })));
    },
    [api, header.distributorId],
  );
  useEffect(() => {
    lines.forEach((l) => l.productId && loadBatches(l.productId));
  }, [lines, loadBatches]);

  // ─── backend preview (debounced) ───
  const usable = lines.filter((l) => l.productId && isValidQty(l.quantity) && isValidDiscount(l.discount));
  const previewBody = useMemo(
    () => (!header.distributorId || !header.customerId || !header.paymentTerms || usable.length === 0
      ? null
      : JSON.stringify({ ...header, remarks: header.remarks || undefined, lines: usable.map((l) => ({ productId: Number(l.productId), batchId: l.batchId ? Number(l.batchId) : null, quantity: Number(l.quantity), discount: l.discount === "" ? 0 : Number(l.discount) })) })),
    [header, usable],
  );
  const debounced = useDebouncedValue(previewBody, 450);
  const [preview, setPreview] = useState({ status: "idle", data: null, error: null, keys: [] });
  const usableKeys = usable.map((l) => l.key).join(",");

  useEffect(() => {
    if (!debounced || isSample) {
      setPreview({ status: "idle", data: null, error: null, keys: [] });
      return undefined;
    }
    const controller = new AbortController();
    setPreview((p) => ({ ...p, status: "loading", error: null }));
    api
      .previewOrder(JSON.parse(debounced), controller.signal)
      .then((data) => setPreview({ status: "ready", data, error: null, keys: usableKeys.split(",") }))
      .catch((e) => e?.name !== "AbortError" && setPreview({ status: "error", data: null, error: salesErrorMessage(e, "Unable to calculate pricing."), keys: [] }));
    return () => controller.abort();
    // usableKeys identifies which UI lines the result belongs to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, api, isSample]);

  const resultFor = (key) => {
    if (preview.status === "idle" || !preview.data) return null;
    const idx = preview.keys.indexOf(key);
    return idx >= 0 ? preview.data.lines[idx] : null;
  };

  // ─── inline validation (client-side only checks required input; the backend decides everything else) ───
  const errors = {
    distributor: !header.distributorId ? "Select a distributor." : "",
    retailer: !header.customerId ? "Select a retailer." : "",
    date: !header.orderDate ? "Order date is required." : "",
    terms: !header.paymentTerms ? "Select payment terms." : "",
    lines: lines.map((l) => ({
      product: !l.productId ? "Select a product." : "",
      quantity: !isValidQty(l.quantity) ? "Enter a whole quantity of 1 or more." : "",
      discount: !isValidDiscount(l.discount) ? "Discount must be 0–100." : "",
    })),
  };
  const hasClientErrors = errors.distributor || errors.retailer || errors.date || errors.terms || errors.lines.some((e) => e.product || e.quantity || e.discount);
  const show = touched;

  const setH = (k) => (v) => setHeader((h) => ({ ...h, [k]: v, ...(k === "distributorId" ? { customerId: "" } : {}) }));
  const updateLine = (key, patch) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch, ...(patch.productId !== undefined ? { batchId: "" } : {}) } : l)));

  const distributor = lookups?.distributors.find((d) => String(d.id) === header.distributorId);
  const retailer = retailers.find((r) => String(r.id) === header.customerId);
  const territory = retailer?.territory || distributor?.territory || "";

  const save = async () => {
    setTouched(true);
    if (hasClientErrors) return toast.error("Complete the highlighted fields.", { title: "Order not saved" });
    if (preview.status !== "ready" || !preview.data.valid) return toast.error("Fix the lines marked with errors before saving.", { title: "Order not saved" });
    setSaving(true);
    try {
      const body = JSON.parse(previewBody);
      const result = editing ? await api.updateOrder(id, body) : await api.createOrder(body);
      toast.success(editing ? `Order ${result.orderNumber} updated` : `Sales order ${result.orderNumber} created as a draft`);
      navigate(`/admin/sales/orders?order=${result.id}`);
    } catch (e) {
      const lineErrors = e?.details?.lines;
      toast.error(salesErrorMessage(e, editing ? "Unable to update the order." : "Unable to create the order."), { title: editing ? "Update failed" : "Order not created" });
      if (lineErrors) setPreview((p) => p); // the next preview shows the per-line messages
    } finally {
      setSaving(false);
    }
  };

  const backLink = (
    <Button as={Link} to="/admin/sales/orders" variant="secondary">
      Back to orders
    </Button>
  );

  if (isSample) {
    return (
      <div>
        <PageHeader title={editing ? "Edit sales order" : "New sales order"} actions={backLink} />
        <Card>
          <EmptyState
            title="Live data is needed to create or edit orders"
            description="Sample data is read-only and never touches the database. Pricing, tax and stock checks come from the backend."
            action={<Button onClick={() => setSource("live")}>Switch to Live data</Button>}
          />
        </Card>
      </div>
    );
  }
  if (load.status === "loading") return <LoadingState label="Loading order…" />;
  if (load.status === "error") return <Card><ErrorState title="Unable to open the order" message={load.error} action={backLink} /></Card>;

  const priced = preview.data;
  const distributorOptions = (lookups?.distributors || []).map((d) => ({ value: String(d.id), label: `${d.name} (${d.code})` }));
  const retailerOptions = retailers.map((r) => ({ value: String(r.id), label: r.name }));
  const productOptions = products.map((p) => ({ value: String(p.id), label: `${p.name} · ${p.sku}` }));

  return (
    <div>
      <PageHeader
        title={editing ? `Edit order ${orderNumber || ""}` : "New sales order"}
        description="Distributor → retailer order. Prices, GST, stock and totals are calculated by the server."
        actions={
          <>
            {backLink}
            <Button onClick={save} loading={saving} disabled={preview.status === "loading"}>
              {editing ? "Save changes" : "Save order"}
            </Button>
          </>
        }
      />

      {lookupError ? <Alert tone="error" title="Unable to load retailers and products" className="mb-4">{lookupError}</Alert> : null}

      <Card className="mb-4">
        <CardHeader title="Order details" />
        <CardBody>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Input label="Order ID" value={orderNumber || "Assigned when saved"} readOnly />
            <DatePicker label="Order date" required value={header.orderDate} onChange={setH("orderDate")} error={show ? errors.date : ""} />
            <Select label="Distributor" required value={header.distributorId} onChange={(e) => setH("distributorId")(e.target.value)} options={distributorOptions} placeholder="Select distributor" disabled={editing} error={show ? errors.distributor : ""} />
            <Select label="Retailer" required value={header.customerId} onChange={(e) => setH("customerId")(e.target.value)} options={retailerOptions} placeholder={header.distributorId ? "Select retailer" : "Select a distributor first"} disabled={!header.distributorId} error={show ? errors.retailer : ""} />
            <Input label="Territory" value={territory} readOnly placeholder="Filled from the distributor / retailer" />
            <Select label="Payment terms" required value={header.paymentTerms} onChange={(e) => setH("paymentTerms")(e.target.value)} options={PAYMENT_TERMS} placeholder="Select terms" error={show ? errors.terms : ""} />
            <Textarea label="Remarks" wrapperClassName="md:col-span-2 xl:col-span-3" value={header.remarks} onChange={(e) => setH("remarks")(e.target.value)} maxLength={500} rows={2} />
          </div>
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardHeader title="Product lines" subtitle="Choose a batch, or leave “Auto” to deliver from the earliest-expiring saleable stock." actions={<Button size="sm" variant="secondary" leftIcon={Plus} onClick={() => setLines((ls) => [...ls, newLine()])}>Add line</Button>} />
        <CardBody className="space-y-4">
          {preview.status === "error" ? <Alert tone="error" title="Unable to calculate pricing">{preview.error}</Alert> : null}
          {lines.map((line, i) => {
            const r = resultFor(line.key);
            const b = batches[line.productId];
            const batchOptions = [{ value: "", label: "Auto (earliest expiry first)" }, ...(b?.items || []).map((x) => ({ value: String(x.id), disabled: !x.saleable, label: `${x.batchNo} · exp ${formatDate(x.expDate)} · ${formatNumber(x.available)} available${x.reason === "EXPIRED" ? " · expired" : x.reason === "NOT_SALEABLE" ? " · not saleable" : ""}` }))];
            const e = errors.lines[i];
            return (
              <fieldset key={line.key} className="rounded-card border border-line p-4">
                <legend className="px-1 text-caption font-medium text-ink-subtle">Line {i + 1}</legend>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2fr_2fr_7rem_7rem_auto]">
                  <Select label="Product" required value={line.productId} onChange={(ev) => updateLine(line.key, { productId: ev.target.value })} options={productOptions} placeholder={header.distributorId ? "Select product" : "Select a distributor first"} disabled={!header.distributorId} error={show ? e.product : ""} />
                  <Select label="Batch" value={line.batchId} onChange={(ev) => updateLine(line.key, { batchId: ev.target.value })} options={batchOptions} disabled={!line.productId || b?.status === "loading"} hint={b?.status === "loading" ? "Loading batches…" : b?.status === "error" ? "Unable to load batches." : undefined} />
                  <Input label="Quantity" required type="number" inputMode="numeric" min={1} step={1} value={line.quantity} onChange={(ev) => updateLine(line.key, { quantity: ev.target.value })} error={show ? e.quantity : ""} />
                  <Input label="Discount %" type="number" inputMode="decimal" min={0} max={100} step="0.5" value={line.discount} onChange={(ev) => updateLine(line.key, { discount: ev.target.value })} error={show ? e.discount : ""} />
                  <div className="flex items-end">
                    <IconButton icon={Trash2} label={`Remove line ${i + 1}`} variant="danger" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== line.key) : ls))} disabled={lines.length === 1} />
                  </div>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-control bg-surface-muted p-3 text-table sm:grid-cols-3 xl:grid-cols-6" aria-live="polite" aria-busy={preview.status === "loading"}>
                  {[
                    ["SKU", r?.sku],
                    ["Expiry", r?.batch ? formatDate(r.batch.expDate) : line.batchId ? "" : r ? "Auto" : ""],
                    ["Available", r?.available !== undefined ? formatNumber(r.available) : ""],
                    ["MRP", r ? (r.mrp === null ? "—" : formatINR(r.mrp)) : ""],
                    ["Dealer price", r?.dealerPrice !== undefined ? formatINR(r.dealerPrice) : ""],
                    ["GST", r?.gstRate !== undefined ? `${r.gstRate}% · ${formatINR(r.tax)}` : ""],
                    ["Gross", r?.gross !== undefined ? formatINR(r.gross) : ""],
                    ["Discount", r?.discountAmount !== undefined ? formatINR(r.discountAmount) : ""],
                    ["Taxable", r?.taxable !== undefined ? formatINR(r.taxable) : ""],
                    ["Net amount", r?.net !== undefined ? formatINR(r.net) : ""],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-caption text-ink-subtle">{label}</dt>
                      <dd className={label === "Net amount" ? "font-semibold text-ink" : "text-ink"}>{value || <span className="text-ink-subtle">{preview.status === "loading" && line.productId ? "Calculating…" : "—"}</span>}</dd>
                    </div>
                  ))}
                </dl>
                {r?.errors?.length ? (
                  <ul className="mt-2 space-y-1" role="alert">
                    {r.errors.map((er) => (
                      <li key={er.code + er.message} className="text-table font-medium text-error-700">{er.message}</li>
                    ))}
                  </ul>
                ) : null}
                {/* FEFO Allocation Preview (Phase 6, item 8) — only for an "Auto" line: which batches would actually be
                    used at delivery time, in FEFO order. Informational; the server allocates and validates for real
                    when the delivery is created, and can differ if stock changes in the meantime. */}
                {!line.batchId && r?.fefoAllocation?.length ? (
                  <div className="mt-3 rounded-control border border-line p-3">
                    <p className="mb-2 text-caption font-semibold text-ink-muted">FEFO Allocation Preview{r.fefoSufficient === false ? " — insufficient eligible stock" : ""}</p>
                    <ul className="space-y-1">
                      {r.fefoAllocation.map((a) => (
                        <li key={a.batchId} className="flex items-center justify-between gap-3 text-table">
                          <span className="text-ink">{a.batchNo} <span className="text-ink-subtle">· exp {formatDate(a.expDate)}</span></span>
                          <span className="tabular-nums text-ink-subtle">{formatNumber(a.allocated)} of {formatNumber(a.available)} available</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </fieldset>
            );
          })}
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
        <p className="self-end text-caption text-ink-subtle">
          Pricing comes from the pricing master for the retailer&apos;s group, GST from the product&apos;s rates, and stock from the batch ledger — the same rules used when the order is saved. Scheme and credit-limit checks arrive in later phases.
        </p>
        <div>
          {priced ? <TotalsPanel totals={priced.totals} /> : <Card padding="md"><p className="text-body text-ink-muted">Select a retailer and add products to see the totals.</p></Card>}
        </div>
      </div>
    </div>
  );
}
