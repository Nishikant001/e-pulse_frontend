import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Ban, CircleCheck, Pencil, Play, RotateCcw, Send } from "lucide-react";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import IconButton from "../../../components/ui/IconButton";
import Alert from "../../../components/ui/Alert";
import Tabs from "../../../components/ui/Tabs";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import LoadingState from "../../../components/ui/LoadingState";
import ErrorState from "../../../components/ui/ErrorState";
import { useToast } from "../../../components/feedback";
import { formatDate, formatDateTime, formatINR } from "../../../utils/format";
import { CLAIM_PORTALS, claimsApi } from "../api/claimsApi";
import ClaimHistory from "../components/ClaimHistory";
import ClaimDecisionDialog from "../components/ClaimDecisionDialogs";

const Dash = () => <span className="text-ink-subtle">—</span>;
const Field = ({ label, children }) => (
  <div className="min-w-0">
    <div className="text-caption text-ink-subtle">{label}</div>
    <div className="break-words text-body text-ink">{children || <Dash />}</div>
  </div>
);

/** Claim details — /admin/claims/:id (with decision actions) and /dashboard/claims/:id (read + edit/submit own). */
export default function ClaimDetailPage({ portal = "distributor" }) {
  const cfg = CLAIM_PORTALS[portal];
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const api = useMemo(() => claimsApi(portal), [portal]);
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null);

  const load = useCallback(() => {
    const c = new AbortController();
    api.detail(id, c.signal).then((data) => setState({ status: "ready", data, error: null })).catch((error) => { if (error?.name !== "AbortError") setState({ status: "error", data: null, error }); });
    return () => c.abort();
  }, [api, id]);
  useEffect(() => load(), [load]);

  if (state.status === "loading") return <LoadingState label="Loading claim…" />;
  if (state.status === "error") return <ErrorState message={state.error?.status === 404 ? "This claim does not exist." : state.error?.message || "Unable to load this claim."} onRetry={load} />;
  const c = state.data;

  async function distributorSubmit(kind) {
    setBusy(true);
    setProblem(null);
    try {
      await (kind === "resubmit" ? api.resubmit(c.id) : api.submit(c.id));
      toast.success(kind === "resubmit" ? "Claim resubmitted" : "Claim submitted");
      load();
    } catch (err) {
      setProblem({ message: err.message, issues: err.details?.issues });
      toast.error(err.message || "Unable to submit", { title: "Submit failed" });
    } finally {
      setBusy(false);
    }
  }

  async function settleNow() {
    setBusy(true);
    setProblem(null);
    try {
      await api.settle(c.id);
      toast.success("Claim settled");
      load();
    } catch (err) {
      setProblem({ message: err.message });
    } finally {
      setBusy(false);
    }
  }

  // Which buttons exist is only a convenience; the server enforces every transition and who may take it.
  const actions = [];
  if (cfg.canDecide) {
    if (c.status === "SUBMITTED" || c.status === "RESUBMITTED") actions.push(<Button key="rv" leftIcon={Play} onClick={() => setAction("review")}>Start review</Button>);
    if (c.status === "UNDER_REVIEW") {
      actions.push(<Button key="ap" leftIcon={CircleCheck} onClick={() => setAction("approve")}>Approve</Button>);
      actions.push(<Button key="nc" variant="secondary" leftIcon={RotateCcw} onClick={() => setAction("needsCorrection")}>Needs correction</Button>);
      actions.push(<Button key="rj" variant="danger" leftIcon={Ban} onClick={() => setAction("reject")}>Reject</Button>);
    }
  } else {
    if (c.editable) actions.push(<Button key="ed" variant="secondary" leftIcon={Pencil} onClick={() => navigate(`${cfg.base}/${c.id}/edit`)}>Edit</Button>);
    if (c.status === "DRAFT") actions.push(<Button key="sb" leftIcon={Send} loading={busy} onClick={() => distributorSubmit("submit")}>Submit claim</Button>);
    if (c.status === "NEEDS_CORRECTION") actions.push(<Button key="rs" leftIcon={Send} loading={busy} onClick={() => distributorSubmit("resubmit")}>Resubmit</Button>);
  }

  const info = (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Claim information" actions={<StatusBadge status={c.status} domain="claim" />} />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Claim number">{c.number}</Field>
          <Field label="Claim type">Scheme claim</Field>
          <Field label="Amount">{formatINR(c.amount)}</Field>
          <Field label="Claim date">{formatDate(c.claimDate)}</Field>
          <Field label="Claim period">{`${formatDate(c.periodFrom)} – ${formatDate(c.periodTo)}`}</Field>
          <Field label="Submitted">{c.submittedAt ? formatDateTime(c.submittedAt) : null}</Field>
          <Field label="Reviewed">{c.reviewedAt ? formatDateTime(c.reviewedAt) : null}</Field>
          <Field label="Decided">{c.decidedAt ? formatDateTime(c.decidedAt) : null}</Field>
          <Field label="Description">{c.description}</Field>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Distributor" />
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Name">{c.distributor?.name}</Field>
            <Field label="Code">{c.distributor?.code}</Field>
            {cfg.showDistributor ? <Field label="Email">{c.distributor?.email}</Field> : null}
            {cfg.showDistributor ? <Field label="Account status">{c.distributor?.status}</Field> : null}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Retailer" />
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Business name">{c.retailer?.name}</Field>
            <Field label="Customer code">{c.retailer?.code}</Field>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Scheme" />
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Scheme">{c.scheme?.name}</Field>
            <Field label="Code">{c.scheme?.code}</Field>
            <Field label="Rule when submitted">{c.schemeSnapshot?.ruleSummary}</Field>
            <Field label="Rule now">{c.scheme?.ruleSummary}</Field>
            <Field label="Validity">{c.scheme ? `${formatDate(c.scheme.validFrom)} – ${c.scheme.validTo ? formatDate(c.scheme.validTo) : "no end date"}` : null}</Field>
            <Field label="Scheme status now">{c.scheme?.currentStatus}</Field>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Invoice" />
          <CardBody className="grid grid-cols-2 gap-4">
            <Field label="Invoice">{c.invoice?.number}</Field>
            <Field label="Invoice date">{c.invoice ? formatDate(c.invoice.date) : null}</Field>
            <Field label="Invoice status">{c.invoice?.status}</Field>
            <Field label="Invoice total">{c.invoice?.total != null ? formatINR(c.invoice.total) : null}</Field>
          </CardBody>
        </Card>
      </div>
    </div>
  );

  const items = (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-body">
          <thead>
            <tr className="border-b border-line text-caption text-ink-subtle">
              {["Product", "Purchased qty", "Free qty", "Unit price", "Benefit"].map((h, i) => <th key={h} scope="col" className={`px-5 py-2 font-medium ${i ? "text-right" : ""}`}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {c.items.map((i) => (
              <tr key={i.id} className="border-b border-line last:border-0">
                <td className="px-5 py-2"><span className="block">{i.productName || <Dash />}</span><span className="block text-caption text-ink-subtle">{i.productCode}</span></td>
                <td className="px-5 py-2 text-right tabular-nums">{i.quantity}</td>
                <td className="px-5 py-2 text-right tabular-nums">{i.freeQuantity || 0}</td>
                <td className="px-5 py-2 text-right tabular-nums">{i.unitPrice != null ? formatINR(i.unitPrice) : "—"}</td>
                <td className="px-5 py-2 text-right tabular-nums">{formatINR(i.eligibleAmount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr><td colSpan={4} className="px-5 py-2 text-right font-medium">Total claim amount</td><td className="px-5 py-2 text-right font-medium tabular-nums">{formatINR(c.amount)}</td></tr></tfoot>
        </table>
      </div>
    </Card>
  );

  return (
    <div>
      <PageHeader
        title={c.number}
        description={cfg.showDistributor ? `${c.distributor?.name || ""} · ${c.scheme?.code || ""}` : c.scheme?.name}
        actions={(<><IconButton icon={ArrowLeft} label="Back" variant="outline" onClick={() => navigate(cfg.base)} />{actions}</>)}
      />
      <div className="mb-4 space-y-3">
        {c.status === "NEEDS_CORRECTION" ? <Alert tone="warning" title="Correction requested">{c.correctionReason}{c.requiredInformation ? ` — Required: ${c.requiredInformation}` : ""}</Alert> : null}
        {c.status === "REJECTED" ? <Alert tone="error" title="Claim rejected">{c.decisionReason}</Alert> : null}
        {c.status === "APPROVED" ? <Alert tone="success" title="Claim approved">{c.decisionReason || "Approved by the administrator."}</Alert> : null}
        {c.status === "APPROVED" && c.financialStatus === "SETTLED" ? <Alert tone="success" title="Financially settled">Posted to the distributor's scheme-claim account as {c.settlementReference} on {formatDate(c.settledAt)}. It is not deducted from retailer outstanding.</Alert> : null}
        {c.status === "APPROVED" && c.financialStatus === "PENDING_SETTLEMENT" ? <Alert tone="warning" title="Approved — settlement pending" action={cfg.canDecide ? <Button size="sm" onClick={settleNow} disabled={busy}>Settle now</Button> : null}>This claim was approved before accounting was enabled, so no accounting entry exists yet.</Alert> : null}
        {problem ? <Alert tone="error" title={problem.message}>{problem.issues?.length ? <ul className="list-disc pl-5">{problem.issues.map((i, n) => <li key={n}>{i.message}</li>)}</ul> : null}</Alert> : null}
      </div>
      <Tabs panelClassName="pt-4" tabs={[
        { id: "details", label: "Details", content: info },
        { id: "items", label: "Items", count: c.items.length, content: items },
        { id: "history", label: "History", count: c.history.length, content: <Card><ClaimHistory history={c.history} /></Card> },
      ]} />
      {cfg.canDecide ? <ClaimDecisionDialog api={api} claim={c} action={action} onClose={() => setAction(null)} onDone={load} /> : null}
    </div>
  );
}
