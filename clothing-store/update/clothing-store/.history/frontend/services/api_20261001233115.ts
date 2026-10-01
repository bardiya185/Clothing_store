/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// متغیرها برای مدیریت صف درخواست‌های همزمان
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

// پردازش صف درخواست‌های منتظر
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// ۱. اضافه کردن خودکار Access Token به هدر درخواست‌ها
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ۲. مدیریت هوشمندانه و صف‌بندی‌شده‌ی ارور ۴۰۱
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // اگر ارور 401 دریافت شد و درخواست قبلاً رفرش نشده بود
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      // اگر یک درخواست دیگه همین الان در حال گرفتن رفرش توکن هست، این درخواست بره تو صف منتظر بمونه
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get('refresh_token');

        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // درخواست رفرش توکن به لاراول
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = res.data?.data?.tokens?.access_token || res.data?.data?.access_token;
        const newRefreshToken = res.data?.data?.tokens?.refresh_token || res.data?.data?.refresh_token;

        if (!newAccessToken) {
          throw new Error('New access token missing');
        }

        // ذخیره توکن‌های جدید در کوکی
        Cookies.set('access_token', newAccessToken, { expires: 1, path: '/' });
        if (newRefreshToken) {
          Cookies.set('refresh_token', newRefreshToken, { expires: 30, path: '/' });
        }

        // آزاد کردن صف درخواست‌های منتظر با توکن جدید
        processQueue(null, newAccessToken);

        // اجرای مجدد همین درخواست اصلی
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        return api(originalRequest);

      } catch (refreshError: any) {
        // اگر رفرش توکن کلاً باطل شده بود، صف رو رد کن و کوکی‌ها رو پاک کن
        processQueue(refreshError, null);
        
        Cookies.remove('access_token', { path: '/' });
        Cookies.remove('refresh_token', { path: '/' });

        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);