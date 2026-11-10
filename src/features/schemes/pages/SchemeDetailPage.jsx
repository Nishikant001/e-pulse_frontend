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
import { formatDate, formatDateTime } from "../../../utils/format";
import { SCHEME_BASE, schemesApi } from "../api/schemesApi";
import SchemeStatusDialog from "../components/SchemeStatusDialog";

const Dash = () => <span className="text-ink-subtle">—</span>;
const Field = ({ label, children }) => (
  <div className="min-w-0">
    <div className="text-caption text-ink-subtle">{label}</div>
    <div className="break-words text-body text-ink">{children || <Dash />}</div>
  </div>
);
const TYPE_LABEL = { QUANTITY_FREE: "Quantity (buy X get Y free)", PERCENT_DISCOUNT: "Percentage discount", FIXED_DISCOUNT: "Fixed discount amount" };
const List = ({ items, render, empty }) => (items?.length ? <ul className="space-y-1">{items.map((i) => <li key={i.id} className="text-body">{render(i)}</li>)}</ul> : <p className="text-body text-ink-muted">{empty}</p>);

/** Scheme details — /admin/masters/schemes/:id */
export default function SchemeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [statusOpen, setStatusOpen] = useState(false);

  const load = useCallback(() => {
    const c = new AbortController();
    setState((s) => ({ ...s, status: "loading" }));
    schemesApi.detail(id, c.signal).then((data) => setState({ status: "ready", data, error: null })).catch((error) => { if (error?.name !== "AbortError") setState({ status: "error", data: null, error }); });
    return () => c.abort();
  }, [id]);
  useEffect(() => load(), [load]);

  if (state.status === "loading" && !state.data) return <LoadingState label="Loading scheme…" />;
  if (state.status === "error") return <ErrorState message={state.error?.status === 404 ? "This scheme does not exist." : state.error?.message || "Unable to load this scheme."} onRetry={load} />;
  const s = state.data;
  const active = s.status === "active";

  return (
    <div>
      <PageHeader
        title={s.name}
        description={`${s.code} · ${s.ruleSummary}`}
        actions={(
          <>
            <IconButton icon={ArrowLeft} label="Back" variant="outline" onClick={() => navigate(SCHEME_BASE)} />
            <Button variant="secondary" leftIcon={active ? PowerOff : Power} onClick={() => setStatusOpen(true)}>{active ? "Deactivate" : "Activate"}</Button>
            <Button leftIcon={Pencil} onClick={() => navigate(`${SCHEME_BASE}/${s.id}/edit`)}>Edit</Button>
          </>
        )}
      />
      <div className="space-y-4">
        <Card>
          <CardHeader title="Basic information" actions={<StatusBadge status={s.effectiveStatus} domain="scheme" />} />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Scheme code">{s.code}</Field>
            <Field label="Type">{TYPE_LABEL[s.type]}</Field>
            <Field label="Priority">{`${s.priority} (lower number wins)`}</Field>
            <Field label="Valid from">{formatDate(s.validFrom)}</Field>
            <Field label="Valid to">{s.validTo ? formatDate(s.validTo) : "No end date"}</Field>
            <Field label="Stored status">{s.status === "active" ? "Active" : "Inactive"}</Field>
            <Field label="Description">{s.description}</Field>
            <Field label="Created">{formatDateTime(s.createdAt)}</Field>
            <Field label="Last updated">{formatDateTime(s.updatedAt)}</Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Scheme rule" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {s.type === "QUANTITY_FREE" ? (<><Field label="Buy quantity">{s.buyQuantity}</Field><Field label="Free quantity">{s.freeQuantity}</Field></>) : null}
            {s.type === "PERCENT_DISCOUNT" ? <Field label="Discount">{`${s.discountPercent}%`}</Field> : null}
            {s.type === "FIXED_DISCOUNT" ? <Field label="Discount amount">{`₹${s.discountAmount}`}</Field> : null}
            {s.type !== "QUANTITY_FREE" ? <Field label="Minimum quantity">{s.minQuantity}</Field> : null}
            <Field label="Maximum quantity">{s.maxQuantity}</Field>
            {s.type !== "QUANTITY_FREE" ? <Field label="Maximum discount">{s.maxDiscount != null ? `₹${s.maxDiscount}` : null}</Field> : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Applicability" />
          <CardBody className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <div className="mb-1 text-caption text-ink-subtle">Products</div>
              {s.productScope === "CATEGORY" ? <p className="text-body">Category: {s.category}</p> : <List items={s.products} render={(p) => `${p.name} (${p.code || p.id})`} empty="—" />}
            </div>
            <div>
              <div className="mb-1 text-caption text-ink-subtle">Distributors</div>
              {s.distributorScope === "ALL" ? <p className="text-body">All distributors</p> : <List items={s.distributors} render={(d) => `${d.name} (${d.code})`} empty="—" />}
            </div>
            <div>
              <div className="mb-1 text-caption text-ink-subtle">Retailers</div>
              {s.retailerScope === "ALL" ? <p className="text-body">All retailers</p> : <List items={s.retailers} render={(r) => `${r.name}${r.code ? ` (${r.code})` : ""}`} empty="—" />}
            </div>
          </CardBody>
        </Card>
      </div>
      <SchemeStatusDialog scheme={s} open={statusOpen} onClose={() => setStatusOpen(false)} onChanged={load} />
    </div>
  );
}
