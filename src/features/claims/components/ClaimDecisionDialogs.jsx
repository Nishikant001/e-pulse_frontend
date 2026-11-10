import { useEffect, useState } from "react";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import Alert from "../../../components/ui/Alert";
import { Textarea } from "../../../components/ui/Input";
import { useToast } from "../../../components/feedback";

// action: review | approve | reject | needsCorrection (Admin only). The server re-validates everything; a refused decision shows its reasons here.
const CFG = {
  review: { title: "Start review?", confirm: "Start review", tone: "primary", done: "Claim moved to review", msg: (c) => `${c.number} will be marked as under review.` },
  approve: { title: "Approve claim?", confirm: "Approve", tone: "primary", done: "Claim approved", msg: (c) => `Approve ${c.number} for ₹${c.amount}? Eligibility is re-checked against the scheme before it is approved. No payment or accounting entry is created.`, comment: "Comment (optional)" },
  reject: { title: "Reject claim?", confirm: "Reject", tone: "danger", done: "Claim rejected", msg: (c) => `${c.number} will be rejected. The distributor can see the reason.`, comment: "Rejection reason", required: true },
  needsCorrection: { title: "Return for correction?", confirm: "Return to distributor", tone: "warning", done: "Claim returned for correction", msg: (c) => `${c.number} will go back to the distributor to correct and resubmit.`, comment: "Correction reason", required: true, extra: "Required information (optional)" },
};

export default function ClaimDecisionDialog({ api, claim, action, onClose, onDone }) {
  const toast = useToast();
  const [comment, setComment] = useState("");
  const [extra, setExtra] = useState("");
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState(null);
  useEffect(() => { if (action) { setComment(""); setExtra(""); setProblem(null); } }, [action]);
  if (!action || !claim) return null;
  const cfg = CFG[action];
  const short = cfg.required && comment.trim().length < 5;

  async function confirm() {
    if (short) { setProblem({ message: "Please enter a reason of at least 5 characters." }); return; }
    setSaving(true);
    setProblem(null);
    try {
      if (action === "review") await api.review(claim.id, { comment: comment.trim() || undefined });
      if (action === "approve") await api.approve(claim.id, { comment: comment.trim() || undefined });
      if (action === "reject") await api.reject(claim.id, { reason: comment.trim() });
      if (action === "needsCorrection") await api.needsCorrection(claim.id, { reason: comment.trim(), required_information: extra.trim() || undefined });
      toast.success(cfg.done);
      onDone?.();
      onClose();
    } catch (err) {
      setProblem({ message: err.message, issues: err.details?.issues });
      toast.error(err.message || "Unable to complete the action", { title: "Action failed" });
      if (err.status === 409) onDone?.(); // someone else changed it — refresh behind the dialog
    } finally {
      setSaving(false);
    }
  }

  return (
    <ConfirmationModal
      open onCancel={saving ? undefined : onClose} onConfirm={confirm} loading={saving} tone={cfg.tone} title={cfg.title} confirmLabel={cfg.confirm}
      message={(
        <div className="space-y-3">
          <p>{cfg.msg(claim)}</p>
          {action !== "review" ? <Textarea label={cfg.comment} required={cfg.required} rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} /> : null}
          {cfg.extra ? <Textarea label={cfg.extra} rows={2} maxLength={1000} value={extra} onChange={(e) => setExtra(e.target.value)} /> : null}
          {problem ? (
            <Alert tone="error" title={problem.message}>
              {problem.issues?.length ? <ul className="list-disc pl-5">{problem.issues.map((i, n) => <li key={n}>{i.message}</li>)}</ul> : null}
            </Alert>
          ) : null}
        </div>
      )}
    />
  );
}
