// frontend/src/api/client.ts
import axios, { AxiosError } from "axios";
// Type-only imports for TypeScript types that don't exist at runtime
import type {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";

import { getApiBaseUrl, isDev } from "../lib/utils";
import { STORAGE_KEYS, API_ENDPOINTS } from "../lib/constants";
import type { LoginResponse, MeResponse, ApiErrorResponse } from "./types";

// ============================================================================
// Logger Utility
// ============================================================================

const LOG_PREFIX = "[PlaceIQ API]";

function logSuccess(message: string, data?: unknown) {
  if (isDev()) {
    console.log(`${LOG_PREFIX} ✅ ${message}`, data ?? "");
  }
}

function logInfo(message: string, data?: unknown) {
  if (isDev()) {
    console.log(`${LOG_PREFIX} ℹ️ ${message}`, data ?? "");
  }
}

function logError(message: string, error?: unknown) {
  console.error(`${LOG_PREFIX} ❌ ${message}`, error ?? "");
}

function logWarn(message: string, data?: unknown) {
  if (isDev()) {
    console.warn(`${LOG_PREFIX} ⚠️ ${message}`, data ?? "");
  }
}

// ============================================================================
// Create Axios Instance
// ============================================================================

const createApiClient = (): AxiosInstance => {
  const baseURL = getApiBaseUrl();

  // Log the baseURL being used at startup
  if (isDev()) {
    logInfo(`API Client initialized with baseURL: ${baseURL}`);
  }

  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  // Request interceptor - attach access token
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }

      // Log outgoing request in development with FULL URL
      if (isDev()) {
        // Build the full URL that axios will request
        const fullURL = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
        logInfo(`→ ${config.method?.toUpperCase()} ${fullURL}`, {
          hasAuth: !!accessToken,
          params: config.params,
          baseURL: config.baseURL,
        });
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor - handle 401 & auto refresh + success logging
  let isRefreshing = false;
  let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> =
    [];

  const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
      if (error) prom.reject(error);
      else if (token) prom.resolve(token);
    });
    failedQueue = [];
  };

  client.interceptors.response.use(
    (response: AxiosResponse) => {
      // Log successful response in development
      if (isDev()) {
        const status = response.status;
        const method = response.config.method?.toUpperCase();
        const url = response.config.url;
        const fullURL = response.config.baseURL ? `${response.config.baseURL}${url}` : url;
        logSuccess(`← ${method} ${fullURL} [${status}]`, {
          dataKeys:
            response.data && typeof response.data === "object"
              ? Object.keys(response.data)
              : "primitive",
        });
      }
      return response;
    },
    async (error: AxiosError<ApiErrorResponse>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Log error in development with FULL URL
      if (isDev() && error.config) {
        const fullURL = error.config.baseURL
          ? `${error.config.baseURL}${error.config.url}`
          : error.config.url;
        logError(
          `← ${error.config.method?.toUpperCase()} ${fullURL} [${error.response?.status || "NETWORK_ERROR"}]`,
          {
            message: error.message,
            detail: error.response?.data,
          },
        );
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        // Skip refresh for auth endpoints
        const isAuthEndpoint =
          originalRequest.url?.includes("/auth/login") ||
          originalRequest.url?.includes("/auth/refresh") ||
          originalRequest.url?.includes("/auth/activate") ||
          originalRequest.url?.includes("/auth/activate/check");

        if (isAuthEndpoint) {
          logWarn("Auth endpoint returned 401, clearing auth and redirecting");
          clearAuth();
          redirectToLogin();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        if (originalRequest._retry) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          logInfo("Attempting token refresh...");
          const response = await axios.post<LoginResponse>(
            `${getApiBaseUrl()}${API_ENDPOINTS.AUTH_REFRESH}`,
            {},
            { withCredentials: true },
          );

          const { access_token } = response.data;
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
          client.defaults.headers.common.Authorization = `Bearer ${access_token}`;
          processQueue(null, access_token);

          logSuccess("Token refreshed successfully");
          return client(originalRequest);
        } catch (refreshError) {
          logError("Token refresh failed", refreshError);
          processQueue(refreshError, null);
          clearAuth();
          redirectToLogin();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
};

// Create the API client instance
export const apiClient = createApiClient();

// ============================================================================
// Auth Helpers
// ============================================================================

export const clearAuth = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  logInfo("Auth cleared");
};

export const setAuth = (accessToken: string, user: MeResponse): void => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  apiClient.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  logSuccess("Auth set", { userId: user.id, role: user.role });
};

export const getStoredUser = (): MeResponse | null => {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as MeResponse;
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

const redirectToLogin = (): void => {
  const publicPaths = ["/login", "/activate", "/forgot-password", "/reset-password"];
  const currentPath = window.location.pathname;
  if (!publicPaths.some((p) => currentPath.startsWith(p))) {
    const redirect = currentPath + window.location.search;
    window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
  }
};

// ============================================================================
// Typed API Request Wrapper
// ============================================================================

export interface ApiRequestConfig<T = unknown> extends Omit<AxiosRequestConfig, "data"> {
  data?: T;
}

export const apiRequest = {
  get: <T>(url: string, config?: ApiRequestConfig) =>
    apiClient.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, data?: unknown, config?: ApiRequestConfig) =>
    apiClient.post<T>(url, data, config).then((r) => r.data),
  put: <T>(url: string, data?: unknown, config?: ApiRequestConfig) =>
    apiClient.put<T>(url, data, config).then((r) => r.data),
  patch: <T>(url: string, data?: unknown, config?: ApiRequestConfig) =>
    apiClient.patch<T>(url, data, config).then((r) => r.data),
  delete: <T>(url: string, config?: ApiRequestConfig) =>
    apiClient.delete<T>(url, config).then((r) => r.data),
  upload: <T>(
    url: string,
    file: File,
    onProgress?: (p: number) => void,
    config?: ApiRequestConfig,
  ) => {
    const formData = new FormData();
    formData.append("upload_file", file);
    return apiClient
      .post<T>(url, formData, {
        ...config,
        headers: { "Content-Type": "multipart/form-data", ...config?.headers },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
        },
      })
      .then((r) => r.data);
  },
};

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  login: (identifier: string, password: string) =>
    apiRequest.post<LoginResponse>(API_ENDPOINTS.AUTH_LOGIN, { identifier, password }),

  refresh: () => apiRequest.post<LoginResponse>(API_ENDPOINTS.AUTH_REFRESH, {}),

  logout: () => apiRequest.post(API_ENDPOINTS.AUTH_LOGOUT, {}),

  me: () => apiRequest.get<MeResponse>(API_ENDPOINTS.AUTH_ME),

  activate: (data: {
    token: string;
    enrollment_no: string;
    dob: string;
    new_password: string;
    accepted_terms: boolean;
  }) => apiRequest.post<{ status: "activated" }>(API_ENDPOINTS.AUTH_ACTIVATE, data),

  checkActivationToken: (token: string) =>
    apiRequest.get<{ valid: boolean }>(
      `${API_ENDPOINTS.AUTH_ACTIVATE_CHECK}?token=${encodeURIComponent(token)}`,
    ),

  changePassword: (current_password: string, new_password: string) =>
    apiRequest.post<{ message: string }>(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, {
      current_password,
      new_password,
    }),
};

// ============================================================================
// Health API
// ============================================================================

export const healthApi = {
  check: () =>
    apiRequest
      .get<{ status: "ok"; database: "connected" }>(API_ENDPOINTS.HEALTH)
      .then((response) => {
        logSuccess("Health check passed", response);
        return response;
      })
      .catch((error) => {
        logError("Health check failed", error);
        throw error;
      }),
};

export default apiClient;
