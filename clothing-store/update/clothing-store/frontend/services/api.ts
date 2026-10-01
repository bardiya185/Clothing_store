import axios, { type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const ACCESS_TOKEN_LIFETIME_DAYS = 15 / (24 * 60);
const REFRESH_TOKEN_LIFETIME_DAYS = 30;

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };
type TokenPair = { access_token: string; refresh_token: string };

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

let refreshPromise: Promise<TokenPair> | null = null;

function saveTokenPair(tokens: TokenPair) {
  if (!tokens?.access_token || !tokens?.refresh_token) {
    throw new Error("The refresh response did not contain a complete token pair");
  }

  Cookies.set("access_token", tokens.access_token, {
    expires: ACCESS_TOKEN_LIFETIME_DAYS,
    sameSite: "lax",
  });
  Cookies.set("refresh_token", tokens.refresh_token, {
    expires: REFRESH_TOKEN_LIFETIME_DAYS,
    sameSite: "lax",
  });
}

export function clearSessionTokens() {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
}

/**
 * Refreshes once for concurrent 401 responses. Every caller receives the
 * same promise, so several expired requests cannot rotate the refresh token
 * in parallel and invalidate one another.
 */
export function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = Cookies.get("refresh_token");
    if (!refreshToken) throw new Error("Refresh token is missing");

    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    const tokens = response.data?.data?.tokens as TokenPair | undefined;
    if (!tokens) throw new Error("Refresh response is invalid");
    saveTokenPair(tokens);
    return tokens;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function isPublicAuthRequest(url = "") {
  return [
    "/auth/send-otp",
    "/auth/verify-otp",
    "/auth/refresh",
    "/auth/logout",
  ].some((path) => url.includes(path));
}

api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (typeof window !== "undefined") {
    const locale = window.localStorage.getItem("baran-locale");
    if (locale === "fa" || locale === "en") config.headers["X-Locale"] = locale;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequest | undefined;
    const requestUrl = originalRequest?.url ?? "";
    const isRefreshRequest = requestUrl.includes("/auth/refresh");

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest ||
      isPublicAuthRequest(requestUrl)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const tokens = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      clearSessionTokens();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.replace(`/login?next=${encodeURIComponent(next)}`);
      }
      return Promise.reject(refreshError);
    }
  },
);
