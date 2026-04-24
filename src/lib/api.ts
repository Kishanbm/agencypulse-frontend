import axios, { AxiosInstance } from "axios";
import { useAuthStore } from "@/src/lib/store";

let apiClient: AxiosInstance | null = null;

export function getApiClient(): AxiosInstance {
  if (apiClient) return apiClient;

  apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  });

  // Add auth interceptor
  apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle 401/403 globally
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear auth and redirect to login
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
      if (error.response?.status === 403) {
        // Pass through to component-level error handling
        error.isForbidden = true;
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
}
