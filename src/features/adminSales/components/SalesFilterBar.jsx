import { useMemo } from "react";
import FilterBar from "../../../components/ui/FilterBar";
import { useDateRange } from "../../../components/layout/dateRangeContext";
import { CategoryFilter, DateRangeFilter, DistributorFilter, SapStatusFilter, SearchFilter, StatusFilter, TerritoryFilter } from "../../../components/forms";

const asOptions = (items) => (items || []).map((x) => ({ value: x, label: x }));

/**
 * SalesFilterBar — the Phase 2 FilterBar + filter components wired to a Sales list.
 * fields: which filters to show. The date range is the shell's (header) range, so header and filter always agree.
 * filters/onChange hold every other filter value ("" = All). Options come from the server lookups.
 */
export default function SalesFilterBar({ fields, filters, onChange, lookups, statusOptions, statusDomain, searchPlaceholder }) {
  const { range, setRange } = useDateRange();
  const set = (key) => (value) => onChange({ ...filters, [key]: value });
  const distributorOptions = useMemo(() => (lookups?.distributors || []).map((d) => ({ value: String(d.id), label: d.name })), [lookups]);
  const activeCount = Object.values(filters).filter(Boolean).length + (range.from ? 1 : 0);
  const has = (f) => fields.includes(f);

  return (
    <FilterBar
      className="mb-4"
      activeCount={activeCount}
      onReset={() => {
        onChange(Object.fromEntries(Object.keys(filters).map((k) => [k, ""])));
        setRange({ from: "", to: "" });
      }}
    >
      {has("search") ? <SearchFilter label="Search" value={filters.q} onChange={set("q")} placeholder={searchPlaceholder || "Search…"} /> : null}
      {has("date") ? <DateRangeFilter value={range} onChange={setRange} /> : null}
      {has("distributor") ? <DistributorFilter value={filters.distributorId} onChange={set("distributorId")} options={distributorOptions} /> : null}
      {has("retailer") ? <SearchFilter label="Retailer" value={filters.retailer} onChange={set("retailer")} placeholder="Retailer name" className="w-full sm:w-48" /> : null}
      {has("product") ? <SearchFilter label="Product" value={filters.product} onChange={set("product")} placeholder="Name or SKU" className="w-full sm:w-48" /> : null}
      {has("category") ? <CategoryFilter value={filters.category} onChange={set("category")} options={asOptions(lookups?.categories)} /> : null}
      {has("territory") ? <TerritoryFilter value={filters.territory} onChange={set("territory")} options={asOptions(lookups?.territories)} /> : null}
      {has("batch") ? <SearchFilter label="Batch" value={filters.batch} onChange={set("batch")} placeholder="Batch number" className="w-full sm:w-44" /> : null}
      {has("status") ? <StatusFilter domain={statusDomain} options={statusOptions} value={filters.status} onChange={set("status")} /> : null}
      {has("sap") ? <SapStatusFilter value={filters.sap} onChange={set("sap")} /> : null}
    </FilterBar>
  );
}
