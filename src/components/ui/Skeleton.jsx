import { cn } from "../../utils/cn";

/** Skeleton — shimmering placeholder block. Size it with className (h-4 w-24 …). Decorative: hidden from AT. */
export default function Skeleton({ className, rounded = "rounded-md" }) {
  return <div aria-hidden="true" className={cn("dms-skeleton", rounded, className)} />;
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn("rounded-card border border-line bg-surface p-5 shadow-card", className)} aria-hidden="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="size-9" rounded="rounded-control" />
      </div>
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-40" />
    </div>
  );
}

export function SkeletonTable({ rows = 6, columns = 5, className }) {
  return (
    <div className={cn("w-full", className)} aria-hidden="true">
      <div className="flex gap-4 border-b border-line bg-surface-muted px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-line px-4 py-3.5 last:border-0">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={cn("h-3.5 flex-1", c === 0 && "max-w-[28%]")} />
          ))}
        </div>
      ))}
    </div>
  );
}
