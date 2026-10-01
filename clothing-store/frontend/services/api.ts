import axios from 'axios';
import Cookies from 'js-cookie';

// 👈 دریافت آدرس بیسیک از متغیر محیطی (.env.local)
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// ۱. اضافه کردن خودکار Access Token به تمام درخواست‌ها
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ۲. مدیریت خودکار ارور ۴۰۱ و رفرش توکن
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refresh_token');

        if (!refreshToken) {
          throw new Error('Refresh token is missing');
        }

        // 👈 استفاده از متغیر BASE_URL به جای آدرس هاردکد شده
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccessToken = res.data.data.tokens.access_token;
        const newRefreshToken = res.data.data.tokens.refresh_token;

        // آپدیت کوکی‌ها
        Cookies.set('access_token', newAccessToken, { expires: 15 / (24 * 60) });
        Cookies.set('refresh_token', newRefreshToken, { expires: 30 });

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);