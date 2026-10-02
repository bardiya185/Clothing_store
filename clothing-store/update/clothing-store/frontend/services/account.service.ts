import { api } from "./api";
import type { Product } from "@/lib/product";

export type User = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  is_verified: boolean;
  created_at?: string | null;
};
export type Address = {
  id: number;
  title?: string | null;
  recipient_name: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postal_code: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
};

export type AddressPayload = Omit<Address, "id" | "is_default"> & {
  is_default?: boolean;
};

export type Order = {
  id: number;
  number: string;
  status: string;
  payment_status: string;
  postal_status?: string;
  postal_tracking_code?: string | null;
  currency: string;
  total_toman: number;
  total_usd: number;
  items_count: number;
  created_at?: string | null;
};

export async function getCurrentUser() {
  const response = await api.get<{ data: User }>("/auth/me");
  return response.data.data;
}

export async function updateProfile(
  payload: Pick<User, "name" | "email" | "phone">,
) {
  const response = await api.patch<{ data: User; message: string }>(
    "/account/profile",
    payload,
  );
  return response.data;
}

export async function getAddresses() {
  const response = await api.get<{ data: Address[] }>("/account/addresses");
  return response.data.data;
}

export async function createAddress(payload: AddressPayload) {
  const response = await api.post<{ data: Address; message: string }>(
    "/account/addresses",
    payload,
  );
  return response.data;
}

export async function updateAddress(id: number, payload: AddressPayload) {
  const response = await api.patch<{ data: Address; message: string }>(
    `/account/addresses/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteAddress(id: number) {
  const response = await api.delete<{ message: string }>(
    `/account/addresses/${id}`,
  );
  return response.data;
}

export async function getWishlist() {
  const response = await api.get<{ data: Product[] }>("/account/wishlist");
  return response.data.data;
}

export async function addWishlist(productId: number) {
  const response = await api.post<{ message: string }>(
    `/account/wishlist/${productId}`,
  );
  return response.data;
}

export async function removeWishlist(productId: number) {
  const response = await api.delete<{ message: string }>(
    `/account/wishlist/${productId}`,
  );
  return response.data;
}

export async function getOrders() {
  const response = await api.get<{ data: { data: Order[] } }>(
    "/account/orders",
  );
  return response.data.data.data;
}

export async function logout() {
  const response = await api.post<{ message: string }>("/auth/logout");
  return response.data;
}
