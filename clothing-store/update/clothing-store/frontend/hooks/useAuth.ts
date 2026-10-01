/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LogOut,
  sendOtpToLaravel,
  VerifyOtpToLaravel,
} from "../services/auth.service";
import { useRouter } from "next/navigation";
import { VerifyOtp } from "@/types/auth";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useLocale } from "@/hooks/useLocale";
import { getApiErrorMessage } from "@/lib/api-error";

export const useSendOtp = () => {
  const router = useRouter();
  const { locale } = useLocale();
  return useMutation({
    mutationFn: (phone: string) => sendOtpToLaravel(phone),
    onSuccess: (data, phone) => {
      toast.success(data.message);
      router.push(`/verify?phone=${encodeURIComponent(phone)}`);
    },
    onError: (error: any) =>
      toast.error(
        getApiErrorMessage(
          error,
          locale === "fa"
            ? "ارتباط با سرور برقرار نشد."
            : "Error connecting to the server",
        ),
      ),
  });
};

export const useVerifyOtp = () => {
  const router = useRouter();
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ phone, code }: VerifyOtp) => VerifyOtpToLaravel(phone, code),
    onSuccess: (data) => {
      const tokens = data?.data?.tokens;
      if (tokens) {
        Cookies.set("access_token", tokens.access_token, {
          expires: 15 / (24 * 60),
          sameSite: "lax",
        });
        Cookies.set("refresh_token", tokens.refresh_token, {
          expires: 30,
          sameSite: "lax",
        });
        queryClient.setQueryData(["me"], data?.data?.user);
      }
      toast.success(data.message);
      router.push("/account");
    },
    onError: (error: any) =>
      toast.error(
        getApiErrorMessage(
          error,
          locale === "fa"
            ? "ارتباط با سرور برقرار نشد."
            : "Error connecting to the server",
        ),
      ),
  });
};

export function useLogOut() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => LogOut(),
    onSuccess: (data) => {
      Cookies.remove("refresh_token");
      Cookies.remove("access_token");
      queryClient.clear();
      toast.success(data.message);
      router.push("/");
    },
    onError: () => {
      Cookies.remove("refresh_token");
      Cookies.remove("access_token");
      queryClient.clear();
      router.push("/");
    },
  });
}
