// Phase 23: the authenticated application and its login pages, moved verbatim out of App.jsx so they load as one lazy chunk.
// Route paths, guards and components are unchanged.
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import LoadingState from "./components/ui/LoadingState";
const SalesInvoicesPage = lazy(() => import("./features/adminSales/invoices/SalesInvoicesPage"));
const SalesOrdersPage = lazy(() => import("./features/adminSales/orders/SalesOrdersPage"));
const CurrentStockPage = lazy(() => import("./features/inventory/pages/CurrentStockPage"));
const BatchStockPage = lazy(() => import("./features/inventory/pages/BatchStockPage"));
const StockLedgerPage = lazy(() => import("./features/inventory/pages/StockLedgerPage"));
const FefoMonitorPage = lazy(() => import("./features/inventory/pages/FefoMonitorPage"));
const NearExpiryPage = lazy(() => import("./features/inventory/pages/NearExpiryPage"));
const ExpiredStockPage = lazy(() => import("./features/inventory/pages/ExpiredStockPage"));
import AdminGuard from "./features/adminAuth/AdminGuard";
import AdminLoginPage from "./features/adminAuth/AdminLoginPage";
import AdminNotFound from "./features/adminAuth/AdminNotFound";
import AdminHomeRoute from "./features/superAdmin/AdminHomeRoute";
import RequireSuperAdmin from "./features/superAdmin/RequireSuperAdmin";
import AdminSessionRoot from "./features/adminAuth/AdminSessionRoot";
import DistributorNotFound from "./components/Distributers/dashboard/DistributorNotFound";
const ProductsPage = lazy(() => import("./features/adminMasters/pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("./features/adminMasters/pages/ProductDetailPage"));
const BatchesPage = lazy(() => import("./features/adminMasters/pages/BatchesPage"));
const BatchDetailPage = lazy(() => import("./features/adminMasters/pages/BatchDetailPage"));
const PricingPage = lazy(() => import("./features/adminMasters/pages/PricingPage"));
const TaxesPage = lazy(() => import("./features/adminMasters/pages/TaxesPage"));
const CustomerGroupsPage = lazy(() => import("./features/adminMasters/pages/CustomerGroupsPage"));
const SuperAdminDashboardPage = lazy(() => import("./features/superAdmin/pages/SuperAdminDashboardPage"));
const RolesPermissionsPage = lazy(() => import("./features/superAdmin/pages/RolesPermissionsPage"));
const NetworkDistributorsPage = lazy(() => import("./features/superAdmin/pages/NetworkDistributorsPage"));
const OnboardingRequestsPage = lazy(() => import("./features/superAdmin/pages/OnboardingRequestsPage"));
const PlansBillingPage = lazy(() => import("./features/superAdmin/pages/PlansBillingPage"));
const AuditLogsPage = lazy(() => import("./features/superAdmin/pages/AuditLogsPage"));
const AnnouncementsPage = lazy(() => import("./features/superAdmin/pages/AnnouncementsPage"));
const PlatformSettingsPage = lazy(() => import("./features/superAdmin/pages/PlatformSettingsPage"));
const DistributorsPage = lazy(() => import("./features/adminDistributors/pages/DistributorsPage"));
const DistributorFormPage = lazy(() => import("./features/adminDistributors/pages/DistributorFormPage"));
const DistributorDetailPage = lazy(() => import("./features/adminDistributors/pages/DistributorDetailPage"));
const AdminPurchaseOrdersPage = lazy(() => import("./features/adminPurchaseOrders/pages/AdminPurchaseOrdersPage"));
const AdminPurchaseOrderDetailPage = lazy(() => import("./features/adminPurchaseOrders/pages/AdminPurchaseOrderDetailPage"));
const DistributorReportPage = lazy(() => import("./features/reports/pages/DistributorReportPage"));
const DistributorSettingsPage = lazy(() => import("./features/settings/pages/DistributorSettingsPage"));
const RetailersPage = lazy(() => import("./features/retailers/pages/RetailersPage"));
const RetailerFormPage = lazy(() => import("./features/retailers/pages/RetailerFormPage"));
const RetailerDetailPage = lazy(() => import("./features/retailers/pages/RetailerDetailPage"));
const SchemesPage = lazy(() => import("./features/schemes/pages/SchemesPage"));
const SchemeFormPage = lazy(() => import("./features/schemes/pages/SchemeFormPage"));
const SchemeDetailPage = lazy(() => import("./features/schemes/pages/SchemeDetailPage"));
const ClaimsPage = lazy(() => import("./features/claims/pages/ClaimsPage"));
const ClaimDetailPage = lazy(() => import("./features/claims/pages/ClaimDetailPage"));
const AccountsDashboardPage = lazy(() => import("./features/accounts/pages/AccountsDashboardPage"));
const OutstandingPage = lazy(() => import("./features/accounts/pages/OutstandingPage"));
const AgeingPage = lazy(() => import("./features/accounts/pages/AgeingPage"));
const LedgerPage = lazy(() => import("./features/accounts/pages/LedgerPage"));
const PaymentsPage = lazy(() => import("./features/accounts/pages/PaymentsPage"));
const CreditPage = lazy(() => import("./features/accounts/pages/CreditPage"));
import Signup from "./components/Distributers/credential/Signup";
import Login from "./components/Distributers/credential/Login";
import DashboardLayout from "./components/Distributers/dashboard/DashboardLayout";
// e-Pulse Phase 1: Retailer Management became Customers. Old /dashboard/retailers/... bookmarks keep working.
function RetailersRedirect() {
  const { "*": rest } = useParams();
  return <Navigate to={`/dashboard/customers${rest ? `/${rest}` : ""}`} replace />;
}
const Dashboard = lazy(() => import("./components/Distributers/dashboard/pages/Dashboard"));
const SalesOrderMaster = lazy(() => import("./components/Distributers/dashboard/pages/SalesOrderMaster"));
const Delivery = lazy(() => import("./components/Distributers/dashboard/pages/Delivery"));
const Invoice = lazy(() => import("./components/Distributers/dashboard/pages/Invoice"));
const Logout = lazy(() => import("./components/Distributers/dashboard/pages/Logout"));
const Viewinvoice = lazy(() => import("./components/Distributers/dashboard/pages/Viewinvoice"));
const DeliveryPage = lazy(() => import("./components/Distributers/dashboard/pages/delivery/sodelivery/DeliveryPage"));
const InvoicePage = lazy(() => import("./components/Distributers/dashboard/pages/invoice/soinvoice/InvoicePage"));
const CreditNotePage = lazy(() => import("./components/Distributers/dashboard/pages/creditnotes/socredit/CreditNotePage"));
const DebitNotePage = lazy(() => import("./components/Distributers/dashboard/pages/debitnotes/sodebit/DebitNotePage"));
const SalesReturnPage = lazy(() => import("./components/Distributers/dashboard/pages/returns/salesreturn/SalesReturnPage"));
const PurchaseReturnPage = lazy(() => import("./components/Distributers/dashboard/pages/returns/purchasereturn/PurchaseReturnPage"));
const PurchaseDebitNotePage = lazy(() => import("./components/Distributers/dashboard/pages/debitnotes/podebit/PurchaseDebitNotePage"));
const Po = lazy(() => import("./components/Distributers/dashboard/pages/Po"));
const PODeliveryManagement = lazy(() => import("./components/Distributers/dashboard/pages/delivery/podelivery/Podel"));
const PurchaseInvoiceSystem = lazy(() => import("./components/Distributers/dashboard/pages/invoice/poinvoice/Poinvoice"));
import ForgotPassword from "./components/Distributers/credential/ForgotPassword";
import ResetPassword from "./components/Distributers/credential/ResetPassword";
import ProtectedRoute from "./routes/ProtectedRoute";

// Design-system showcase: loaded only in development builds (see the DEV-only route below).
const DesignSystemPage = lazy(() => import("./pages/DesignSystemPage"));
const GLMaster = lazy(() => import("./components/Distributers/dashboard/accounts/GLMaster"));
const CustomerLedger = lazy(() => import("./components/Distributers/dashboard/accounts/CustomerLedger"));
const BalanceSheet = lazy(() => import("./components/Distributers/dashboard/accounts/BalanceSheet"));
const TrialBalance = lazy(() => import("./components/Distributers/dashboard/accounts/TrialBalance"));
const UnifiedPaymentManagement = lazy(() => import("./components/Distributers/dashboard/accounts/Payments"));
const CurrentStock = lazy(() => import("./components/Distributers/dashboard/pages/InventoryStock/CurrentStock"));
const BatchStock = lazy(() => import("./components/Distributers/dashboard/pages/InventoryStock/BatchStock"));
const StockLedger = lazy(() => import("./components/Distributers/dashboard/pages/InventoryStock/StockLedger"));
const NearExpiry = lazy(() => import("./components/Distributers/dashboard/pages/InventoryStock/NearExpiry"));
const ExpiredStock = lazy(() => import("./components/Distributers/dashboard/pages/InventoryStock/ExpiredStock"));



function PrivateApp() {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />

        {/* Admin portal (Phase 3) — its own identity and session; a Distributor login never grants access */}
        <Route path="/admin" element={<AdminSessionRoot />}>
          <Route path="login" element={<AdminLoginPage />} />
          <Route element={<AdminGuard />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminHomeRoute />} />
            {/* Super Admin portal screens (role-gated in the UI; the API enforces SUPER_ADMIN). Only "Admins & Users" is live — the rest are sample-data previews. */}
            <Route path="super-admin" element={<RequireSuperAdmin />}>
              <Route index element={<SuperAdminDashboardPage />} />
              <Route path="roles" element={<RolesPermissionsPage />} />
              <Route path="distributors" element={<NetworkDistributorsPage />} />
              <Route path="onboarding" element={<OnboardingRequestsPage />} />
              <Route path="billing" element={<PlansBillingPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
              <Route path="settings" element={<PlatformSettingsPage />} />
            </Route>
            {/* e-Pulse Phase 1: Purchase Orders created by distributors — read only. */}
            <Route path="purchase-orders" element={<AdminPurchaseOrdersPage />} />
            <Route path="purchase-orders/:id" element={<AdminPurchaseOrderDetailPage />} />
            <Route path="sales/orders" element={<SalesOrdersPage />} />
            <Route path="sales/invoices" element={<SalesInvoicesPage />} />
            <Route path="inventory" element={<Navigate to="/admin/inventory/current" replace />} />
            <Route path="inventory/current" element={<CurrentStockPage portal="admin" />} />
            <Route path="inventory/batch" element={<BatchStockPage portal="admin" />} />
            <Route path="inventory/ledger" element={<StockLedgerPage portal="admin" />} />
            <Route path="inventory/fefo" element={<FefoMonitorPage portal="admin" />} />
            <Route path="inventory/near-expiry" element={<NearExpiryPage portal="admin" />} />
            <Route path="inventory/expired" element={<ExpiredStockPage portal="admin" />} />
            <Route path="masters/products" element={<ProductsPage />} />
            <Route path="masters/products/:id" element={<ProductDetailPage />} />
            <Route path="masters/batches" element={<BatchesPage />} />
            <Route path="masters/batches/:id" element={<BatchDetailPage />} />
            <Route path="masters/pricing" element={<PricingPage />} />
            <Route path="masters/taxes" element={<TaxesPage />} />
            <Route path="masters/customer-groups" element={<CustomerGroupsPage />} />
            <Route path="masters/schemes" element={<SchemesPage />} />
            <Route path="masters/schemes/new" element={<SchemeFormPage />} />
            <Route path="masters/schemes/:id" element={<SchemeDetailPage />} />
            <Route path="masters/schemes/:id/edit" element={<SchemeFormPage />} />
            <Route path="distributors" element={<DistributorsPage />} />
            <Route path="distributors/new" element={<DistributorFormPage />} />
            <Route path="distributors/:id" element={<DistributorDetailPage />} />
            <Route path="distributors/:id/edit" element={<DistributorFormPage />} />
            {/* Phase 2: Customer Master = the former Admin Retailer List (same Customer records). /admin/retailers* is intentionally not routed. */}
            <Route path="masters/customers" element={<RetailersPage portal="admin" />} />
            <Route path="masters/customers/new" element={<RetailerFormPage portal="admin" />} />
            <Route path="masters/customers/:id" element={<RetailerDetailPage portal="admin" />} />
            <Route path="masters/customers/:id/edit" element={<RetailerFormPage portal="admin" />} />
            <Route path="claims" element={<ClaimsPage portal="admin" />} />
            <Route path="claims/:id" element={<ClaimDetailPage portal="admin" />} />
            <Route path="accounts" element={<AccountsDashboardPage portal="admin" />} />
            <Route path="accounts/outstanding" element={<OutstandingPage portal="admin" />} />
            <Route path="accounts/ageing" element={<AgeingPage portal="admin" />} />
            <Route path="accounts/ledger" element={<LedgerPage portal="admin" />} />
            <Route path="accounts/payments" element={<PaymentsPage portal="admin" />} />
            <Route path="accounts/credit" element={<CreditPage portal="admin" />} />
            <Route path="*" element={<AdminNotFound />} />
          </Route>
        </Route>

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          {import.meta.env.DEV && (
            <Route
              path="design-system"
              element={
                <Suspense fallback={<LoadingState label="Loading design system…" />}>
                  <DesignSystemPage />
                </Suspense>
              }
            />
          )}
          <Route path="salesorder-master" element={<SalesOrderMaster />} />
          <Route path="delivery" element={<Delivery />} />
          <Route path="invoice/creation" element={<Invoice />} />
          <Route path="invoice/view" element={<Viewinvoice />} />
          {/* Phase 2: removed from the Distributor portal and intentionally NOT routed (they fall through to the not-found route below):
              inventory/fefo, Masters (material-master, stock-master, customer, customerGroup, vendor, vendorsGroup, itemsGroup, hsn-master, pricing),
              Schemes & Claims (claims*), Financial View (finance*) and accounts/VendorLedger. Their backend APIs are unchanged. */}
          <Route path="customers" element={<RetailersPage portal="distributor" />} />
          <Route path="customers/new" element={<RetailerFormPage portal="distributor" />} />
          <Route path="customers/:id" element={<RetailerDetailPage portal="distributor" />} />
          <Route path="customers/:id/edit" element={<RetailerFormPage portal="distributor" />} />
          <Route path="retailers/*" element={<RetailersRedirect />} />
          {/* e-Pulse Phase 1: Reports (all sections, view only) and Settings */}
          <Route path="reports" element={<Navigate to="/dashboard/reports/sales" replace />} />
          <Route path="reports/:section" element={<DistributorReportPage />} />
          <Route path="settings" element={<DistributorSettingsPage />} />
<Route path="inventory/current" element={<CurrentStock />} />
<Route path="inventory/batch" element={<BatchStock />} />
<Route path="inventory/ledger" element={<StockLedger />} />
<Route path="inventory/near-expiry" element={<NearExpiry />} />
<Route path="inventory/expired" element={<ExpiredStock />} />
          <Route path="logout" element={<Logout />} />
          <Route path="sales/delivery" element={<DeliveryPage />} />
          <Route path="sales/invoice" element={<InvoicePage />} />
          <Route path="sales/credit" element={<CreditNotePage />} />
          <Route path="sales/debit" element={<DebitNotePage />} />
          <Route path="sales/return" element={<SalesReturnPage />} />
          <Route path="purchase/po" element={<Po />} />
          <Route path="purchase/delivery" element={<PODeliveryManagement />} />
          <Route path="purchase/invoice" element={<PurchaseInvoiceSystem/>} />
          <Route path="purchase/return" element={<PurchaseReturnPage />} />
          <Route path="purchase/debit" element={<PurchaseDebitNotePage />} />
            {/* 🔥 Accounting */}
          <Route path="accounts/GLMaster" element={<GLMaster />} />
          <Route path="accounts/CustomerLedger" element={<CustomerLedger />} />
          <Route path="accounts/BalanceSheet" element={<BalanceSheet />} />
          <Route path="accounts/TrialBalance" element={<TrialBalance />} />
          <Route path="accounts/Payments" element={<UnifiedPaymentManagement />} />
          <Route path="*" element={<DistributorNotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default PrivateApp;
