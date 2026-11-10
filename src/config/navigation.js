import { BarChart3, Boxes, FileText, LayoutDashboard, Settings, ShoppingCart, Store, Wallet } from "lucide-react";

/**
 * e-Pulse navigation model (Distributor portal).
 *
 * group : { id, label, icon, to?  (single-link group) | items: [...] }
 * item  : { id, label, to?, status?: "planned" }
 *
 *  - An item WITH `to` is a live, working screen and is routed today.
 *  - An item marked status: "planned" belongs to a later phase: it is shown greyed-out and is not clickable.
 *
 * Phase 2: entries that were removed from the Distributor portal (FEFO Monitor, Masters, Schemes & Claims, Financial View, Vendor Ledger,
 * Secondary Sales, Notifications, Audit Logs) are DELETED from this model — not flagged — so neither the sidebar, global search, breadcrumbs nor
 * the "show planned modules" toggle can bring them back. The matching routes are removed from PrivateApp.jsx (see PHASE02 docs).
 * The Admin portal no longer derives its menu from this file: config/adminNavigation.js is self-contained.
 */
const planned = (id, label) => ({ id, label, status: "planned" });

export const distributorNavigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, to: "/dashboard", end: true },

  {
    id: "sales",
    label: "Sales",
    icon: FileText,
    items: [
      { id: "sales-orders", label: "Sales Orders", to: "/dashboard/salesorder-master" },
      { id: "sales-deliveries", label: "Deliveries", to: "/dashboard/sales/delivery" },
      { id: "sales-invoices", label: "Sales Invoices", to: "/dashboard/sales/invoice" },
      { id: "sales-returns", label: "Sales Returns", to: "/dashboard/sales/return" },
      { id: "credit-notes", label: "Credit Notes", to: "/dashboard/sales/credit" },
      { id: "debit-notes", label: "Debit Notes", to: "/dashboard/sales/debit" },
    ],
  },

  {
    id: "purchase",
    label: "Purchase",
    icon: ShoppingCart,
    items: [
      { id: "purchase-orders", label: "Purchase Orders", to: "/dashboard/purchase/po" },
      { id: "purchase-deliveries", label: "Deliveries", to: "/dashboard/purchase/delivery" },
      { id: "purchase-invoices", label: "Purchase Invoices", to: "/dashboard/purchase/invoice" },
      { id: "purchase-returns", label: "Purchase Returns", to: "/dashboard/purchase/return" },
      { id: "purchase-debit-notes", label: "Debit Notes", to: "/dashboard/purchase/debit" },
    ],
  },

  {
    id: "inventory",
    label: "Inventory",
    icon: Boxes,
    items: [
      { id: "current-stock", label: "Current Stock", to: "/dashboard/inventory/current" },
      { id: "batch-stock", label: "Batch Stock", to: "/dashboard/inventory/batch" },
      { id: "stock-ledger", label: "Stock Ledger", to: "/dashboard/inventory/ledger" },
      { id: "near-expiry", label: "Near Expiry", to: "/dashboard/inventory/near-expiry" },
      { id: "expired-stock", label: "Expired Stock", to: "/dashboard/inventory/expired" },
      // Phase 6: the transfer foundation's one action lives on batch rows (Transfer stock), not a dedicated screen.
      planned("stock-transfer", "Stock Transfer"),
    ],
  },

  // e-Pulse Phase 1: "Retailer Management" is now simply "Customers" (same records, full details — see features/retailers).
  { id: "customers", label: "Customers", icon: Store, to: "/dashboard/customers", detailCrumbs: true },

  {
    id: "accounts",
    label: "Accounts",
    icon: Wallet,
    items: [
      { id: "customer-ledger", label: "Customer Ledger", to: "/dashboard/accounts/CustomerLedger" },
      { id: "payments", label: "Payments", to: "/dashboard/accounts/Payments" },
      { id: "gl-master", label: "GL Master", to: "/dashboard/accounts/GLMaster" },
      { id: "trial-balance", label: "Trial Balance", to: "/dashboard/accounts/TrialBalance" },
      { id: "balance-sheet", label: "Balance Sheet", to: "/dashboard/accounts/BalanceSheet" },
    ],
  },

  // e-Pulse Phase 1: every Reports section is live and VIEW ONLY (backend: GET /api/reports/:section).
  {
    id: "reports",
    label: "Reports",
    icon: BarChart3,
    items: [
      { id: "rpt-sales", label: "Sales", to: "/dashboard/reports/sales" },
      { id: "rpt-stock", label: "Stock", to: "/dashboard/reports/stock" },
      { id: "rpt-expiry", label: "Expiry", to: "/dashboard/reports/expiry" },
      { id: "rpt-distributor", label: "Distributor", to: "/dashboard/reports/distributor" },
      { id: "rpt-customers", label: "Customers", to: "/dashboard/reports/customers" },
      { id: "rpt-scheme", label: "Scheme", to: "/dashboard/reports/scheme" },
      { id: "rpt-returns", label: "Returns", to: "/dashboard/reports/returns" },
      { id: "rpt-outstanding", label: "Outstanding", to: "/dashboard/reports/outstanding" },
      { id: "rpt-sap", label: "SAP Sync", to: "/dashboard/reports/sap-sync" },
    ],
  },

  { id: "settings", label: "Settings", icon: Settings, to: "/dashboard/settings" },
];

export const isLive = (node) => Boolean(node.to) && node.status !== "planned";
export const isPlanned = (node) => !isLive(node);

// Groups/items that should be visible for the current "show planned modules" preference.
export function visibleNavigation(navigation, showPlanned) {
  if (showPlanned) return navigation;
  return navigation
    .map((group) => (group.items ? { ...group, items: group.items.filter(isLive) } : group))
    .filter((group) => (group.items ? group.items.length > 0 : isLive(group)));
}

// Flat list of live pages for global search: [{ id, label, group, to }]
export function flattenLive(navigation) {
  const out = [];
  navigation.forEach((group) => {
    if (isLive(group)) out.push({ id: group.id, label: group.label, group: "", to: group.to });
    (group.items || []).forEach((item) => {
      if (isLive(item)) out.push({ id: item.id, label: item.label, group: group.label, to: item.to });
    });
  });
  return out;
}

// Best (longest-prefix) match of a pathname → { group, item }
export function findNavTrail(navigation, pathname) {
  let best = null;
  const consider = (group, item) => {
    const node = item || group;
    const to = node.to;
    if (!to) return;
    const matches = pathname === to || (!node.end && pathname.startsWith(`${to}/`));
    if (matches && (!best || to.length > best.to.length)) best = { group, item: item || null, to };
  };
  navigation.forEach((group) => {
    if (group.to) consider(group, null);
    (group.items || []).forEach((item) => consider(group, item));
  });
  return best;
}

// Pages that are routed but intentionally not in the sidebar.
export const EXTRA_ROUTE_LABELS = {
  "/dashboard/design-system": { group: "Developer", label: "Design System" },
  "/dashboard/delivery": { group: "Legacy", label: "Delivery (legacy)" },
  "/dashboard/invoice/creation": { group: "Legacy", label: "Invoice creation (legacy)" },
  "/dashboard/invoice/view": { group: "Legacy", label: "Invoice view (legacy)" },
  "/dashboard/logout": { group: "Account", label: "Sign out" },
};
