import { api } from "./api";
import type { Locale } from "@/lib/product";

export type CheckoutPayload = {
  locale: Locale;
  address_id: number;
  card_number: string;
};

export type Receipt = {
  order_number: string;
  payment_reference: string;
  postal_status?: string;
  postal_tracking_code?: string | null;
  paid_at: string;
  currency: string;
  discount_code?: string | null;
  discount_toman?: number;
  discount_usd?: number;
  total_toman: number;
  total_usd: number;
  items: {
    name: string;
    sku: string;
    quantity: number;
    unit_price_toman: number;
    unit_price_usd: number;
    total_toman: number;
    total_usd: number;
    options: { size?: string | null; color?: string | null };
  }[];
};

export async function fakePay(payload: CheckoutPayload) {
  const response = await api.post<{ message: string; data: Receipt }>(
    "/checkout/fake-pay",
    payload,
    { params: { locale: payload.locale } },
  );
  return response.data;
}
