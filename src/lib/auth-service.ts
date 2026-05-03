import { getApiClient } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import type { AuthResponse, AuthUser, Role } from "@/types/auth";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  // Step 1
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  // Step 2
  agencyName: string;
  website?: string;
  size?: string;
  country?: string;
  timezone?: string;
  // Step 3 (optional)
  interests?: string[];
  clientCountEstimate?: string;
  referralSource?: string;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const api = getApiClient();
  const { data } = await api.post<AuthResponse>("/auth/login", input);
  applyAuth(data);
  return data;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const api = getApiClient();
  const { data } = await api.post<AuthResponse>("/auth/register", input);
  applyAuth(data);
  return data;
}

export async function logout(): Promise<void> {
  const api = getApiClient();
  try {
    await api.post("/auth/logout", {});
  } catch {
    // Even if the server-side revocation fails, clear local state.
  } finally {
    useAuthStore.getState().logout();
  }
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const api = getApiClient();
  const { data } = await api.post<{ message: string }>("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<{ message: string }> {
  const api = getApiClient();
  const { data } = await api.post<{ message: string }>("/auth/reset-password", { token, password });
  return data;
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  const api = getApiClient();
  const { data } = await api.post<{ message: string }>("/auth/verify-email", { token });
  return data;
}

export async function resendVerification(): Promise<{ message: string }> {
  const api = getApiClient();
  const { data } = await api.post<{ message: string }>("/auth/resend-verification", {});
  return data;
}

/**
 * Called on app boot when we have a persisted access token — hydrates the
 * latest user profile from /auth/me. If it 401s, the interceptor will try a
 * refresh once; on failure the store is cleared.
 */
export async function fetchMe(): Promise<AuthUser | null> {
  const api = getApiClient();
  try {
    const { data } = await api.get<AuthUser & { lastLoginAt: string | null }>(
      "/auth/me",
    );
    // Preserve the existing agency blob (populated at login/register).
    const existing = useAuthStore.getState().user;
    const merged: AuthUser = { ...data, agency: existing?.agency };
    useAuthStore.getState().setUser(merged);
    return merged;
  } catch {
    return null;
  }
}

function applyAuth(res: AuthResponse) {
  const user: AuthUser = { ...res.user, agency: res.agency };
  useAuthStore.getState().setAuth(user, res.accessToken);
}

export type { Role };
