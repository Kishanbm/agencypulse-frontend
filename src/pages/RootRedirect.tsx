import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/lib/store";
import { roleHome } from "@/lib/rbac";
import LandingPage from "@/pages/landing/LandingPage";

/**
 * `/` landing:
 *  - Anonymous → public landing page (with signup CTA)
 *  - Authenticated → redirect to role home
 */
export function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  if (!token || !user) return <LandingPage />;
  const home = roleHome(user.role);
  if (home === "/") return <Navigate to="/clients" replace />;
  return <Navigate to={home} replace />;
}
