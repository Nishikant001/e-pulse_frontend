import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Ellipsis, SearchX } from "lucide-react";
import { cn } from "../../utils/cn";
import Dropdown from "../ui/Dropdown";
import EmptyState from "../ui/EmptyState";
import ErrorState from "../ui/ErrorState";
import IconButton from "../ui/IconButton";
import Pagination from "../ui/Pagination";
import SearchInput from "../ui/SearchInput";
import { SkeletonTable } from "../ui/Skeleton";
import Button from "../ui/Button";

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" };

const valueOf = (row, col) => (col.accessor ? col.accessor(row) : row[col.key]);

function compare(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const da = Date.parse(a);
  const db = Date.parse(b);
  if (typeof a === "string" && typeof b === "string" && !Number.isNaN(da) && !Number.isNaN(db) && /\d{4}-\d{2}-\d{2}/.test(a)) return da - db;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

/**
 * DataTable — the enterprise table for every list screen.
 *
 * columns: [{ key, header, accessor?(row), render?(value,row), sortable?, sortValue?(row), align?, width?, minWidth?,
 *             sticky?: true (freeze first column), hideOnMobile?, cellClassName? }]
 *
 * Client mode (default): the table searches, sorts and paginates the `data` it is given.
 * Manual (server) mode: pass manual + page/pageSize/total/onPageChange (+ sort/onSortChange, search/onSearchChange);
 *   the table then renders `data` exactly as given.
 *
 * States: loading (skeleton) · error (retry) · empty · no-matches. Horizontal scroll is built in;
 * set maxHeight (e.g. "32rem") to get a sticky header; responsive="cards" renders a stacked card list below 768px.
 */
export default function DataTable({
  columns,
  data = [],
  rowKey = "id",
  loading = false,
  error = null,
  onRetry,
  emptyTitle = "No records found",
  emptyDescription,
  emptyAction,
  emptyIcon,
  searchable = false,
  searchPlaceholder = "Search…",
  searchKeys,
  toolbar,
  rowActions,
  onRowClick,
  pagination = true,
  pageSizeOptions = [10, 25, 50, 100],
  initialPageSize = 10,
  manual = false,
  page: pageProp,
  pageSize: pageSizeProp,
  total: totalProp,
  onPageChange,
  onPageSizeChange,
  sort: sortProp,
  onSortChange,
  search: searchProp,
  onSearchChange,
  maxHeight,
  responsive = "scroll",
  cardTitleKey, // column used as the card title in the stacked layout (default: first column)
  caption,
  bare = false,
  className,
}) {
  const [searchInner, setSearchInner] = useState("");
  const [sortInner, setSortInner] = useState(null); // { key, dir }
  const [pageInner, setPageInner] = useState(1);
  const [pageSizeInner, setPageSizeInner] = useState(initialPageSize);

  const search = manual ? searchProp ?? "" : searchInner;
  const sort = manual ? sortProp ?? null : sortInner;
  const pageSize = manual ? pageSizeProp ?? initialPageSize : pageSizeInner;
  const pageState = manual ? pageProp ?? 1 : pageInner;

  const processed = useMemo(() => {
    if (manual) return data;
    let rows = data;
    const q = search.trim().toLowerCase();
    if (q) {
      const cols = searchKeys ? columns.filter((c) => searchKeys.includes(c.key)) : columns;
      rows = rows.filter((row) => cols.some((c) => String(valueOf(row, c) ?? "").toLowerCase().includes(q)));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        rows = [...rows].sort((a, b) => {
          const va = col.sortValue ? col.sortValue(a) : valueOf(a, col);
          const vb = col.sortValue ? col.sortValue(b) : valueOf(b, col);
          return sort.dir === "desc" ? -compare(va, vb) : compare(va, vb);
        });
      }
    }
    return rows;
  }, [manual, data, search, sort, columns, searchKeys]);

  const total = manual ? totalProp ?? data.length : processed.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(pageState, totalPages);

  useEffect(() => {
    if (!manual && pageInner > totalPages) setPageInner(totalPages);
  }, [manual, pageInner, totalPages]);

  const visible = useMemo(() => {
    if (manual || !pagination) return processed;
    const start = (page - 1) * pageSize;
    return processed.slice(start, start + pageSize);
  }, [manual, pagination, processed, page, pageSize]);

  const setSearch = (v) => {
    if (manual) onSearchChange?.(v);
    else {
      setSearchInner(v);
      setPageInner(1);
    }
  };
  const setPage = (p) => (manual ? onPageChange?.(p) : setPageInner(p));
  const setPageSize = (n) => {
    if (manual) onPageSizeChange?.(n);
    else {
      setPageSizeInner(n);
      setPageInner(1);
    }
  };
  const toggleSort = (col) => {
    const next = !sort || sort.key !== col.key ? { key: col.key, dir: "asc" } : sort.dir === "asc" ? { key: col.key, dir: "desc" } : null;
    if (manual) onSortChange?.(next);
    else {
      setSortInner(next);
      setPageInner(1);
    }
  };

  const titleCol = columns.find((c) => c.key === cardTitleKey) || columns[0];
  const hasToolbar = searchable || toolbar;
  const withActions = typeof rowActions === "function";
  const colCount = columns.length + (withActions ? 1 : 0);
  const isEmpty = !loading && !error && data.length === 0 && !(manual && total > 0);
  const noMatches = !loading && !error && !isEmpty && visible.length === 0;
  const headerStuck = Boolean(maxHeight);

  const cellPad = "px-4 py-3";
  const stickyCell = (col, head) => (col.sticky ? cn("sticky left-0 z-[1]", head ? "bg-surface-muted" : "bg-surface group-hover:bg-brand-50") : "");

  // The wrapper stops clicks (including those bubbling out of the portalled menu) from triggering onRowClick.
  const renderActions = (row) => (
    <span className="inline-flex" onClick={(e) => e.stopPropagation()}>
      <Dropdown items={rowActions(row)} label="Row actions">
        <IconButton icon={Ellipsis} label="Row actions" size="sm" tooltip={false} />
      </Dropdown>
    </span>
  );

  const rowProps = (row) =>
    onRowClick
      ? {
          onClick: () => onRowClick(row),
          onKeyDown: (e) => {
            if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
              e.preventDefault();
              onRowClick(row);
            }
          },
          tabIndex: 0,
          className: "cursor-pointer",
        }
      : {};

  let body;
  if (loading) body = <SkeletonTable rows={Math.min(pageSize, 6)} columns={Math.min(colCount, 6)} />;
  else if (error) body = <ErrorState message={typeof error === "string" ? error : "Unable to load the data."} onRetry={onRetry} />;
  else if (isEmpty) body = <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} icon={emptyIcon} />;
  else if (noMatches)
    body = (
      <EmptyState
        icon={SearchX}
        title="No matching results"
        description="Try a different search term or clear your filters."
        action={search ? <Button variant="secondary" onClick={() => setSearch("")}>Clear search</Button> : null}
      />
    );
  else {
    body = (
      <>
        {responsive === "cards" ? (
          <ul className="divide-y divide-line md:hidden">
            {visible.map((row) => (
              <li key={row[rowKey]} className="space-y-2 px-4 py-3.5" {...(onRowClick ? { onClick: () => onRowClick(row) } : {})}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-body font-medium text-ink">{titleCol.render ? titleCol.render(valueOf(row, titleCol), row) : valueOf(row, titleCol) ?? "—"}</div>
                  {withActions ? renderActions(row) : null}
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {columns.filter((col) => col !== titleCol).map((col) => (
                    <div key={col.key} className="min-w-0">
                      <dt className="text-caption text-ink-subtle">{col.header}</dt>
                      <dd className="truncate text-table text-ink">{col.render ? col.render(valueOf(row, col), row) : valueOf(row, col) ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={cn("dms-scroll relative overflow-auto", responsive === "cards" && "hidden md:block")} style={maxHeight ? { maxHeight } : undefined}>
          <table className="w-full min-w-max border-collapse text-table">
            {caption ? <caption className="sr-only">{caption}</caption> : null}
            <thead>
              <tr>
                {columns.map((col) => {
                  const active = sort?.key === col.key;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={col.sortable ? (active ? (sort.dir === "asc" ? "ascending" : "descending") : "none") : undefined}
                      style={{ width: col.width, minWidth: col.minWidth }}
                      className={cn(
                        "whitespace-nowrap border-b border-line bg-surface-muted text-caption font-semibold uppercase tracking-wide text-ink-subtle",
                        cellPad,
                        ALIGN[col.align || "left"],
                        headerStuck && "sticky top-0 z-[2]",
                        col.sticky && "left-0 z-[3]",
                        col.hideOnMobile && "hidden md:table-cell",
                      )}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col)}
                          className={cn("inline-flex items-center gap-1.5 rounded uppercase tracking-wide transition-colors duration-150 hover:text-ink", active && "text-ink", col.align === "right" && "flex-row-reverse")}
                        >
                          {col.header}
                          {active ? sort.dir === "asc" ? <ArrowUp className="size-3.5" aria-hidden="true" /> : <ArrowDown className="size-3.5" aria-hidden="true" /> : <ArrowUpDown className="size-3.5 opacity-50" aria-hidden="true" />}
                          <span className="sr-only">{active ? `, sorted ${sort.dir === "asc" ? "ascending" : "descending"}` : ", click to sort"}</span>
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
                {withActions ? (
                  <th scope="col" className={cn("w-12 border-b border-line bg-surface-muted", cellPad, headerStuck && "sticky top-0 z-[2]")}>
                    <span className="sr-only">Actions</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row[rowKey]} {...rowProps(row)} className={cn("group border-b border-line transition-colors duration-100 last:border-0 hover:bg-brand-50 focus-visible:bg-brand-50", onRowClick && "cursor-pointer")}>
                  {columns.map((col) => {
                    const value = valueOf(row, col);
                    return (
                      <td key={col.key} className={cn(cellPad, "align-middle text-ink", ALIGN[col.align || "left"], stickyCell(col, false), col.hideOnMobile && "hidden md:table-cell", col.cellClassName)}>
                        {col.render ? col.render(value, row) : value ?? <span className="text-ink-subtle">—</span>}
                      </td>
                    );
                  })}
                  {withActions ? <td className={cn(cellPad, "text-right")}>{renderActions(row)}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <div className={cn(!bare && "overflow-hidden rounded-card border border-line bg-surface shadow-card", className)}>
      {hasToolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          {searchable ? <SearchInput value={search} onChange={setSearch} placeholder={searchPlaceholder} className="w-full sm:w-72" /> : <span />}
          {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
        </div>
      ) : null}
      <div aria-busy={loading || undefined}>{body}</div>
      {pagination && !loading && !error && !isEmpty && !noMatches ? (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={setPageSize} pageSizeOptions={pageSizeOptions} className="border-t border-line" />
      ) : null}
    </div>
  );
}
