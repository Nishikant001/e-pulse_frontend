import { Building2, PackageSearch, RefreshCw, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WelcomeBanner from "../../components/dashboard/WelcomeBanner";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import ErrorState from "../../components/ui/ErrorState";
import IconButton from "../../components/ui/IconButton";
import PageHeader from "../../components/ui/PageHeader";
import Tabs from "../../components/ui/Tabs";
import { useDateRange } from "../../components/layout/dateRangeContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { formatRange, rangeFromPreset } from "../../utils/dateRanges";
import { useAdminSession } from "../adminAuth/adminSessionContext";
import { DATA_SOURCES } from "./adminDashboardService";
import { useAdminDashboard } from "./useAdminDashboard";
import ActivityPanel from "./components/ActivityPanel";
import AlertsPanel from "./components/AlertsPanel";
import CategorySalesCard from "./components/CategorySalesCard";
import DistributorPerformanceCard from "./components/DistributorPerformanceCard";
import KpiSection from "./components/KpiSection";
import NearExpiryCard from "./components/NearExpiryCard";
import SalesTrendCard from "./components/SalesTrendCard";
import StockMovementCard from "./components/StockMovementCard";
import TopDistributorsCard from "./components/TopDistributorsCard";
import TopProductsCard from "./components/TopProductsCard";

const SOURCE_TABS = [
  { id: DATA_SOURCES.LIVE, label: "Live data" },
  { id: DATA_SOURCES.SAMPLE, label: "Sample data" },
];

function errorMessage(error) {
  if (error?.status === 503) return "The Admin portal is not configured on this server.";
  if (error?.status === 0) return "The server could not be reached. Check your connection and try again.";
  return "Something went wrong while loading the dashboard. Please try again.";
}

/**
 * AdminDashboardPage — management-level e-Pulse dashboard for /admin/dashboard.
 * Built entirely from the Phase 2 design system; data comes from the feature's service layer
 * (live API or clearly labelled sample data). The date range comes from the shell header (useDateRange).
 */
export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { range } = useDateRange();
  const { expire, admin } = useAdminSession();
  const [source, setSource] = useLocalStorage("dms.admin.dashboard.source", DATA_SOURCES.LIVE);

  // "Clear" in the header picker leaves the range empty — fall back to This month instead of an invalid request.
  const effective = range.from && range.to ? range : rangeFromPreset("month");
  const { status, data, error, reload } = useAdminDashboard({ source, from: effective.from, to: effective.to, onUnauthorized: expire });
  const loading = status === "loading";
  const sample = source === DATA_SOURCES.SAMPLE;

  const noSales = !loading && data && !sample && data.kpis.totalSecondarySales.value === 0 && data.distributors.length === 0 && !data.salesTrend.hasData;

  return (
    <div>
      <WelcomeBanner
        name={admin?.name}
        subtitle="Here is how your distributor network is performing."
        actions={[
          { label: "Purchase orders", to: "/admin/purchase-orders", icon: ShoppingCart },
          { label: "Distributors", to: "/admin/distributors", icon: Building2 },
          { label: "Stock", to: "/admin/inventory/current", icon: PackageSearch },
        ]}
      />
      <PageHeader
        title="Admin Dashboard"
        description="Network-wide view of secondary sales, distributors, inventory and expiry risk."
        meta={
          <>
            <Badge tone="brand">{sample ? "Sample period · last 30 days" : formatRange(effective) || "Select dates"}</Badge>
            {!sample && data ? <span className="text-caption text-ink-subtle">compared with {formatRange(data.meta.previousRange)}</span> : null}
          </>
        }
        actions={
          <>
            <Tabs variant="pills" tabs={SOURCE_TABS} value={source} onChange={setSource} />
            <IconButton icon={RefreshCw} label="Refresh dashboard" variant="outline" onClick={reload} disabled={loading} />
          </>
        }
      />

      {sample ? (
        <Alert tone="info" title="Sample data" className="mb-6">
          You are viewing a fixed illustration built from sample data. It does not read your database and ignores the selected date range. Switch to “Live data” to see real figures.
        </Alert>
      ) : (
        <p className="-mt-3 mb-6 max-w-3xl text-caption text-ink-subtle">
          Sales, orders, distributors, categories, top products and stock movement follow the selected dates. Inventory, near-expiry, outstanding, alerts and activity show the current position.
        </p>
      )}

      {noSales ? (
        <Alert tone="info" title="No sales recorded in this period" className="mb-6">
          There are no posted invoices between these dates. Try a wider date range, or switch to “Sample data” to preview the layout.
        </Alert>
      ) : null}

      {status === "error" ? (
        <Card>
          <ErrorState title="Unable to load dashboard data" message={errorMessage(error)} onRetry={reload} retryLabel="Retry" />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* ROW 2 — KPI cards */}
          <KpiSection data={data} loading={loading} />

          {/* ROW 3 — Secondary sales trend + distributor performance */}
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <SalesTrendCard data={data} loading={loading} />
            </div>
            <DistributorPerformanceCard data={data} loading={loading} />
          </div>

          {/* ROW 4 — Product category sales + stock movement */}
          <div className="grid gap-4 lg:grid-cols-2">
            <CategorySalesCard data={data} loading={loading} />
            <StockMovementCard data={data} loading={loading} />
          </div>

          {/* ROW 5 — Near-expiry inventory (the ERP/SAP status card was removed in Phase 2) */}
          <div className="grid gap-4">
            <div className="min-w-0">
              {/* Phase 6: Near Expiry is now a real page — "View Batches" navigates there instead of being disabled/planned. */}
              <NearExpiryCard data={data} loading={loading} onViewBatches={() => navigate("/admin/inventory/near-expiry")} />
            </div>
          </div>

          {/* ROW 6 — Top products + top distributors */}
          <div className="grid gap-4 xl:grid-cols-2">
            <TopProductsCard data={data} loading={loading} />
            <TopDistributorsCard data={data} loading={loading} />
          </div>

          {/* ROW 7 — Recent activity + alerts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ActivityPanel data={data} loading={loading} onRetry={reload} />
            <AlertsPanel data={data} loading={loading} />
          </div>
        </div>
      )}
    </div>
  );
}
