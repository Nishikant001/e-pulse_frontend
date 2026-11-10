// Scope helpers shared by the Start-sync and Schedule dialogs (what the ADMIN chose: distributor, tax record, customer group …).
export const emptyScope = () => ({ distributorId: "", hsnId: "", customerGroupId: "", defaultMode: "" });

/** → error text, or "" when every required scope field is chosen. */
export function scopeError(target, v) {
  const missing = (target?.scopeFields || []).filter((f) => f.required && !v[f.name]);
  return missing.length ? `Choose: ${missing.map((f) => f.label.toLowerCase()).join(", ")}.` : "";
}
/** → the scope object sent to the API (numbers for ids, only fields the target asks for). */
export function toScope(target, v) {
  const out = {};
  (target?.scopeFields || []).forEach((f) => {
    if (!v[f.name]) return;
    out[f.name] = f.name === "defaultMode" ? v.defaultMode : Number(v[f.name]);
  });
  return out;
}
/** Existing scope from the server → form state (strings). */
export const fromScope = (scope) => ({ ...emptyScope(), ...Object.fromEntries(Object.entries(scope || {}).map(([k, x]) => [k, String(x)])) });

