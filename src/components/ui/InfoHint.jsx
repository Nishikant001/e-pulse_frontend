import { Info } from "lucide-react";
import { cn } from "../../utils/cn";
import Tooltip from "./Tooltip";

/** InfoHint — small (i) icon that explains a page/section on hover, keyboard focus or tap. */
export default function InfoHint({ text, label = "About this page", className, placement = "bottom" }) {
  if (!text) return null;
  return (
    <Tooltip content={text} placement={placement} className="shrink-0">
      <button
        type="button"
        aria-label={`${label}: ${text}`}
        className={cn("inline-flex size-6 items-center justify-center rounded-full text-ink-subtle transition-colors duration-150 hover:bg-brand-50 hover:text-brand-700 focus-visible:bg-brand-50 focus-visible:text-brand-700", className)}
      >
        <Info className="size-4" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
