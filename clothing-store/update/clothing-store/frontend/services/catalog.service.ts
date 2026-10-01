import { api } from "./api";
import type {
  CatalogCategory,
  CatalogFilter,
  CatalogPage,
  Locale,
  Product,
  ProductVariant,
} from "@/lib/product";

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
    data: ApiProduct[];
    meta: CatalogPage["meta"];
  }>("/catalog/products", {
    params: { ...params, per_page: Math.min(params.per_page ?? 10, 10) },
  });
  return { ...response.data, data: response.data.data.map(normalizeProduct) };
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

export async function getCategories(locale: Locale) {
  const response = await api.get<{ data: CatalogCategory[] }>(
    "/catalog/categories",
    { params: { locale } },
  );
  return response.data.data;
}

export async function getCatalogFilters(locale: Locale) {
  const response = await api.get<{ data: CatalogFilter[] }>(
    "/catalog/filters",
    { params: { locale } },
  );
  return response.data.data;
}
