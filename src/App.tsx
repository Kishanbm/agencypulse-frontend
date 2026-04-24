import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { useAuthStore } from "./lib/store";
import { Toaster } from "@/components/ui/sonner";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Clients from "./pages/dashboard/Clients";
import ClientDetail from "./pages/dashboard/ClientDetail";
import DataSources from "./pages/dashboard/DataSources";
import Reports from "./pages/dashboard/Reports";
import ReportDetail from "./pages/dashboard/ReportDetail";
import RollupDashboards from "./pages/dashboard/RollupDashboards";
import Goals from "./pages/dashboard/Goals";
import Tasks from "./pages/dashboard/Tasks";
import Alerts from "./pages/dashboard/Alerts";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/login" element={
            <div className="min-h-screen flex items-center justify-center p-4">
              <LoginForm />
            </div>
          } />
          <Route path="/register" element={
            <div className="min-h-screen flex items-center justify-center p-4">
              <RegisterForm />
            </div>
          } />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route index element={<Navigate to="/dashboard/clients" />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="clients/:id/*" element={<ClientDetail />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="reports/:id" element={<ReportDetail />} />
                    <Route path="roll-up" element={<RollupDashboards />} />
                    <Route path="goals" element={<Goals />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="alerts" element={<Alerts />} />
                    <Route path="data-sources" element={<DataSources />} />
                    <Route path="custom-metrics" element={<div>Custom Metrics Page</div>} />
                    <Route path="templates" element={<div>Templates Page</div>} />
                    <Route path="bulk-actions" element={<div>Bulk Actions Page</div>} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
      <Toaster />
    </Router>
  );
}
