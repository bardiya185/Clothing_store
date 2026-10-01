import { toast } from 'sonner';
import { api } from './api';

// ۱. ارسال شماره
export const sendOtpToLaravel = async (phone: string) => {
  const response = await api.post('/auth/send-otp', { phone });
  return response.data;
};

// ۲. تأیید کد
export const VerifyOtpToLaravel = async (phone: string, code: string) => {
  const response = await api.post('/auth/verify-otp', { phone, code });
  return response.data;
};

//خارج شدن از حساب
export const LogOut = async (access_token: string) => {
  const response = await api.post('/auth/logout', { access_token});
  return response.data;
};

//بررسی حساب
export const UserData = async (access_token: string) => {
  const response = await api.get('/auth/me', { access_token});
  return response.data;
};