import { api } from "./api";
import type { Locale } from "@/lib/product";

export type CampaignProduct = {
  id: number;
  slug: string;
  name: string;
  image?: string | null;
  price_toman: number;
  price_usd: number;
  sale_toman: number;
  sale_usd: number;
  discount_percent: number;
  rating: number;
};

export type Campaign = {
  slug: string;
  name: string;
  description?: string | null;
  discount_percent: number;
  accent_color: string;
  starts_at: string;
  ends_at: string;
  products: CampaignProduct[];
};

export async function getActiveCampaigns(locale: Locale) {
  const response = await api.get<{ data: Campaign[] }>(
    "/catalog/campaigns/active",
    { params: { locale } },
  );
  return response.data.data;
}
