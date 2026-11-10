// Date helpers for the date-range picker. All values are local-time ISO dates (YYYY-MM-DD).
export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysAgo(n, now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - n);
  return d;
}

// Indian financial year: 1 April – 31 March.
function financialYearStart(today = new Date()) {
  const year = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  return new Date(year, 3, 1);
}

// Week = Monday → today. Quarter = the current Indian financial-year quarter (Apr–Jun, Jul–Sep, Oct–Dec, Jan–Mar) to date.
function startOfWeek(now) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const offset = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - offset);
  return d;
}

function startOfQuarter(now) {
  const fyIndex = (now.getMonth() + 9) % 12; // April = 0
  const startMonth = (Math.floor(fyIndex / 3) * 3 + 3) % 12;
  const year = startMonth > now.getMonth() ? now.getFullYear() - 1 : now.getFullYear();
  return new Date(year, startMonth, 1);
}

// Every preset's range() accepts an optional `now` so it can be tested with a fixed date.
export const DEFAULT_RANGE_PRESETS = [
  { id: "today", label: "Today", range: (now = new Date()) => ({ from: toISODate(now), to: toISODate(now) }) },
  {
    id: "yesterday",
    label: "Yesterday",
    range: (now = new Date()) => {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      return { from: toISODate(y), to: toISODate(y) };
    },
  },
  { id: "week", label: "This week", range: (now = new Date()) => ({ from: toISODate(startOfWeek(now)), to: toISODate(now) }) },
  {
    id: "month",
    label: "This month",
    range: (now = new Date()) => ({ from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toISODate(now) }),
  },
  {
    id: "last-month",
    label: "Previous month",
    range: (now = new Date()) => ({
      from: toISODate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: toISODate(new Date(now.getFullYear(), now.getMonth(), 0)),
    }),
  },
  { id: "quarter", label: "This quarter", range: (now = new Date()) => ({ from: toISODate(startOfQuarter(now)), to: toISODate(now) }) },
  { id: "fy", label: "This financial year", range: (now = new Date()) => ({ from: toISODate(financialYearStart(now)), to: toISODate(now) }) },
  { id: "7d", label: "Last 7 days", range: (now = new Date()) => ({ from: toISODate(daysAgo(6, now)), to: toISODate(now) }) },
  { id: "30d", label: "Last 30 days", range: (now = new Date()) => ({ from: toISODate(daysAgo(29, now)), to: toISODate(now) }) },
];

// Initial range for a portal that opens with a preset (e.g. the Admin dashboard opens on "This month").
export function rangeFromPreset(presetId, now = new Date()) {
  const preset = DEFAULT_RANGE_PRESETS.find((p) => p.id === presetId);
  return preset ? { ...preset.range(now), presetId: preset.id } : { from: "", to: "" };
}

const shortFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" });
const longFmt = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export function formatRange(range) {
  if (!range || (!range.from && !range.to)) return "";
  const parse = (s) => new Date(`${s}T00:00:00`);
  if (range.from && range.to) {
    const f = parse(range.from);
    const t = parse(range.to);
    const sameYear = f.getFullYear() === t.getFullYear();
    return `${sameYear ? shortFmt.format(f) : longFmt.format(f)} – ${longFmt.format(t)}`;
  }
  return longFmt.format(parse(range.from || range.to));
}
