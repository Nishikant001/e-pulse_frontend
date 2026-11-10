import { BarChart3, Boxes, Building2, Database, FileText, LayoutDashboard, Percent, Settings, ShieldCheck, ShoppingCart, Wallet } from "lucide-react";

/**
 * Admin portal navigation (/admin/*).
 *
 * Phase 2: this file is SELF-CONTAINED. It used to be derived from the Distributor model (config/navigation.js), so removing an item for one portal
 * silently changed the other. Every Admin entry is now declared here, and entries removed in Phase 2 are DELETED (not flagged "planned"), so the
 * "show planned modules" toggle, global search and breadcrumbs cannot bring them back:
 *   - Sales creation entry points, Secondary Sales, Retailer Management group, ERP Integration group
 *   - planned Distributor/Retailer Master, Pharmacy/Hospital/Doctor-Clinic/License, Performance/Credit Limit/Outstanding,
 *     Active Schemes/Scheme Calculation/Claim Settlement/Claim Credit Notes, Notifications, Audit Logs, Distributor/Retailer/Secondary/SAP Sync reports
 * Items with `to` are live and routed; items with status "planned" are muted placeholders that have no route.
 * "Customer Master" is the former Retailer List (the Customer table is the only source of retailer records) served at /admin/masters/customers.
 */
const planned = (id, label) => ({ id, label, status: "planned" });

export const adminNavigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/admin/dashboard", end: true },
  // Super Admin overview (UX gate only — the API enforces SUPER_ADMIN on every request): admins, their distributors, network totals.
  { id: "super-admin", label: "Super Admin", icon: ShieldCheck, to: "/admin/super-admin", requiresRole: "SUPER_ADMIN" },

  // e-Pulse Phase 1: purchase orders the distributors create (read only, no vendor involved).
  { id: "purchase-orders", label: "Purchase Orders", icon: ShoppingCart, to: "/admin/purchase-orders", detailCrumbs: true },

  {
    id: "sales", label: "Sales", icon: FileText,
    items: [
      { id: "sales-orders", label: "Sales Orders", to: "/admin/sales/orders" },
      { id: "sales-invoices", label: "Sales Invoices", to: "/admin/sales/invoices" },
      // No Admin page or API exists for these (returns/credit notes live in the Distributor portal) — kept as placeholders, never shown as working.
      planned("sales-returns", "Sales Returns"),
      planned("credit-notes", "Credit Notes"),
    ],
  },

  {
    id: "inventory", label: "Inventory", icon: Boxes,
    items: [
      { id: "current-stock", label: "Current Stock", to: "/admin/inventory/current" },
      { id: "batch-stock", label: "Batch Stock", to: "/admin/inventory/batch" },
      { id: "stock-ledger", label: "Stock Ledger", to: "/admin/inventory/ledger" },
      { id: "near-expiry", label: "Near Expiry", to: "/admin/inventory/near-expiry" },
      { id: "expired-stock", label: "Expired Stock", to: "/admin/inventory/expired" },
      planned("stock-transfer", "Stock Transfer"),
      { id: "fefo-monitor", label: "FEFO Monitor", to: "/admin/inventory/fefo" },
    ],
  },

  {
    id: "masters", label: "Masters", icon: Database,
    items: [
      { id: "product-master", label: "Product Master", to: "/admin/masters/products" },
      { id: "batch-master", label: "Batch Master", to: "/admin/masters/batches" },
      // Phase 2: the former Retailer List, relabelled. Same Customer records and /api/admin/retailers API.
      { id: "customer-master", label: "Customer Master", to: "/admin/masters/customers", detailCrumbs: true },
      { id: "customer-group-master", label: "Customer Group Master", to: "/admin/masters/customer-groups" },
      { id: "pricing-master", label: "Pricing Master", to: "/admin/masters/pricing" },
      { id: "scheme-master", label: "Scheme Master", to: "/admin/masters/schemes", detailCrumbs: true },
      { id: "tax-master", label: "Tax Master", to: "/admin/masters/taxes" },
    ],
  },

  {
    id: "distributor-management", label: "Distributor Management", icon: Building2,
    items: [
      { id: "distributor-list", label: "Distributor List", to: "/admin/distributors", detailCrumbs: true },
      planned("distributor-ledger", "Ledger"),
    ],
  },

  {
    id: "schemes-claims", label: "Schemes & Claims", icon: Percent,
    items: [{ id: "claims", label: "Claims", to: "/admin/claims", detailCrumbs: true }],
  },

  // Accounts & Financial Management (Phase 12). Shared pages (features/accounts) are intentionally unchanged in Phase 2.
  {
    id: "accounts", label: "Accounts", icon: Wallet,
    items: [
      { id: "accounts-overview", label: "Overview", to: "/admin/accounts", end: true },
      { id: "accounts-outstanding", label: "Outstanding", to: "/admin/accounts/outstanding" },
      { id: "accounts-ageing", label: "Ageing", to: "/admin/accounts/ageing" },
      { id: "accounts-ledger", label: "Ledger", to: "/admin/accounts/ledger" },
      { id: "accounts-payments", label: "Payments", to: "/admin/accounts/payments" },
      { id: "accounts-credit", label: "Credit Limits", to: "/admin/accounts/credit" },
    ],
  },

  {
    id: "reports", label: "Reports", icon: BarChart3,
    items: [
      planned("rpt-sales", "Sales"), planned("rpt-stock", "Stock"), planned("rpt-expiry", "Expiry"),
      planned("rpt-scheme", "Scheme"), planned("rpt-returns", "Returns"), planned("rpt-outstanding", "Outstanding"),
    ],
  },

  { id: "settings", label: "Settings", icon: Settings, status: "planned" },
];

/**
 * UX only — hides navigation entries whose `requires` permission the account lacks (ERP entries today). A group left with no entries disappears.
 * Entries without `requires` (every non-ERP module) are untouched, so unrelated Admin modules never change. Backend authorization stays mandatory.
 */
export function filterAdminNavigation(navigation, admin) {
  const have = Array.isArray(admin?.erpPermissions) ? admin.erpPermissions : [];
  const allowed = (item) => !item.requires || [].concat(item.requires).some((p) => have.includes(p));
  const role = String(admin?.role || "").toUpperCase();
  return navigation.filter((g) => !g.requiresRole || g.requiresRole === role).flatMap((group) => {
    if (!group.items) return [group];
    const items = group.items.filter(allowed);
    const hadLive = group.items.some((i) => i.requires);
    if (hadLive && !items.some((i) => i.requires)) return []; // the whole ERP group: nothing usable → hide it (planned placeholders alone are not a reason to show it)
    return [{ ...group, items }];
  });
}
