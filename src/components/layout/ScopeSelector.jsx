import { Building2, Check, ChevronsUpDown } from "lucide-react";
import Dropdown from "../ui/Dropdown";

/**
 * ScopeSelector — company / distributor context.
 *  • one scope (Distributor portal today): a static, non-interactive chip showing the distributor identity;
 *  • several scopes (future Admin portal): a switcher menu.
 * scopes: [{ id, name, code }]   value: selected id   onChange(id)
 */
export default function ScopeSelector({ scopes = [], value, onChange, label = "Distributor" }) {
  const current = scopes.find((s) => s.id === value) || scopes[0];
  if (!current) return null;

  const body = (
    <>
      <Building2 className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
      <span className="min-w-0 text-left">
        <span className="block max-w-40 truncate text-body font-medium leading-tight text-ink">{current.name}</span>
        {current.code ? <span className="block text-caption leading-tight text-ink-subtle">{current.code}</span> : null}
      </span>
    </>
  );

  if (scopes.length <= 1) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-control border border-line bg-surface-muted px-3" aria-label={`${label}: ${current.name}`} role="group">
        {body}
      </div>
    );
  }

  const items = scopes.map((s) => ({ key: s.id, label: s.name, hint: s.code, icon: s.id === current.id ? Check : undefined, onClick: () => onChange?.(s.id) }));
  return (
    <Dropdown items={items} label={`Switch ${label.toLowerCase()}`} width="w-64">
      <button type="button" className="flex h-10 items-center gap-2 rounded-control border border-line bg-surface px-3 transition-colors duration-150 hover:border-line-strong">
        {body}
        <ChevronsUpDown className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
      </button>
    </Dropdown>
  );
}
