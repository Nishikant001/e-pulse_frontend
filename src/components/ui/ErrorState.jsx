import { RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "../../utils/cn";
import Button from "./Button";

/** ErrorState — "Unable to load X. Try again." Pass onRetry to show the retry button. */
export default function ErrorState({ title = "Something went wrong", message = "Unable to load this data. Please try again.", onRetry, retryLabel = "Try again", className, compact = false }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-6 py-14", className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-error-50 text-error-600">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-card-title font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-body text-ink-muted">{message}</p>
      {onRetry ? (
        <Button className="mt-5" variant="secondary" leftIcon={RefreshCw} onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
