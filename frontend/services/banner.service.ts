import { api } from "./api";
import type { Locale } from "@/lib/product";

export type StoreBanner = {
  id: number;
  placement: string;
  title: string | null;
  subtitle: string | null;
  image: string | null;
  mobile_image: string | null;
  href: string | null;
  cta: string | null;
  accent_color: string;
  text_color: string;
  metadata: Record<string, unknown>;
};

export async function getBanners(placement: string, locale: Locale): Promise<StoreBanner[]> {
  const response = await api.get<{ data: StoreBanner[] }>("/catalog/banners", { params: { placement, locale } });
  return Array.isArray(response.data?.data) ? response.data.data : [];
}
