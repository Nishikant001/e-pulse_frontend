import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, FileText, ShoppingCart, Store, Truck } from "lucide-react";
import { authFetch } from "../../../../utils/authFetch";
import { getStoredUser } from "../../../../utils/session";
import { formatNumber } from "../../../../utils/format";
import Card, { CardBody, CardHeader } from "../../../ui/Card";
import ErrorState from "../../../ui/ErrorState";
import KpiCard from "../../../ui/KpiCard";
import Modal from "../../../ui/Modal";
import PageHeader from "../../../ui/PageHeader";

/**
 * Distributor Dashboard (/dashboard) — migrated to the e-Pulse design system.
 *
 * Data: the SAME four existing, tenant-scoped endpoints as before (/customer/count, /sales-delivery/count,
 * /salesorder/count, /stock/count). The generic ERP demo content (steel/cement/paint stock, demo orders, demo charts,
 * made-up "+12%" trends) has been removed — nothing on this page is invented. Distributor-scoped pharma analytics
 * (secondary sales trend, expiry, outstanding) need new distributor-scoped aggregation endpoints and arrive in later
 * phases; the network-wide equivalent is the Admin dashboard (/admin/dashboard).
 */
// Phase 2: the "Add Customer", "Manage Stock" and "Add Vendor" shortcuts were removed — they pointed at Masters screens that are no longer reachable here.

function Dashboard() {
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [orderChoice, setOrderChoice] = useState(false);
  const user = getStoredUser();

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [customerData, deliveryData, orderData, stockData] = await Promise.all([
        authFetch("/customer/count"),
        authFetch("/sales-delivery/count"),
        authFetch("/salesorder/count"),
        authFetch("/stock/count"),
      ]);
      setCounts({
        customers: customerData.customerCount || 0,
        deliveries: deliveryData.count || 0,
        orders: orderData.orderCount || 0,
        batches: stockData.batchCount || 0,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tile = "group flex items-start gap-3 rounded-card border border-line bg-surface p-4 text-left transition-shadow duration-200 hover:shadow-hover";

  return (
    <div>
      <PageHeader
        title="Distributor Dashboard"
        description={user?.name ? `Overview of ${user.name}${user.distributor_code ? ` (${user.distributor_code})` : ""}` : "Overview of your distribution business"}
      />

      {error ? (
        <Card>
          <ErrorState title="Unable to load dashboard data" message="The figures could not be loaded. Please try again." onRetry={load} retryLabel="Retry" />
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Customers" icon={Store} status="brand" loading={loading} value={counts ? formatNumber(counts.customers) : undefined} comparison="registered" />
            <KpiCard title="Sales Orders" icon={ShoppingCart} status="info" loading={loading} value={counts ? formatNumber(counts.orders) : undefined} comparison="all orders" />
            <KpiCard title="Deliveries" icon={Truck} status="success" loading={loading} value={counts ? formatNumber(counts.deliveries) : undefined} comparison="all deliveries" />
            <KpiCard title="Batches" icon={Boxes} status="warning" loading={loading} value={counts ? formatNumber(counts.batches) : undefined} comparison="batch records" />
          </div>

          <Card>
            <CardHeader title="Quick actions" subtitle="Jump to the most common tasks" />
            <CardBody>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <li>
                  <button type="button" onClick={() => setOrderChoice(true)} className={`${tile} w-full`}>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-700">
                      <ShoppingCart className="size-[1.125rem]" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-body font-medium text-ink">New Order</span>
                      <span className="block text-caption text-ink-subtle">Purchase or sales order</span>
                    </span>
                  </button>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      )}

      <Modal open={orderChoice} onClose={() => setOrderChoice(false)} title="Select order type" description="Choose the type of order you want to create" size="sm">
        <ul className="space-y-3">
          <li>
            <Link to="/dashboard/purchase/po" onClick={() => setOrderChoice(false)} className={tile}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-700">
                <ShoppingCart className="size-[1.125rem]" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-body font-medium text-ink">Purchase Order</span>
                <span className="block text-caption text-ink-subtle">Create a new purchase order</span>
              </span>
            </Link>
          </li>
          <li>
            <Link to="/dashboard/salesorder-master" onClick={() => setOrderChoice(false)} className={tile}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-success-50 text-success-700">
                <FileText className="size-[1.125rem]" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-body font-medium text-ink">Sales Order</span>
                <span className="block text-caption text-ink-subtle">Create a new sales order</span>
              </span>
            </Link>
          </li>
        </ul>
      </Modal>
    </div>
  );
}

export default Dashboard;
