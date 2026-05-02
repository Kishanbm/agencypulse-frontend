import type { ReactNode } from "react";
import type { Role } from "@/types/auth";
import { useHasRole } from "@/hooks/useRole";

interface RequireRoleProps {
  min: Role;
  fallback?: ReactNode;
  children: ReactNode;
}

export function RequireRole({ min, fallback = null, children }: RequireRoleProps) {
  const allowed = useHasRole(min);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
