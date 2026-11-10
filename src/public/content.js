// Marketing copy — every claim here is traceable to the codebase / Phase 1–22 documents (see PHASE23_PUBLIC_WEBSITE_REPORT.md, "claims register").
// Status vocabulary (always shown as text, never colour alone):
//   available     — implemented and covered by automated tests
//   available-erp — implemented, but never verified against a live ERP
//   planned       — shown in navigation as planned; NOT available
export const STATUS = {
  available: { label: "Available", hint: "Implemented in the application." },
  "available-erp": { label: "Available · live ERP not verified", hint: "Implemented and tested with simulated ERP responses; not yet verified against a real ERP system." },
  planned: { label: "Planned", hint: "On the roadmap; not available yet." },
};

export const MODULES = [
  { id: "inventory", icon: "Boxes", name: "Inventory & batches", status: "available", portals: "Distributor · Admin",
    summary: "Stock is derived from a movement ledger. View current stock, batch-wise balances, the stock ledger and manual adjustments (damage, expiry, count correction, opening stock).",
    points: ["Current stock and batch stock views", "Append-only stock ledger", "Manual stock adjustments with reasons", "Reorder level on products"] },
  { id: "expiry", icon: "CalendarClock", name: "FEFO & expiry management", status: "available", portals: "Distributor · Admin",
    summary: "First-Expiry-First-Out allocation when stock is delivered, plus dedicated near-expiry and expired-stock screens.",
    points: ["FEFO monitor", "Near-expiry list", "Expired stock list", "Batch life remaining"] },
  { id: "sales", icon: "ReceiptText", name: "Sales", status: "available", portals: "Distributor · Admin",
    summary: "Sales orders flow into deliveries and invoices. Credit and debit notes and sales returns are linked back to the original documents.",
    points: ["Sales orders (draft → confirmed → delivered)", "Deliveries with FEFO stock-out", "Tax-aware sales invoices", "Credit notes, debit notes, sales returns"] },
  { id: "purchasing", icon: "ShoppingCart", name: "Purchasing", status: "available", portals: "Distributor",
    summary: "Purchase orders, goods receipt that creates batches and stock-in, purchase invoices, returns and debit notes.",
    points: ["Purchase orders", "Delivery / goods receipt with batch creation", "Purchase invoices", "Purchase returns and debit notes"] },
  { id: "accounts", icon: "Landmark", name: "Accounts & finance", status: "available", portals: "Distributor · Admin",
    summary: "Chart of accounts, journal-based ledgers, trial balance and balance sheet for the Distributor; outstanding, ageing, ledger, payments and credit views for Admin.",
    points: ["GL master, customer and vendor ledgers", "Trial balance and balance sheet", "Receipts and payments", "Outstanding, ageing and credit (Admin)"] },
  { id: "masters", icon: "Database", name: "Product, pricing & tax masters", status: "available", portals: "Distributor · Admin",
    summary: "Products with drug-licence and manufacturer fields, HSN-based GST, item groups and pricing by product and customer group.",
    points: ["Product and batch masters (Admin)", "HSN / GST master", "Pricing master", "Item, customer and vendor groups"] },
  { id: "retailers", icon: "Store", name: "Retailer management", status: "available", portals: "Distributor · Admin",
    summary: "Maintain retailer (customer) records and view them per Distributor. Retailers are master-data records, not application users.",
    points: ["Retailer list, detail and forms", "Per-Distributor isolation", "Customer groups"] },
  { id: "schemes", icon: "Percent", name: "Schemes & claims", status: "available", portals: "Admin (claims also Distributor)",
    summary: "Scheme master with an application engine, and claim creation and review.",
    points: ["Scheme master and detail views", "Claims list, detail and review", "Distributor claim submission"] },
  { id: "admin", icon: "ShieldCheck", name: "Admin portal & distributors", status: "available", portals: "Admin",
    summary: "A separate head-office portal with its own sign-in: dashboard, distributor onboarding and detail, secondary-sales view and cross-distributor oversight.",
    points: ["Admin dashboard", "Distributor management", "Secondary sales view", "Separate session from the Distributor portal"] },
  { id: "erp", icon: "Link2", name: "ERP / SAP integration", status: "available-erp", portals: "Admin",
    summary: "Connection management, scheduled and manual sync jobs, sync history, error monitor and an audit log, with role-based permissions specific to ERP functions. The application also runs fully standalone without any ERP.",
    points: ["Connection settings and test", "Sync history and error monitor", "ERP audit log (immutable)", "Invoice, return and document sync are not available yet"] },
  { id: "reports", icon: "BarChart3", name: "Advanced reporting & notifications", status: "planned", portals: "—",
    summary: "Dedicated sales, scheme, expiry and coverage report packs and in-app notifications are listed as planned in the product navigation.",
    points: ["Not available yet"] },
];

export const FEATURES = [
  { icon: "Layers", title: "Batch-wise stock, always traceable", text: "Every movement is recorded in a stock ledger; current and batch balances are derived from it, so a figure can be traced to the documents behind it.", to: "/modules#inventory" },
  { icon: "CalendarClock", title: "Expiry-aware by design", text: "FEFO allocation on delivery, with near-expiry and expired-stock screens to act before stock is lost.", to: "/modules#expiry" },
  { icon: "Workflow", title: "Order-to-cash and procure-to-pay", text: "Orders, deliveries, invoices, credit/debit notes and returns — with over-return protection on returns.", to: "/solutions#order-to-cash" },
  { icon: "Calculator", title: "GST-aware documents", text: "HSN-based tax rates on documents and journal postings for receivables, sales and output tax.", to: "/modules#accounts" },
  { icon: "UsersRound", title: "Two portals, separate sign-ins", text: "A Distributor portal for day-to-day operations and an Admin portal for head-office oversight. A Distributor sign-in never grants Admin access.", to: "/about#portals" },
  { icon: "Lock", title: "Distributor data isolation", text: "Distributor routes are scoped to the signed-in Distributor and covered by cross-tenant automated tests.", to: "/faq#security" },
  { icon: "Link2", title: "Optional ERP integration", text: "Connections, sync jobs, error monitoring and audit. Verified with simulated ERP responses; live-ERP verification is still pending.", to: "/modules#erp" },
  { icon: "Gauge", title: "Operational safeguards", text: "Request rate limits, request-size limits, correlation IDs on every request and a health endpoint for load balancers.", to: "/faq#security" },
];

export const WORKFLOW = [
  { icon: "UsersRound", title: "Distributor onboarded", who: "Admin portal", text: "Head office adds the distributor in the Admin portal. The distributor gets its own sign-in, and its data stays scoped to it." },
  { icon: "Database", title: "Product and pricing masters", who: "Admin portal", text: "Products with licence and manufacturer fields, HSN-based GST, item groups and pricing by product and customer group are set up once." },
  { icon: "ShoppingCart", title: "Purchase and stock in", who: "Distributor portal", text: "Raise a purchase order and receive goods against it. Receiving creates batches with manufacturing and expiry dates and posts stock-in to the ledger." },
  { icon: "ReceiptText", title: "Sales and invoicing", who: "Distributor portal", text: "Confirm a sales order, deliver it with first-expiry-first-out allocation, then invoice with GST. Returns and credit notes link back to the original." },
  { icon: "BookOpenCheck", title: "Payments and reports", who: "Distributor and Admin portals", text: "Record receipts and payments. Ledgers, trial balance, balance sheet, outstanding and ageing show where the business stands." },
];

export const SOLUTIONS = [
  { id: "stock-control", icon: "Boxes", title: "Batch-level stock control", who: "Warehouse and inventory teams",
    text: "See what is on hand by product and batch, trace each movement in the stock ledger and correct differences with a recorded adjustment.",
    steps: ["Receive goods against a purchase order", "Review current and batch stock", "Post a reasoned adjustment after a physical count"], to: "/modules#inventory" },
  { id: "expiry", icon: "CalendarClock", title: "Expiry risk management", who: "Inventory and quality teams",
    text: "Find batches approaching expiry and already expired, and dispatch the earliest-expiring stock first.",
    steps: ["Open the near-expiry list", "Check the FEFO monitor", "Review expired stock for adjustment or return"], to: "/modules#expiry" },
  { id: "order-to-cash", icon: "ReceiptText", title: "Order-to-cash", who: "Sales and billing teams",
    text: "Take an order, deliver from the earliest-expiring batches, invoice with the correct GST and follow the receivable to payment.",
    steps: ["Create and confirm a sales order", "Deliver (FEFO) and invoice", "Record credit/debit notes and returns when needed"], to: "/modules#sales" },
  { id: "procure-to-pay", icon: "ShoppingCart", title: "Procure-to-pay", who: "Purchasing and accounts teams",
    text: "Order from suppliers, receive into batches, post the purchase invoice and handle purchase returns and debit notes.",
    steps: ["Raise a purchase order", "Receive goods and create batches", "Post the purchase invoice and settle"], to: "/modules#purchasing" },
  { id: "oversight", icon: "ShieldCheck", title: "Head-office oversight", who: "Admin users",
    text: "Onboard distributors and review dashboards, secondary sales, claims, schemes and finance views across distributors.",
    steps: ["Sign in to the Admin portal", "Review distributors and secondary sales", "Review claims and outstanding / ageing"], to: "/modules#admin" },
  { id: "erp", icon: "Link2", title: "ERP-connected operation", who: "Admin and IT teams",
    text: "Where an ERP is in use, configure a connection and monitor sync jobs and errors. Without an ERP the application works standalone.",
    steps: ["Configure and test a connection", "Run or schedule syncs", "Monitor history, errors and the audit log"], to: "/modules#erp" },
];

export const FAQS = [
  { id: "what", q: "What is e-Pulse?", a: "e-Pulse is a web application for pharmaceutical distributors. It manages batch-wise inventory and expiry, sales and purchase documents, returns, accounts and head-office oversight, with an optional ERP integration layer." },
  { id: "portals", q: "Who can sign in, and what are the portals?", a: "There are two portals with separate sign-ins: a Distributor portal for day-to-day operations and an Admin portal for head-office oversight. A Distributor sign-in does not grant access to the Admin portal. There is no separate retailer portal; retailers are master-data records." },
  { id: "batch", q: "How does batch and expiry handling work?", a: "Goods receipt creates batches with manufacturing and expiry dates. Stock is derived from a movement ledger, so balances can be viewed by product and batch. Near-expiry and expired-stock screens help you act early." },
  { id: "fefo", q: "What is FEFO?", a: "First-Expiry-First-Out. When stock is delivered against a sales order, batches that expire earliest are allocated first." },
  { id: "erp", q: "Does it integrate with SAP or other ERPs?", a: "An ERP integration module is implemented — connections, sync jobs, history, error monitor and audit log — and has been tested against simulated ERP responses. It has not yet been verified against a live ERP system, and invoice, return and document sync are not available yet. Support for Oracle, Dynamics and SOAP is not provided. The application runs fully standalone without an ERP." },
  { id: "security", q: "How is data protected?", a: "Sessions use httpOnly cookies; Distributor data is scoped to the signed-in Distributor and covered by cross-tenant tests; the Admin portal uses its own signing secret and fails closed if it is not configured; sign-in and sensitive endpoints are rate limited; error responses do not expose stack traces or SQL. No security review or certification is claimed on this page." },
  { id: "gst", q: "Does it support GST?", a: "Documents use HSN-based GST rates, with CGST/SGST versus IGST handling and rounding. Tax configuration should be reviewed against your own compliance requirements." },
  { id: "demo", q: "How do I get access or a demo?", a: "Use the Contact page to send an enquiry, or sign in if you already have an account." },
];

export const NAV_LINKS = ["/features", "/modules", "/solutions", "/about", "/faq", "/contact"];
