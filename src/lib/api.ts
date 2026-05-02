import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "@/lib/store";
import { roleHome } from "@/lib/rbac";

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

let apiClient: AxiosInstance | null = null;

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/**
 * Tracks an in-flight refresh so concurrent 401s collapse into a single
 * /auth/refresh call. Returns the new access token on success, or null on
 * failure (in which case the store is cleared and the caller should redirect).
 */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(base: string): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await axios.post<{ accessToken: string }>(
        `${base}/auth/refresh`,
        {},
        { withCredentials: true },
      );
      const newToken = res.data?.accessToken ?? null;
      if (newToken) {
        useAuthStore.getState().setToken(newToken);
      }
      return newToken;
    } catch {
      useAuthStore.getState().logout();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function redirectToLogin() {
  const user = useAuthStore.getState().user;
  const home = user ? roleHome(user.role) : "/login";
  // Only bounce if we're not already on login, to avoid loops
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = home === "/portal" ? "/login" : "/login";
  }
}

export function getApiClient(): AxiosInstance {
  if (apiClient) return apiClient;

  apiClient = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
  });

  apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetryableConfig | undefined;
      const status = error.response?.status;

      if (
        status === 401 &&
        original &&
        !original._retry &&
        !original.url?.includes("/auth/refresh") &&
        !original.url?.includes("/auth/login")
      ) {
        original._retry = true;
        const newToken = await refreshAccessToken(API_BASE);
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return apiClient!.request(original);
        }
        useAuthStore.getState().logout();
        redirectToLogin();
      }

      return Promise.reject(error);
    },
  );

  return apiClient;
}

/**
 * Convenience shortcut for modules that prefer `api.get(...)` over
 * `getApiClient().get(...)`.
 */
export const api = new Proxy({} as AxiosInstance, {
  get(_target, prop: keyof AxiosInstance) {
    const client = getApiClient();
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

/**
 * Unauthenticated client for public endpoints (e.g. shared report viewer).
 * No auth headers, no cookie credentials, no 401 interceptor.
 */
let publicClient: AxiosInstance | null = null;

export function getPublicApiClient(): AxiosInstance {
  if (publicClient) return publicClient;
  publicClient = axios.create({
    baseURL: API_BASE,
    withCredentials: false,
  });
  return publicClient;
}
