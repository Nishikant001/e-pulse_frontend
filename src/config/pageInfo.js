/**
 * Page help text — what each screen is for, shown in the header's (i) icon (hover / focus / tap).
 * Keys are route paths. A path with a trailing "/*" also covers its sub-pages (/new, /:id, /:id/edit).
 * Purely descriptive: nothing here affects routing or behaviour.
 */
const D = "/dashboard";
const A = "/admin";

export const PAGE_INFO = {
  // ── Distributor portal ────────────────────────────────────────────────
  [D]: "Your business at a glance: customers, sales orders, deliveries and batches. Use the quick actions to start a new order.",
  [`${D}/purchase/po`]: "Purchase Orders — order stock from a vendor. The first step of the purchase cycle: PO → Delivery (goods receipt) → Invoice.",
  [`${D}/purchase/delivery`]: "Purchase Deliveries — record goods received against a PO with batch and expiry. This is what adds stock to your inventory.",
  [`${D}/purchase/invoice`]: "Purchase Invoices — vendor bills created from received deliveries; they update what you owe the vendor.",
  [`${D}/purchase/return`]: "Purchase Returns — send damaged/expired stock back to a vendor; stock reduces accordingly.",
  [`${D}/purchase/debit`]: "Purchase Debit Notes — claim an amount from a vendor for returns or price differences.",
  [`${D}/salesorder-master`]: "Sales Orders — orders from your customers. Order → Delivery → Invoice. Stock is allocated batch-wise (earliest expiry first).",
  [`${D}/sales/delivery`]: "Sales Deliveries — dispatch goods for confirmed orders. Stock is reduced from the allocated batches.",
  [`${D}/sales/invoice`]: "Sales Invoices — tax invoices raised to customers from deliveries. Track what each customer owes.",
  [`${D}/sales/return`]: "Sales Returns — customer returns (expiry/damage). Returned stock is put back and a credit note can be issued.",
  [`${D}/sales/credit`]: "Credit Notes — reduce what a customer owes (returns, discounts, corrections).",
  [`${D}/sales/debit`]: "Sales Debit Notes — add an extra charge to a customer's account.",
  [`${D}/inventory/current`]: "Current Stock — quantity on hand per product across all batches.",
  [`${D}/inventory/batch`]: "Batch Stock — stock per batch with expiry, so you always know what is sellable.",
  [`${D}/inventory/ledger`]: "Stock Ledger — every stock movement (in, out, returns, transfers) with its source document.",
  [`${D}/inventory/near-expiry`]: "Near Expiry — batches that will expire soon. Sell or return them first.",
  [`${D}/inventory/expired`]: "Expired Stock — batches already expired. These cannot be sold; plan returns or write-off.",
  [`${D}/customers/*`]: "Customers — the pharmacies, hospitals and clinics you serve, with contact, GSTIN, address and status.",
  [`${D}/accounts/GLMaster`]: "GL Master — chart of accounts used for accounting postings.",
  [`${D}/accounts/CustomerLedger`]: "Customer Ledger — statement of each customer's invoices, returns and payments.",
  [`${D}/accounts/Payments`]: "Payments — record money received from customers against invoices.",
  [`${D}/accounts/TrialBalance`]: "Trial Balance — total debits and credits per account; they must match.",
  [`${D}/accounts/BalanceSheet`]: "Balance Sheet — assets, liabilities and equity at a point in time.",

  // ── Admin portal ──────────────────────────────────────────────────────
  [`${A}/dashboard`]: "Head-office view across all distributors: sales trend, top products and distributors, stock, near-expiry risk, alerts and integration health.",
  [`${A}/super-admin`]: "Admins & Users — every admin account, how many distributors each created, and network totals. Visible to Super Admins only.",
  [`${A}/super-admin/roles`]: "Roles & Permissions — what each kind of admin account can see and change. Sample data.",
  [`${A}/super-admin/distributors`]: "All Distributors — every distributor on the platform, with the admin who manages it. Sample data.",
  [`${A}/super-admin/onboarding`]: "Onboarding Requests — distributors waiting for approval to join the platform. Sample data.",
  [`${A}/super-admin/billing`]: "Plans & Billing — subscription plans and the invoices raised to distributors. Sample data.",
  [`${A}/super-admin/audit-logs`]: "Audit Logs — who did what, when and from where. Sample data.",
  [`${A}/super-admin/announcements`]: "Announcements — broadcast maintenance windows and news to admins and distributors. Sample data.",
  [`${A}/super-admin/settings`]: "Platform Settings — general, security and notification settings for the whole platform. Sample data.",
  [`${A}/sales/orders/*`]: "Sales Orders across distributors. Create or review orders on behalf of a distributor and confirm/cancel them.",
  [`${A}/sales/invoices`]: "Sales Invoices across distributors — review, post or cancel.",
  [`${A}/inventory/current`]: "Current Stock across all distributors (read-only).",
  [`${A}/inventory/batch`]: "Batch Stock across all distributors with expiry and status.",
  [`${A}/inventory/ledger`]: "Stock Ledger — all stock movements across distributors.",
  [`${A}/inventory/fefo`]: "FEFO Monitor — next batches to be picked, across distributors.",
  [`${A}/inventory/near-expiry`]: "Near Expiry stock across distributors, bucketed by days to expiry.",
  [`${A}/inventory/expired`]: "Expired stock across distributors.",
  [`${A}/masters/products/*`]: "Product Master (company level). Admin adds products first; distributors then use them. Deactivating a product stops new use.",
  [`${A}/masters/batches/*`]: "Batch Master — batches with manufacturing/expiry dates per product and distributor.",
  [`${A}/masters/customers/*`]: "Customer Master — customer records (retailers) across all distributors, with GSTIN, address and status. Only an administrator can move a customer to another distributor.",
  [`${A}/masters/pricing`]: "Pricing Master — selling prices per product (and distributor/group). Orders take their rate from here.",
  [`${A}/masters/customer-groups`]: "Customer Group Master — customer groups (e.g. RETAIL, WHOLESALE) across all distributors. Pricing is set per product and customer group.",
  [`${A}/masters/taxes`]: "Tax Master — HSN codes and GST rates applied on invoices.",
  [`${A}/masters/schemes/*`]: "Scheme Master — discount/free-goods schemes that apply to orders automatically while active.",
  [`${A}/distributors/*`]: "Distributor Management — create distributors, edit their profile, and activate/deactivate them. An inactive distributor cannot sign in or create orders; their history is kept.",
  [`${A}/claims/*`]: "Claims raised by distributors — review, approve or reject.",
  [`${A}/accounts`]: "Accounts overview — receivables, collections and credit exposure across distributors.",
  [`${A}/accounts/outstanding`]: "Outstanding invoices per distributor.",
  [`${A}/accounts/ageing`]: "Ageing of outstanding amounts across distributors.",
  [`${A}/accounts/ledger`]: "Ledger statement of any distributor.",
  [`${A}/accounts/payments`]: "Payments recorded against invoices.",
  [`${A}/accounts/credit`]: "Credit limits per distributor and how much is used.",
};

/** Exact match first, then the longest "/*" prefix. Returns a string or null. */
export function getPageInfo(pathname) {
  const p = (pathname || "").replace(/\/+$/, "") || "/";
  if (PAGE_INFO[p]) return PAGE_INFO[p];
  let best = null;
  Object.keys(PAGE_INFO).forEach((k) => {
    if (!k.endsWith("/*")) return;
    const base = k.slice(0, -2);
    if ((p === base || p.startsWith(`${base}/`)) && (!best || base.length > best.length)) best = base + "/*";
  });
  return best ? PAGE_INFO[best] : null;
}
