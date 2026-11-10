// Shared class names / aria helpers for form controls.
export function describedBy(id, { error, hint }) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export const controlBase =
  "w-full rounded-control border bg-surface text-body text-ink placeholder:text-ink-subtle transition-colors duration-150 " +
  "hover:border-ink-subtle focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 " +
  "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-ink-subtle";

export function controlBorder(error) {
  return error ? "border-error-500 focus:border-error-500 focus:ring-error-500/25" : "border-line-strong";
}
