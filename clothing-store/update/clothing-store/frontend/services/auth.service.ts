import { api } from "./api";

export const sendOtpToLaravel = async (phone: string) => {
  const response = await api.post("/auth/send-otp", { phone });
  return response.data;
};

export const VerifyOtpToLaravel = async (phone: string, code: string) => {
  const response = await api.post("/auth/verify-otp", { phone, code });
  return response.data;
};

export const LogOut = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

export const UserData = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};
