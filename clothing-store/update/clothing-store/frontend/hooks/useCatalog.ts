import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getCatalogFilters,
  getCatalogProduct,
  getCatalogProducts,
  getCategories,
  type CatalogParams,
} from "@/services/catalog.service";
import type { Locale } from "@/lib/product";

export function useCatalogCategories(locale: Locale) {
  return useQuery({
    queryKey: ["catalog-categories", locale],
    queryFn: () => getCategories(locale),
    retry: 1,
  });
}

export function useCatalogFilters(locale: Locale) {
  return useQuery({
    queryKey: ["catalog-filters", locale],
    queryFn: () => getCatalogFilters(locale),
    retry: 1,
  });
}

export function useCatalogProducts(
  params: Omit<CatalogParams, "page">,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: ["catalog-products", params],
    queryFn: ({ pageParam }) =>
      getCatalogProducts({ ...params, page: pageParam, per_page: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
    retry: 1,
    enabled,
  });
}

export function useCatalogProduct(slug: string, locale: Locale) {
  return useQuery({
    queryKey: ["catalog-product", slug, locale],
    queryFn: () => getCatalogProduct(slug, locale),
    retry: 1,
  });
}
