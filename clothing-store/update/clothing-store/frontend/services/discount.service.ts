import { api } from "./api";

export type DiscountPreview = {
  code: string;
  discount_toman: number;
  discount_usd: number;
};

export async function validateDiscountCode(payload: {
  code: string;
  subtotal_toman: number;
  subtotal_usd: number;
}) {
  const response = await api.post<{
    status: string;
    message: string;
    data: DiscountPreview;
  }>("/discount-codes/validate", payload);
  return response.data;
}
