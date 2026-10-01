import { api } from "./api";

export type Review = {
  id: number;
  rating: number;
  title?: string | null;
  body: string;
  author: string;
  created_at?: string | null;
};

export async function getProductReviews(slug: string) {
  const response = await api.get<{ data: Review[] }>(
    `/catalog/products/${encodeURIComponent(slug)}/reviews`,
  );
  return response.data.data;
}

export async function createProductReview(
  slug: string,
  payload: { rating: number; title?: string; body: string },
) {
  const response = await api.post<{ data: Review; message: string }>(
    `/catalog/products/${encodeURIComponent(slug)}/reviews`,
    payload,
  );
  return response.data;
}
