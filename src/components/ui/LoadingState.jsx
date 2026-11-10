import { LoaderCircle } from "lucide-react";
import { cn } from "../../utils/cn";

/** LoadingState — centred spinner + label, announced politely to screen readers. */
export default function LoadingState({ label = "Loading…", className, compact = false }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center gap-3 text-center", compact ? "py-8" : "py-16", className)}>
      <LoaderCircle className="size-7 animate-spin text-brand-600" aria-hidden="true" />
      <p className="text-body text-ink-muted">{label}</p>
    </div>
  );
}
