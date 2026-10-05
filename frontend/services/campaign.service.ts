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

export type CampaignLanding = {
  slug: string;
  title: string;
  description?: string | null;
  blocks: { type: "hero" | "text" | "image" | "products" | "cta"; title?: string; body?: string; image?: string; href?: string; label?: string }[];
  seo_title?: string | null;
  products: CampaignProduct[];
  related_campaigns: { slug: string; name: string; description?: string | null; discount_percent: number; accent_color: string }[];
  campaign: { slug: string; name: string; discount_percent: number; accent_color: string };
};

export async function getCampaignLanding(slug: string, locale: Locale): Promise<CampaignLanding> {
  const response = await api.get<{ data: CampaignLanding }>(`/catalog/campaigns/${encodeURIComponent(slug)}/landing`, { params: { locale } });
  return response.data.data;
}

export async function getActiveCampaigns(locale: Locale): Promise<Campaign[]> {
  const response = await api.get<{ data: Campaign[] }>(
    "/catalog/campaigns/active",
    { params: { locale } },
  );
  const data = response.data?.data;
  return Array.isArray(data) ? data : [];
}

export type CampaignEventType = "impression" | "click" | "view" | "add_to_cart";

export async function trackCampaignEvent(
  slug: string,
  eventType: CampaignEventType,
  options: { variant?: string; productId?: number; metadata?: Record<string, unknown> } = {},
) {
  let session = "";
  if (typeof window !== "undefined") {
    session = window.localStorage.getItem("baran-campaign-session") ?? "";
    if (!session) {
      session = crypto.randomUUID();
      window.localStorage.setItem("baran-campaign-session", session);
    }
  }
  await api.post(`/catalog/campaigns/${encodeURIComponent(slug)}/events`, {
    event_type: eventType,
    variant: options.variant,
    product_id: options.productId,
    metadata: options.metadata,
  }, { headers: session ? { "X-Campaign-Session": session } : undefined });
}
