import { BUCKET_LABEL, BUCKET_TONE } from "../api/accountsApi";
import { formatINR } from "../../../utils/format";
import { cn } from "../../../utils/cn";

export const Dash = () => <span className="text-ink-subtle">—</span>;
export const Money = ({ value, className }) => <span className={cn("tabular-nums", className)}>{formatINR(value)}</span>;

export function BucketBadge({ bucket }) {
  if (!bucket) return <Dash />;
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-caption font-medium", BUCKET_TONE[bucket])}>{BUCKET_LABEL[bucket] || bucket}</span>;
}
