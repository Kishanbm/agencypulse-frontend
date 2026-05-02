import { useAuthStore } from "@/lib/store";
import type { Role } from "@/types/auth";
import { hasRole as rbacHasRole } from "@/lib/rbac";

export function useRole(): Role | null {
  return useAuthStore((s) => (s.user?.role ?? null) as Role | null);
}

export function useHasRole(min: Role): boolean {
  const role = useRole();
  return rbacHasRole(role, min);
}
