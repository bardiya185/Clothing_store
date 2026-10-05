import { api } from "./api";
import type {
  CatalogCategory,
  CatalogFilter,
  CatalogPage,
  Locale,
  Product,
  ProductVariant,
} from "@/lib/product";
import { getLocaleConfig } from "@/lib/i18n";

export type CatalogParams = {
  locale: Locale;
  page?: number;
  per_page?: number;
  category?: string;
  gender?: string;
  search?: string;
  featured?: boolean;
  new?: boolean;
  sale?: boolean;
  sort?: string;
  size?: string;
  color?: string;
  material?: string;
};

export type ApiProduct = {
  id: number;
  slug: string;
  sku: string;
  gender: Product["gender"];
  is_featured?: boolean;
  is_new?: boolean;
  category?: { slug: string; name: string } | null;
  name: string;
  short_description?: string | null;
  description?: string | null;
  prices?: {
    toman: number;
    usd: number;
    compare_at_toman?: number | null;
    compare_at_usd?: number | null;
  } | null;
  stock?: number;
  rating?: number;
  reviews?: number;
  images?: { url: string; alt?: string | null }[];
  variants?: ProductVariant[];
};

export function normalizeProduct(item: ApiProduct): Product {
  return {
    id: item.id,
    slug: item.slug,
    sku: item.sku,
    gender: item.gender,
    category: item.category ?? null,
    name: item.name,
    shortDescription: item.short_description ?? "",
    description: item.description ?? "",
    image: item.images?.[0]?.url ?? "/Images/hero.jpg",
    images: item.images ?? [],
    priceToman: item.prices?.toman ?? 0,
    priceUsd: item.prices?.usd ?? 0,
    compareToman: item.prices?.compare_at_toman,
    compareUsd: item.prices?.compare_at_usd,
    stock: item.stock ?? 0,
    rating: item.rating ?? 0,
    reviews: item.reviews ?? 0,
    isNew: Boolean(item.is_new),
    isFeatured: Boolean(item.is_featured),
    variants: item.variants ?? [],
  };
}

export async function getCatalogProducts(
  params: CatalogParams,
): Promise<CatalogPage> {
  const response = await api.get<{
    data: ApiProduct[] | { data: ApiProduct[]; meta?: CatalogPage["meta"] };
    meta?: CatalogPage["meta"];
  }>("/catalog/products", {
    params: { ...params, per_page: Math.min(params.per_page ?? 10, 10) },
  });
  const payload = response.data;
  const nested = payload?.data;
  const rawProducts = Array.isArray(nested)
    ? nested
    : Array.isArray((nested as { data?: ApiProduct[] } | undefined)?.data)
      ? (nested as { data: ApiProduct[] }).data
      : [];
  const rawMeta = payload?.meta ?? (nested as { meta?: CatalogPage["meta"] } | undefined)?.meta;

  return {
    ...payload,
    data: rawProducts.map(normalizeProduct),
    meta: rawMeta ?? {
      locale: params.locale,
      currency: getLocaleConfig(params.locale).currency,
      current_page: params.page ?? 1,
      last_page: params.page ?? 1,
      per_page: params.per_page ?? 10,
      total: rawProducts.length,
    },
  };
}

export async function getCatalogProduct(
  slug: string,
  locale: Locale,
): Promise<Product> {
  const response = await api.get<{ data: ApiProduct }>(
    `/catalog/products/${encodeURIComponent(slug)}`,
    { params: { locale } },
  );
  return normalizeProduct(response.data.data);
}

export async function getCategories(locale: Locale): Promise<CatalogCategory[]> {
  const response = await api.get<{ data: CatalogCategory[] }>(
    "/catalog/categories",
    { params: { locale } },
  );
  const data = response.data?.data;
  return Array.isArray(data) ? data : [];
}

export async function getCatalogFilters(locale: Locale): Promise<CatalogFilter[]> {
  const response = await api.get<{ data: CatalogFilter[] }>(
    "/catalog/filters",
    { params: { locale } },
  );
  const data = response.data?.data;
  return Array.isArray(data) ? data : [];
}
