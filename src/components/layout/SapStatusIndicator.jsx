import { cn } from "../../utils/cn";
import { TONE_STYLES } from "../ui/statusConfig";
import Tooltip from "../ui/Tooltip";

const STATES = {
  connected: { tone: "success", label: "SAP connected", hint: "The SAP connection is healthy." },
  degraded: { tone: "warning", label: "SAP degraded", hint: "SAP is reachable but some jobs are failing." },
  disconnected: { tone: "error", label: "SAP disconnected", hint: "SAP cannot be reached." },
  not_configured: { tone: "neutral", label: "SAP not configured", hint: "The SAP integration is not set up for this portal yet." },
};

/** SapStatusIndicator — connection status chip. status: connected | degraded | disconnected | not_configured. */
export default function SapStatusIndicator({ status = "not_configured", className }) {
  const s = STATES[status] || STATES.not_configured;
  const t = TONE_STYLES[s.tone];
  return (
    <Tooltip content={s.hint} placement="bottom">
      <span role="status" className={cn("inline-flex h-8 items-center gap-2 rounded-full border px-3 text-caption font-medium", t.border, t.surface, t.text, className)}>
        <span className={cn("size-2 rounded-full", t.dot)} aria-hidden="true" />
        {s.label}
      </span>
    </Tooltip>
  );
}
