/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { useLocale } from "@/hooks/useLocale";
import { getApiErrorMessage } from "@/lib/api-error";
import { UserData } from "@/services/auth.service";
import {
  addWishlist,
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
  getOrders,
  getWishlist,
  removeWishlist,
  updateProfile,
} from "@/services/account.service";
import type { AddressPayload, User } from "@/services/account.service";

export function useCurrentUser() {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setAuthReady(
      Boolean(Cookies.get("access_token") || Cookies.get("refresh_token")),
    );
  }, []);

  const query = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await UserData()).data,
    enabled: authReady,
    retry: false,
  });

  return { ...query, authReady };
}

export function useWishlist(enabled = true) {
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: getWishlist,
    enabled,
    retry: false,
  });
}

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: getAddresses,
    enabled,
    retry: false,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddressPayload) => createAddress(payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success(result.message);
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AddressPayload }) =>
      updateAddress(id, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success(result.message);
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success(result.message);
    },
  });
}

export function useAccountOrders(enabled = true) {
  return useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    enabled,
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  return useMutation({
    mutationFn: (payload: Pick<User, "name" | "email" | "phone">) =>
      updateProfile(payload),
    onSuccess: (result) => {
      queryClient.setQueryData(["me"], result.data);
      toast.success(result.message);
    },
    onError: (error: any) =>
      toast.error(
        getApiErrorMessage(
          error,
          locale === "fa"
            ? "ذخیره اطلاعات ناموفق بود."
            : "Could not save your profile.",
        ),
      ),
  });
}

export function useToggleWishlist(productId: number, isLiked: boolean) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      isLiked ? removeWishlist(productId) : addWishlist(productId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(result.message);
    },
  });
}

export function useRemoveWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeWishlist,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(result.message);
    },
  });
}
