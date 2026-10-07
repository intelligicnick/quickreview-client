import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminShell } from './components/AdminShell';
import { AppShell } from './components/AppShell';
import { CrmLayout } from './components/crm/CrmLayout';
import { QuickCommerceShell } from './components/quickcommerce/QuickCommerceShell';
import { homePath, useAuth } from './lib/auth';
import { LocationProvider } from './lib/location-context';
import { AdminHomePage } from './pages/admin/AdminHomePage';
import { AdminLocationsPage } from './pages/admin/AdminLocationsPage';
import { AdminUserPage } from './pages/admin/AdminUserPage';
import { AdminContactPage } from './pages/admin/AdminContactPage';
import { AdminMarketplacePage } from './pages/admin/AdminMarketplacePage';
import { AdminQrBatchesPage } from './pages/admin/AdminQrBatchesPage';
import { AdminSubscriptionsPage } from './pages/admin/AdminSubscriptionsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { BusinessDetailPage } from './pages/BusinessDetailPage';
import { BusinessesPage } from './pages/BusinessesPage';
import { DashboardPage } from './pages/DashboardPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { QuickConnectPage } from './pages/QuickConnectPage';
import { QrCodesPage } from './pages/QrCodesPage';
import { QuickMenuPage } from './pages/QuickMenuPage';
import { QuickReviewPage } from './pages/QuickReviewPage';
import { QuickDesignPage } from './pages/QuickDesignPage';
import { QuickScanPage } from './pages/QuickScanPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LocationsPage } from './pages/LocationsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { SettingsPage } from './pages/SettingsPage';
import { ReviewPage } from './pages/public/ReviewPage';
import { ConnectPage } from './pages/public/ConnectPage';
import { ClaimQrPage } from './pages/public/ClaimQrPage';
import { MenuPage } from './pages/public/MenuPage';
import { QuickRevisitPage as PublicQuickRevisitPage } from './pages/public/QuickRevisitPage';
import { QuickRevisitPage } from './pages/QuickRevisitPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { CrmBusinessProfilePage } from './pages/crm/CrmBusinessProfilePage';
import { CrmCustomerDetailPage } from './pages/crm/CrmCustomerDetailPage';
import { CrmCustomerEditPage } from './pages/crm/CrmCustomerEditPage';
import { CrmCustomerFormPage } from './pages/crm/CrmCustomerFormPage';
import { CrmCustomersPage } from './pages/crm/CrmCustomersPage';
import { CrmFollowUpFormPage } from './pages/crm/CrmFollowUpFormPage';
import { CrmFollowUpsPage } from './pages/crm/CrmFollowUpsPage';
import { CrmHomePage } from './pages/crm/CrmHomePage';
import { CrmInvoicesPage } from './pages/crm/CrmInvoicesPage';
import { CrmQuotationsPage } from './pages/crm/CrmQuotationsPage';
import { CrmMorePage } from './pages/crm/CrmMorePage';
import { CrmNoteFormPage } from './pages/crm/CrmNoteFormPage';
import { CrmOnboardingPage } from './pages/crm/CrmOnboardingPage';
import { CrmPaymentFormPage } from './pages/crm/CrmPaymentFormPage';
import { CrmProductsPage } from './pages/crm/CrmProductsPage';
import { CrmQuotationFormPage } from './pages/crm/CrmQuotationFormPage';
import { CrmReportsPage } from './pages/crm/CrmReportsPage';
import { CrmSaleFormPage } from './pages/crm/CrmSaleFormPage';
import { CrmSalesPage } from './pages/crm/CrmSalesPage';
import { CrmSearchPage } from './pages/crm/CrmSearchPage';
import { CrmSettingsPage } from './pages/crm/CrmSettingsPage';
import { CrmTeamPage } from './pages/crm/CrmTeamPage';
import { RequireCrmOnboarding } from './pages/crm/RequireCrmOnboarding';

function GuestOnly({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <BootScreen />;
  if (user) return <Navigate to={homePath(user)} replace />;
  return children;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { user, ready, impersonation } = useAuth();
  if (!ready) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/verify-email" replace />;
  if (!user.isSuperAdmin || impersonation) return <Navigate to="/app" replace />;
  return children;
}

function HomeRedirect() {
  const { user, ready } = useAuth();
  if (!ready) return <BootScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homePath(user)} replace />;
}

function BootScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-sm text-muted">Loading QuickReview…</div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/r/:code" element={<ReviewPage />} />
      <Route path="/q/:code" element={<ClaimQrPage />} />
      <Route path="/c/:slug" element={<ConnectPage />} />
      <Route path="/go/:slug" element={<MenuPage />} />
      <Route path="/menu/:slug" element={<MenuPage />} />
      <Route path="/quick-revisit/:code" element={<PublicQuickRevisitPage />} />
      <Route
        path="/app"
        element={
          <RequireAuth>
            <LocationProvider>
              <AppShell />
            </LocationProvider>
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="quickreview" element={<QuickReviewPage />} />
        <Route path="quickcommerce" element={<QuickCommerceShell />}>
          <Route index element={<QuickMenuPage />} />
          <Route path="revisit" element={<QuickRevisitPage />} />
        </Route>
        <Route path="quickrevisit" element={<Navigate to="/app/quickcommerce/revisit" replace />} />
        <Route path="quickconnect" element={<QuickConnectPage />} />
        <Route path="quickdesign" element={<QuickDesignPage />} />
        <Route path="quickscan" element={<QuickScanPage />} />
        <Route path="qr" element={<QrCodesPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="businesses" element={<BusinessesPage />} />
        <Route path="businesses/:businessId" element={<BusinessDetailPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="quickcrm" element={<CrmLayout />}>
          <Route path="onboarding" element={<CrmOnboardingPage />} />
          <Route element={<RequireCrmOnboarding />}>
            <Route index element={<CrmHomePage />} />
            <Route path="search" element={<CrmSearchPage />} />
            <Route path="customers" element={<CrmCustomersPage />} />
            <Route path="customers/new" element={<CrmCustomerFormPage />} />
            <Route path="customers/:customerId" element={<CrmCustomerDetailPage />} />
            <Route path="customers/:customerId/edit" element={<CrmCustomerEditPage />} />
            <Route path="quotations" element={<CrmQuotationsPage />} />
            <Route path="follow-ups" element={<CrmFollowUpsPage />} />
            <Route path="follow-ups/new" element={<CrmFollowUpFormPage />} />
            <Route path="sales" element={<CrmSalesPage />} />
            <Route path="sales/new" element={<CrmSaleFormPage />} />
            <Route path="payments/new" element={<CrmPaymentFormPage />} />
            <Route path="quotations/new" element={<CrmQuotationFormPage />} />
            <Route path="notes/new" element={<CrmNoteFormPage />} />
            <Route path="more" element={<CrmMorePage />} />
            <Route path="products" element={<CrmProductsPage />} />
            <Route path="invoices" element={<CrmInvoicesPage />} />
            <Route path="reports" element={<CrmReportsPage />} />
            <Route path="team" element={<CrmTeamPage />} />
            <Route path="settings" element={<CrmSettingsPage />} />
            <Route path="business" element={<CrmBusinessProfilePage />} />
          </Route>
        </Route>
      </Route>
      <Route
        path="/admin"
        element={
          <RequireSuperAdmin>
            <AdminShell />
          </RequireSuperAdmin>
        }
      >
        <Route index element={<AdminHomePage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:userId" element={<AdminUserPage />} />
        <Route path="locations" element={<AdminLocationsPage />} />
        <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
        <Route path="qr" element={<AdminQrBatchesPage />} />
        <Route path="marketplace" element={<AdminMarketplacePage />} />
        <Route path="contact" element={<AdminContactPage />} />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
