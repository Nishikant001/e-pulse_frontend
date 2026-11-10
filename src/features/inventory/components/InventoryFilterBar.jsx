import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import Button from "../../../components/ui/Button";
import FilterBar from "../../../components/ui/FilterBar";
import { useBreakpoint } from "../../../hooks/useMediaQuery";
import { useDateRange } from "../../../components/layout/dateRangeContext";
import { CategoryFilter, DateRangeFilter, DistributorFilter, SearchFilter, SelectFilter, StatusFilter } from "../../../components/forms";
import { EXPIRY_BUCKET_OPTIONS } from "../inventoryOptions";

const asOptions = (items) => (items || []).map((x) => ({ value: x, label: x }));

/**
 * InventoryFilterBar — the Phase 2 FilterBar + filter components wired to an Inventory list.
 * fields: search | date | distributor | warehouse | product | category | batch | status | txnType | empty
 *         | bucket | expiryRange   (Phase 6 — FEFO Monitor / Near Expiry / Expired Stock)
 * On phones only the search box and a "Filters" toggle are shown; the rest expand on demand (mobile collapse).
 * The date range is the shell's (header) range, so header and filter always agree. "" = All. `expiryRange` is a
 * SEPARATE, local date range on the batch's own expiry date (filters.expFrom/expTo) — not the header's range, which
 * filters ledger/posting dates elsewhere and would mean something different here.
 */
export default function InventoryFilterBar({ fields, filters, onChange, lookups, statusOptions, bucketOptions, showDistributor = true, searchPlaceholder }) {
  const { range, setRange } = useDateRange();
  const isMobile = useBreakpoint() === "mobile";
  const [open, setOpen] = useState(false);
  const has = (f) => fields.includes(f) && (f !== "distributor" || showDistributor);
  const set = (key) => (value) => onChange({ ...filters, [key]: value, ...(key === "distributorId" ? { warehouseId: "" } : {}) });

  const distributorOptions = useMemo(() => (lookups?.distributors || []).map((d) => ({ value: String(d.id), label: d.name })), [lookups]);
  const warehouseOptions = useMemo(
    () =>
      (lookups?.warehouses || [])
        .filter((w) => !filters.distributorId || String(w.distributorId) === String(filters.distributorId))
        .map((w) => ({ value: String(w.id), label: showDistributor && !filters.distributorId ? `${w.name} · ${distributorName(lookups, w.distributorId)}` : w.name })),
    [lookups, filters.distributorId, showDistributor],
  );
  const activeCount = Object.entries(filters).filter(([k, v]) => v && k !== "q").length + (filters.q ? 1 : 0) + (fields.includes("date") && range.from ? 1 : 0);
  const secondaryCount = activeCount - (filters.q ? 1 : 0);
  const showSecondary = !isMobile || open;

  return (
    <FilterBar
      className="mb-4"
      activeCount={activeCount}
      trailing={
        isMobile ? (
          <Button variant="secondary" size="sm" leftIcon={SlidersHorizontal} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            Filters{secondaryCount > 0 ? ` (${secondaryCount})` : ""}
          </Button>
        ) : null
      }
      onReset={() => {
        onChange(Object.fromEntries(Object.keys(filters).map((k) => [k, ""])));
        setRange({ from: "", to: "" });
      }}
    >
      {has("search") ? <SearchFilter label="Search" value={filters.q} onChange={set("q")} placeholder={searchPlaceholder || "SKU, product, batch, distributor, warehouse"} className="w-full sm:w-72" /> : null}
      {showSecondary ? (
        <>
          {has("date") ? <DateRangeFilter value={range} onChange={setRange} /> : null}
          {has("distributor") ? <DistributorFilter value={filters.distributorId} onChange={set("distributorId")} options={distributorOptions} /> : null}
          {has("warehouse") ? <SelectFilter label="Warehouse" allLabel="All warehouses" value={filters.warehouseId} onChange={set("warehouseId")} options={warehouseOptions} /> : null}
          {has("product") ? <SearchFilter label="Product" value={filters.product} onChange={set("product")} placeholder="Name or SKU" className="w-full sm:w-44" /> : null}
          {has("category") ? <CategoryFilter value={filters.category} onChange={set("category")} options={asOptions(lookups?.categories)} /> : null}
          {has("batch") ? <SearchFilter label="Batch" value={filters.batch} onChange={set("batch")} placeholder="Batch number" className="w-full sm:w-40" /> : null}
          {has("txnType") ? <SelectFilter label="Transaction type" allLabel="All types" value={filters.txnType} onChange={set("txnType")} options={lookups?.transactionTypes || []} /> : null}
          {has("status") ? <StatusFilter domain="inventory" options={statusOptions} value={filters.status} onChange={set("status")} /> : null}
          {has("bucket") ? (
            <StatusFilter domain="inventory" label="Expiry bucket" allLabel="All expiry buckets" options={bucketOptions || lookups?.expiryBuckets?.map((b) => ({ value: b.key, label: b.label })) || EXPIRY_BUCKET_OPTIONS} value={filters.bucket} onChange={set("bucket")} />
          ) : null}
          {has("expiryRange") ? (
            <DateRangeFilter label="Expiry date range" value={{ from: filters.expFrom || "", to: filters.expTo || "" }} onChange={(v) => onChange({ ...filters, expFrom: v.from || "", expTo: v.to || "" })} />
          ) : null}
          {has("empty") ? (
            <label className="flex h-9 items-center gap-2 self-end text-body text-ink">
              <input type="checkbox" className="size-4 rounded border-line-strong" checked={filters.includeEmpty === "1"} onChange={(e) => onChange({ ...filters, includeEmpty: e.target.checked ? "1" : "" })} />
              Include empty batches
            </label>
          ) : null}
        </>
      ) : null}
    </FilterBar>
  );
}

function distributorName(lookups, id) {
  return (lookups?.distributors || []).find((d) => d.id === id)?.name || "";
}
