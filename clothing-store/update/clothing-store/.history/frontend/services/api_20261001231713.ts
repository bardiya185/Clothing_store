// services/api.ts
import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// ۱. اضافه کردن خودکار Access Token به هدر درخواست‌ها
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ۲. مدیریت هوشمندانه ارور ۴۰۱ (انقضای اکسس توکن)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // اگر ارور 401 بود و قبلاً یک‌بار تلاش مجدد نکرده بودیم
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('🔄 ارور 401 دریافت شد (اکسس توکن نیست یا منقضی شده). در حال تلاش برای رفرش توکن...');

      try {
        const refreshToken = Cookies.get('refresh_token');

        if (!refreshToken) {
          console.error('❌ هیچ رفرش توکنی در کوکی یافت نشد!');
          throw new Error('Refresh token missing');
        }

        console.log('🔑 در حال ارسال رفرش توکن به لاراول...');

        // درخواست مستقیم با axios به لاراول برای گرفتن توکن جدید
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        console.log('✅ پاسخ رفرش توکن از لاراول دریافت شد:', res.data);

        // استخراج توکن‌های جدید
        const newAccessToken = res.data?.data?.tokens?.access_token || res.data?.data?.access_token;
        const newRefreshToken = res.data?.data?.tokens?.refresh_token || res.data?.data?.refresh_token;

        if (!newAccessToken) {
          throw new Error('New access token not found in response');
        }

        // 👈 ذخیره مجدد کوکی‌ها با path: '/'
        Cookies.set('access_token', newAccessToken, { expires: 1, path: '/' });
        if (newRefreshToken) {
          Cookies.set('refresh_token', newRefreshToken, { expires: 30, path: '/' });
        }

        console.log('🎉 اکسس توکن جدید با موفقیت در کوکی ست شد!');

        // تکرار مجدد درخواست قبلی کاربر با توکن جدید
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError: any) {
        console.error('❌ رفرش توکن ناموفق بود (احتمالاً رفرش توکن باطل شده):', refreshError?.response?.data || refreshError.message);

        // پاکسازی کوکی‌ها و هدایت به لاگین
        Cookies.remove('access_token', { path: '/' });
        Cookies.remove('refresh_token', { path: '/' });

        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);