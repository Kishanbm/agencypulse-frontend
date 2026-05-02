import type { Role } from "@/types/auth";

const RANK: Record<Role, number> = {
  SUPER_ADMIN: 100,
  AGENCY_OWNER: 90,
  AGENCY_ADMIN: 80,
  AGENCY_STAFF: 70,
  CLIENT_USER: 10,
};

export function hasRole(current: Role | null | undefined, min: Role): boolean {
  if (!current) return false;
  return RANK[current] >= RANK[min];
}

export function isAgencyRole(role: Role | null | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "AGENCY_OWNER" || role === "AGENCY_ADMIN" || role === "AGENCY_STAFF";
}

export function isClientUser(role: Role | null | undefined): boolean {
  return role === "CLIENT_USER";
}

export function roleHome(role: Role | null | undefined): string {
  if (isClientUser(role)) return "/portal";
  if (isAgencyRole(role)) return "/";
  return "/login";
}
