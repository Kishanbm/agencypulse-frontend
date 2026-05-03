import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { RoleRoute } from "@/components/auth/RoleRoute";
import { AppBootstrap } from "@/components/auth/AppBootstrap";
import { AgencyAppLayout } from "@/components/layout/AgencyAppLayout";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { StubPage } from "@/components/common/StubPage";
import { AcceptInvitePage } from "@/pages/auth/AcceptInvitePage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import { SharedReportPage } from "@/pages/public/SharedReportPage";
import { RootRedirect } from "@/pages/RootRedirect";
import ClientsPage from "@/pages/clients/ClientsPage";
import ClientDetailPage from "@/pages/clients/ClientDetailPage";
import CampaignHomePage from "@/pages/clients/CampaignHomePage";
import ClientTeamPage from "@/pages/clients/ClientTeamPage";
import TeamPage from "@/pages/team/TeamPage";
import AgencyProfilePage from "@/pages/settings/AgencyProfilePage";
import BrandingPage from "@/pages/settings/BrandingPage";
import IntegrationsPage from "@/pages/clients/IntegrationsPage";
import { DashboardsList } from "@/pages/dashboard/client/DashboardsList";
import { DashboardViewer } from "@/pages/dashboard/client/DashboardViewer";
import ReportsList from "@/pages/reports/ReportsList";
import ReportDetail from "@/pages/reports/ReportDetail";
import ReportBuilder from "@/pages/reports/ReportBuilder";
import AlertsPage from "@/pages/campaigns/AlertsPage";
import GoalsPage from "@/pages/campaigns/GoalsPage";
import NotesPage from "@/pages/campaigns/NotesPage";
import AiAssistantPage from "@/pages/campaigns/AiAssistantPage";
import HealthPage from "@/pages/campaigns/HealthPage";
import ScorecardPage from "@/pages/campaigns/ScorecardPage";
import ForecastPage from "@/pages/campaigns/ForecastPage";
import ExportPage from "@/pages/campaigns/ExportPage";
import KpiDefinitionsPage from "@/pages/settings/KpiDefinitionsPage";
import TemplatesPage from "@/pages/templates/TemplatesPage";
import BillingPage from "@/pages/settings/BillingPage";
import BillingSuccessPage from "@/pages/billing/BillingSuccessPage";
import BillingCancelPage from "@/pages/billing/BillingCancelPage";
import AuditLogPage from "@/pages/settings/AuditLogPage";
import NotificationsPage from "@/pages/settings/NotificationsPage";
import OverviewPage from "@/pages/overview/OverviewPage";
import { PortalLanding } from "@/pages/portal/PortalLanding";
import { PortalClientHome } from "@/pages/portal/PortalClientHome";
import { PortalReportsList } from "@/pages/portal/PortalReportsList";

export default function App() {
  return (
    <BrowserRouter>
      <AppBootstrap>
        <Routes>
          {/* ─── Public ─── */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/r/:token" element={<SharedReportPage />} />

          {/* ─── Root redirect by role ─── */}
          <Route path="/" element={<RootRedirect />} />

          {/* ─── Agency app (OWNER / ADMIN / STAFF) ─── */}
          <Route element={<RoleRoute />}>
            <Route element={<AgencyAppLayout />}>
              <Route path="/overview" element={<OverviewPage />} />

              {/* Clients & campaigns — slice B1 */}
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:clientId" element={<ClientDetailPage />} />
              <Route
                path="/clients/:clientId/team"
                element={<ClientTeamPage />}
              />
              <Route
                path="/clients/:clientId/campaigns/:campaignId"
                element={<CampaignHomePage />}
              />

              {/* Dashboards — slices B5 + B6 */}
              <Route
                path="/clients/:clientId/campaigns/:campaignId/dashboards"
                element={<DashboardsList />}
              />
              <Route
                path="/clients/:clientId/campaigns/:campaignId/dashboards/:dashboardId"
                element={<DashboardViewer />}
              />
              <Route
                path="/clients/:clientId/campaigns/:campaignId/dashboards/:dashboardId/edit"
                element={
                  <RoleRoute min="AGENCY_ADMIN">
                    <DashboardViewer />
                  </RoleRoute>
                }
              />

              {/* Reports — slice B7 */}
              <Route
                path="/clients/:clientId/campaigns/:campaignId/reports"
                element={<ReportsList />}
              />
              <Route
                path="/clients/:clientId/campaigns/:campaignId/reports/:reportId"
                element={<ReportDetail />}
              />
              <Route
                path="/clients/:clientId/campaigns/:campaignId/reports/:reportId/edit"
                element={
                  <RoleRoute min="AGENCY_ADMIN">
                    <ReportBuilder />
                  </RoleRoute>
                }
              />

              {/* Integrations — slice B4 */}
              <Route
                path="/clients/:clientId/campaigns/:campaignId/integrations"
                element={<IntegrationsPage />}
              />

              {/* Alerts / Goals / Notes — slice B8 */}
              <Route
                path="/clients/:clientId/campaigns/:campaignId/alerts"
                element={<AlertsPage />}
              />
              <Route
                path="/clients/:clientId/campaigns/:campaignId/goals"
                element={<GoalsPage />}
              />
              <Route
                path="/clients/:clientId/campaigns/:campaignId/notes"
                element={<NotesPage />}
              />

              {/* Health / scorecard / forecast / export — slice B10 */}
              <Route
                path="/clients/:clientId/campaigns/:campaignId/health"
                element={<HealthPage />}
              />
              <Route
                path="/clients/:clientId/campaigns/:campaignId/scorecard"
                element={<ScorecardPage />}
              />
              <Route
                path="/clients/:clientId/campaigns/:campaignId/forecast"
                element={<ForecastPage />}
              />
              <Route
                path="/clients/:clientId/campaigns/:campaignId/export"
                element={<ExportPage />}
              />

              {/* AI Assistant — slice B9 */}
              <Route
                path="/clients/:clientId/campaigns/:campaignId/ai"
                element={<AiAssistantPage />}
              />

              {/* Team — slice B2 (ADMIN+) */}
              <Route element={<RoleRoute min="AGENCY_ADMIN" />}>
                <Route
                  path="/team"
                  element={<TeamPage />}
                />
                <Route path="/kpi-definitions" element={<KpiDefinitionsPage />} />
              </Route>

              {/* Templates — slice B11 (all roles) */}
              <Route path="/templates" element={<TemplatesPage />} />

              {/* Stripe redirect landing pages — B12 */}
              <Route path="/billing/success" element={<BillingSuccessPage />} />
              <Route path="/billing/cancel" element={<BillingCancelPage />} />

              {/* Settings — layered guards */}
              <Route element={<RoleRoute min="AGENCY_ADMIN" />}>
                <Route
                  path="/settings/profile"
                  element={<AgencyProfilePage />}
                />
                <Route
                  path="/settings/audit-log"
                  element={<AuditLogPage />}
                />
                <Route
                  path="/settings/notifications"
                  element={<NotificationsPage />}
                />
              </Route>
              <Route element={<RoleRoute min="AGENCY_OWNER" />}>
                <Route
                  path="/settings/branding"
                  element={<BrandingPage />}
                />
                <Route
                  path="/settings/billing"
                  element={<BillingPage />}
                />
              </Route>
            </Route>
          </Route>

          {/* ─── Client portal (CLIENT_USER) ─── */}
          <Route element={<RoleRoute portalOnly />}>
            <Route element={<ClientPortalLayout />}>
              {/* Landing — auto-redirect if single client */}
              <Route path="/portal" element={<PortalLanding />} />

              {/* Client home — tabs: Overview | Dashboards | Reports */}
              <Route path="/portal/:clientId" element={<PortalClientHome />} />

              {/* Full-page dashboard viewer (read-only — DashboardViewer handles CLIENT_USER role) */}
              <Route
                path="/portal/:clientId/campaigns/:campaignId/dashboards/:dashboardId"
                element={<DashboardViewer />}
              />

              {/* Reports list per campaign */}
              <Route
                path="/portal/:clientId/campaigns/:campaignId/reports"
                element={<PortalReportsList />}
              />

              {/* Full-page report viewer (read-only — ReportDetail handles CLIENT_USER role) */}
              <Route
                path="/portal/:clientId/campaigns/:campaignId/reports/:reportId"
                element={<ReportDetail />}
              />
            </Route>
          </Route>

          {/* Anything else → root redirect */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AppBootstrap>
      <Toaster />
    </BrowserRouter>
  );
}
