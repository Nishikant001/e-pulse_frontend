import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import Card from "../../../components/ui/Card";
import IconButton from "../../../components/ui/IconButton";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import DataTable from "../../../components/tables/DataTable";
import { useDateRange } from "../../../components/layout/dateRangeContext";
import { formatDateTime, formatNumber } from "../../../utils/format";
import { SampleBanner, SourceSwitch } from "../../adminSales/components/SourceControls";
import { useSalesList } from "../../adminSales/hooks/useSalesList";
import InventoryFilterBar from "../components/InventoryFilterBar";
import { inventoryErrorMessage } from "../api/inventoryErrors";
import { inventoryBase, useInventoryScreen } from "../hooks/useInventoryScreen";

const FIELDS = ["search", "date", "distributor", "warehouse", "product", "batch", "txnType"];
const KEYS = ["q", "distributorId", "warehouseId", "product", "batch", "txnType"];

/** Stock Ledger — every stock movement, from the same ledger the inventory engine posts to. Server-side paging and filters. */
export default function StockLedgerPage({ portal = "admin" }) {
  const { isAdmin, source, setSource, api, lookups, expire, isSample } = useInventoryScreen(portal);
  const { range } = useDateRange();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState(() => Object.fromEntries(KEYS.map((k) => [k, params.get(k) || ""])));
  const apiFilters = useMemo(() => ({ ...filters, from: range.from, to: range.to }), [filters, range.from, range.to]);
  const list = useSalesList({ fetcher: api.ledger, filters: apiFilters, defaultSort: { key: "date", dir: "desc" }, onUnauthorized: expire });
  const base = inventoryBase(portal);

  const columns = useMemo(
    () => [
      { key: "date", header: "Date", sortable: true, sticky: true, accessor: (r) => r.date, render: (v) => <span className="whitespace-nowrap">{formatDateTime(v)}</span> },
      { key: "reference", header: "Reference", minWidth: "10rem", accessor: (r) => r.reference, render: (v, r) => (<><span className="block">{v}</span>{r.note && r.note !== v ? <span className="block text-caption text-ink-subtle">{r.note}</span> : null}</>) },
      { key: "type", header: "Transaction Type", accessor: (r) => r.transactionLabel },
      { key: "product", header: "Product", minWidth: "11rem", accessor: (r) => r.product, render: (v, r) => (<><span className="block">{v}</span><span className="block text-caption text-ink-subtle">{r.sku}</span></>) },
      { key: "batch", header: "Batch", accessor: (r) => r.batchNo, render: (v, r) => (v ? <Link to={`${base}/batch?batch=${r.batchId}`} className="whitespace-nowrap font-medium text-brand-700 hover:underline">{v}</Link> : <span className="text-ink-subtle">—</span>) },
      ...(isAdmin ? [{ key: "distributor", header: "Distributor", minWidth: "10rem", accessor: (r) => r.distributor.name }] : []),
      { key: "warehouse", header: "Warehouse", accessor: (r) => r.warehouse.name },
      { key: "in", header: "In", align: "right", accessor: (r) => r.inQty, render: (v) => (v != null ? <span className="tabular-nums">+{formatNumber(v)}</span> : <span className="text-ink-subtle">—</span>) },
      { key: "out", header: "Out", align: "right", accessor: (r) => r.outQty, render: (v) => (v != null ? <span className="tabular-nums">−{formatNumber(v)}</span> : <span className="text-ink-subtle">—</span>) },
      { key: "balance", header: "Balance", align: "right", accessor: (r) => r.balance, render: (v) => (v != null ? <span className="tabular-nums">{formatNumber(v)}</span> : <span className="text-ink-subtle">—</span>) },
      {
        key: "status", header: "Status", accessor: (r) => r.stockState,
        render: (v, r) => (
          <>
            <StatusBadge status={v} domain="inventory" size="sm" />
            {r.nonSaleableReason ? <span className="mt-0.5 block text-caption text-ink-subtle">{r.nonSaleableReason.replace(/_/g, " ").toLowerCase()}</span> : null}
          </>
        ),
      },
    ],
    [isAdmin, base],
  );

  return (
    <div>
      <PageHeader
        title="Stock Ledger"
        description="Every stock movement — purchases, sales, returns, adjustments, transfers and status changes. Balance is the running total for the batch in that warehouse."
        actions={
          <>
            {isAdmin ? <SourceSwitch source={source} onChange={setSource} /> : null}
            <IconButton icon={RefreshCw} label="Refresh ledger" variant="outline" onClick={list.reload} disabled={list.status === "loading"} />
          </>
        }
      />
      {isSample ? <SampleBanner /> : null}
      <InventoryFilterBar fields={FIELDS} filters={filters} onChange={setFilters} lookups={lookups} showDistributor={isAdmin} searchPlaceholder="Product, batch or reference" />

      <Card>
        <DataTable
          bare manual rowKey="id" caption="Stock ledger"
          columns={columns} data={list.data?.items || []} loading={list.status === "loading"}
          error={list.status === "error" ? inventoryErrorMessage(list.error, "Unable to load the stock ledger. Please try again.") : null} onRetry={list.reload}
          page={list.page} pageSize={list.pageSize} total={list.data?.total ?? 0} onPageChange={list.setPage} onPageSizeChange={list.setPageSize}
          sort={list.sort} onSortChange={list.setSort}
          emptyTitle="No stock movements found" emptyDescription="Try changing the filters or the date range."
        />
      </Card>
    </div>
  );
}
