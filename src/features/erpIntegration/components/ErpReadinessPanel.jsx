import { RefreshCw } from "lucide-react";
import Alert from "../../../components/ui/Alert";
import Badge from "../../../components/ui/Badge";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import { formatDateTime } from "../../../utils/format";
import { useAsyncData } from "../../inventory/hooks/useAsyncData";
import { erpApi } from "../api/erpApi";
import { errorText } from "../erpDisplay";

const OVERALL = { READY: { label: "Ready", tone: "success" }, READY_WITH_WARNINGS: { label: "Ready with warnings", tone: "warning" }, NOT_READY: { label: "Not ready", tone: "error" } };
const CHECK = { PASS: { label: "OK", tone: "success" }, WARN: { label: "Warning", tone: "warning" }, FAIL: { label: "Failed", tone: "error" }, SKIP: { label: "Skipped", tone: "neutral" } };

/** Production-readiness report from the server (names and states only — never a secret or an environment value). Shown on the dashboard to ERP viewers. */
export default function ErpReadinessPanel() {
  const q = useAsyncData((s) => erpApi.readiness(s), []);
  const r = q.data;
  const overall = r ? OVERALL[r.status] || OVERALL.NOT_READY : null;
  return (
    <Card className="mb-6 p-5" aria-label="Integration readiness">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-section font-semibold text-ink">Integration readiness</h2>
          <p className="text-caption text-ink-subtle">Checks of the server configuration, scheduler and stored connections. It does not contact any ERP.</p>
        </div>
        <div className="flex items-center gap-2">
          {overall ? <Badge tone={overall.tone} dot>{overall.label}</Badge> : null}
          <IconButton icon={RefreshCw} label="Refresh readiness" variant="outline" onClick={q.reload} disabled={q.status === "loading"} />
        </div>
      </div>
      {q.status === "error" ? <Alert tone="error" className="mt-3">{errorText(q.error, "Unable to load the readiness report.")}</Alert> : null}
      {q.status === "loading" && !r ? <p className="mt-3 text-body text-ink-muted">Checking…</p> : null}
      {r ? (
        <>
          <p className="mt-2 text-caption text-ink-muted">Checked {formatDateTime(r.checkedAt)}</p>
          <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 md:grid-cols-2">
            {r.checks.filter((c) => c.status !== "PASS").concat(r.checks.filter((c) => c.status === "PASS")).map((c) => {
              const m = CHECK[c.status] || CHECK.SKIP;
              return (
                <li key={c.name} className="flex items-start gap-2 text-body">
                  <Badge tone={m.tone} size="sm" className="mt-0.5 shrink-0">{m.label}</Badge>
                  <span className="min-w-0 text-ink-muted">{c.message}</span>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </Card>
  );
}
