import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { Role } from "@/types/auth";
import { useAuthStore } from "@/lib/store";
import { hasRole, isAgencyRole, isClientUser, roleHome } from "@/lib/rbac";

interface RoleRouteProps {
  /** Minimum role required (for agency-side routes). */
  min?: Role;
  /** Set true to restrict this route tree to CLIENT_USER only. */
  portalOnly?: boolean;
  /** Explicit children; if omitted, renders <Outlet /> so this can be used as a layout route. */
  children?: ReactNode;
}

/**
 * Route-level guard. Redirects unauthenticated users to /login, and
 * role-mismatched users to their natural home (via roleHome). Never partially
 * renders a page the user isn't allowed on. Works as either a wrapper
 * (`<RoleRoute><Foo /></RoleRoute>`) or a layout route (no children).
 */
export function RoleRoute({ min, portalOnly, children }: RoleRouteProps) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = user.role;

  if (portalOnly) {
    if (!isClientUser(role)) return <Navigate to={roleHome(role)} replace />;
    return children ? <>{children}</> : <Outlet />;
  }

  if (!isAgencyRole(role)) {
    return <Navigate to={roleHome(role)} replace />;
  }

  if (min && !hasRole(role, min)) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
