import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "../../utils/cn";

const DIRECTION_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus };
const DIRECTION_WORD = { up: "Increase", down: "Decrease", flat: "No change" };

/**
 * TrendIndicator — arrow + value. `sentiment` says whether the change is good:
 * up is not always good (e.g. returns ↑ is negative). Defaults: up → positive, down → negative.
 * The direction is also spoken to screen readers, so colour is never the only signal.
 */
export default function TrendIndicator({ direction = "flat", value, sentiment, className }) {
  const s = sentiment || (direction === "up" ? "positive" : direction === "down" ? "negative" : "neutral");
  const Icon = DIRECTION_ICON[direction] || Minus;
  const color = s === "positive" ? "text-success-700 bg-success-50" : s === "negative" ? "text-error-700 bg-error-50" : "text-neutral-700 bg-neutral-100";
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-caption font-medium", color, className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="sr-only">{DIRECTION_WORD[direction] || DIRECTION_WORD.flat}: </span>
      {value}
    </span>
  );
}
