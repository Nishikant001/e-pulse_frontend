import { cn } from "../../utils/cn";

const SIZES = { xs: "size-6 text-[10px]", sm: "size-8 text-caption", md: "size-9 text-body", lg: "size-11 text-card-title" };
const TINTS = ["bg-brand-100 text-brand-800", "bg-info-100 text-info-700", "bg-success-100 text-success-700", "bg-warning-100 text-warning-700", "bg-neutral-200 text-neutral-700"];

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function tintFor(name) {
  let h = 0;
  for (const ch of String(name || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

/** Avatar — image or initials. Decorative by default (the name is shown next to it); pass `label` if it stands alone. */
export default function Avatar({ name, src, size = "md", label, className }) {
  const common = cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none", SIZES[size], className);
  if (src) return <img src={src} alt={label || ""} className={cn(common, "object-cover")} />;
  return (
    <span className={cn(common, tintFor(name))} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {initials(name)}
    </span>
  );
}
