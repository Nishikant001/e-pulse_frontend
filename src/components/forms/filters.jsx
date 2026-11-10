import { getStatusOptions } from "../ui/statusConfig";
import DateRangePicker from "../ui/DateRangePicker";
import SearchInput from "../ui/SearchInput";
import Select from "../ui/Select";

/**
 * Reusable filter controls for FilterBar. They are UI only: the caller supplies `options` and owns state.
 * value === "" means "All". Option shape: [{ value, label }].
 */
export function SelectFilter({ label, value, onChange, options = [], allLabel = "All", className = "w-full sm:w-48", disabled }) {
  return (
    <Select
      label={label}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      options={options}
      placeholder={allLabel}
      disabled={disabled}
      wrapperClassName={className}
      labelClassName="text-caption text-ink-muted"
    />
  );
}

export function SearchFilter({ label = "Search", value, onChange, placeholder = "Search…", debounceMs = 300, className = "w-full sm:w-64" }) {
  return (
    <div className={className}>
      <span className="mb-1.5 block text-caption font-medium text-ink-muted">{label}</span>
      <SearchInput value={value} onChange={onChange} placeholder={placeholder} debounceMs={debounceMs} label={label} />
    </div>
  );
}

export function DateRangeFilter({ label = "Date range", value, onChange, align = "start" }) {
  return (
    <div>
      <span className="mb-1.5 block text-caption font-medium text-ink-muted">{label}</span>
      <DateRangePicker value={value} onChange={onChange} label={label} align={align} />
    </div>
  );
}

export const DistributorFilter = (props) => <SelectFilter label="Distributor" allLabel="All distributors" {...props} />;
export const RetailerFilter = (props) => <SelectFilter label="Retailer" allLabel="All retailers" {...props} />;
export const ProductFilter = (props) => <SelectFilter label="Product" allLabel="All products" {...props} />;
export const CategoryFilter = (props) => <SelectFilter label="Category" allLabel="All categories" {...props} />;
export const BatchFilter = (props) => <SelectFilter label="Batch" allLabel="All batches" {...props} />;
export const TerritoryFilter = (props) => <SelectFilter label="Territory" allLabel="All territories" {...props} />;

// Status filters read their options from the shared status system (components/ui/statusConfig.js).
export function StatusFilter({ domain, options, label = "Status", allLabel = "All statuses", ...props }) {
  return <SelectFilter label={label} allLabel={allLabel} options={options || getStatusOptions(domain)} {...props} />;
}
export const SapStatusFilter = (props) => <StatusFilter domain="sap" label="SAP status" allLabel="All SAP statuses" {...props} />;
