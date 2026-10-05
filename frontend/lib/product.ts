import { getLocaleConfig, type Locale } from "@/lib/i18n";

export type { Locale };
export type Gender = "men" | "women" | "unisex";

export type Product = {
  id: number;
  slug: string;
  sku: string;
  gender: Gender;
  category: { slug: string; name: string } | null;
  name: string;
  shortDescription: string;
  description: string;
  image: string;
  images: { url: string; alt?: string | null }[];
  priceToman: number;
  priceUsd: number;
  compareToman?: number | null;
  compareUsd?: number | null;
  stock: number;
  rating: number;
  reviews: number;
  isNew: boolean;
  isFeatured: boolean;
  variants: ProductVariant[];
};

export type ProductVariant = {
  id: number;
  sku: string;
  stock: number;
  prices: {
    toman: number;
    usd: number;
    compare_at_toman?: number | null;
    compare_at_usd?: number | null;
    currency?: string;
  };
  attributes: {
    slug: string | null;
    name: string | null;
    value: string | null;
    color: string | null;
  }[];
};

export type CatalogCategory = {
  slug: string;
  name: string;
  description?: string | null;
  image?: string | null;
  products_count: number;
};

export type CatalogFilter = {
  slug: string;
  name: string;
  type: string;
  values: { slug: string; name: string; color?: string | null }[];
};

export type CatalogPage = {
  data: Product[];
  meta: {
    locale: Locale;
    currency: string;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export function formatPrice(
  product: Pick<Product, "priceToman" | "priceUsd">,
  locale: Locale,
) {
  const config = getLocaleConfig(locale);
  if (config.currency === "IRT") {
    return `${new Intl.NumberFormat(config.numberLocale).format(product.priceToman)} تومان`;
  }
  return new Intl.NumberFormat(config.numberLocale, {
    style: "currency",
    currency: config.currency,
  }).format(product.priceUsd);
}

export function formatAmount(toman: number, usd: number, locale: Locale) {
  const config = getLocaleConfig(locale);
  return config.currency === "IRT"
    ? `${new Intl.NumberFormat(config.numberLocale).format(toman)} تومان`
    : new Intl.NumberFormat(config.numberLocale, {
        style: "currency",
        currency: config.currency,
      }).format(usd);
}
