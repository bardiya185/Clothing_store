import axios, { type InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

type RetryableRequest = InternalAxiosRequestConfig & { _retry?: boolean };
type TokenPair = { access_token: string; refresh_token: string };

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

let refreshPromise: Promise<TokenPair> | null = null;

function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = Cookies.get("refresh_token");
    if (!refreshToken) throw new Error("Refresh token is missing");

    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    const tokens: TokenPair = response.data.data.tokens;
    Cookies.set("access_token", tokens.access_token, {
      expires: 15 / (24 * 60),
      sameSite: "lax",
    });
    Cookies.set("refresh_token", tokens.refresh_token, {
      expires: 30,
      sameSite: "lax",
    });
    return tokens;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
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
    const isRefreshRequest = originalRequest?.url?.includes("/auth/refresh");

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isRefreshRequest
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const tokens = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      Cookies.remove("access_token");
      Cookies.remove("refresh_token");
      if (typeof window !== "undefined") window.location.replace("/login");
      return Promise.reject(refreshError);
    }
  },
);
