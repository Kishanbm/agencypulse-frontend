export type Role =
  | "SUPER_ADMIN"
  | "AGENCY_OWNER"
  | "AGENCY_ADMIN"
  | "AGENCY_STAFF"
  | "CLIENT_USER";

export type AgencyPlan = "TRIAL" | "STARTER" | "AGENCY" | "AGENCY_PRO";

export interface Agency {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  plan: AgencyPlan;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: Role;
  /** Populated from login/register response; not returned by /auth/me. */
  agency?: Agency;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
  agency: Agency;
}

export interface RefreshResponse {
  accessToken: string;
}
