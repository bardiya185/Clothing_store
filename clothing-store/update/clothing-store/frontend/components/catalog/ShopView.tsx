"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Loader2, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import {
  useCatalogCategories,
  useCatalogFilters,
  useCatalogProducts,
} from "@/hooks/useCatalog";
import { getApiErrorMessage } from "@/lib/api-error";
import ProductCard from "./ProductCard";

export default function ShopView({
  initialGender,
  searchPage = false,
}: {
  initialGender?: "men" | "women";
  searchPage?: boolean;
}) {
  const { locale, t } = useLocale();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "";

  const [activeTab, setActiveTab] = useState<"all" | "new" | "sale">("all");
  const [sort, setSort] = useState("featured");
  const [category, setCategory] = useState(initialCategory);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } =
    useCatalogCategories(locale);
  const { data: filters = [] } = useCatalogFilters(locale);
  const query = useCatalogProducts({
    locale,
    category: category || undefined,
    gender: initialGender,
    new: activeTab === "new" ? true : undefined,
    sale: activeTab === "sale" ? true : undefined,
    sort,
    size: selectedFilters.size?.join(",") || undefined,
    color: selectedFilters.color?.join(",") || undefined,
    material: selectedFilters.material?.join(",") || undefined,
  });
  const {
    data: queryData,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = query;

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "500px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const products = useMemo(
    () => queryData?.pages.flatMap((page) => page.data) ?? [],
    [queryData],
  );
  const heading = searchPage
    ? locale === "fa"
      ? "جست‌وجوی محصولات"
      : "Search products"
    : initialGender === "men"
      ? t.nav.men
      : initialGender === "women"
        ? t.nav.women
        : t.shop.title;
  const activeFilterCount =
    Object.values(selectedFilters).flat().length + (category ? 1 : 0);
  const apiErrorMessage = getApiErrorMessage(
    query.error,
    locale === "fa"
      ? "ارتباط با فروشگاه برقرار نشد."
      : "Could not connect to the store.",
  );
  const activeChips = Object.entries(selectedFilters).flatMap(
    ([slug, values]) => values.map((value) => ({ slug, value })),
  );

  const toggleFilter = (filterSlug: string, valueSlug: string) => {
    setSelectedFilters((current) => {
      const values = current[filterSlug] ?? [];
      return {
        ...current,
        [filterSlug]: values.includes(valueSlug)
          ? values.filter((value) => value !== valueSlug)
          : [...values, valueSlug],
      };
    });
  };

  const resetFilters = () => {
    setCategory("");
    setSelectedFilters({});
    setActiveTab("all");
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-5 md:px-10 md:py-16">
      <div className="mb-8 flex flex-col justify-between gap-6 border-b border-border pb-8 md:flex-row md:items-end">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-accent">
            BARAN / COLLECTION
          </p>
          <h1 className="display-heading text-5xl font-black sm:text-6xl md:text-8xl">
            {heading}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {t.shop.subtitle}
          </p>
        </div>
        <div className="w-fit rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
          {queryData?.pages[0]?.meta.total ?? "—"}{" "}
          {locale === "fa" ? "محصول" : "pieces"}
        </div>
      </div>

      <div className="mb-7 rounded-[1.5rem] border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(["all", "new", "sale"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition ${activeTab === tab ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:border-accent hover:text-accent"}`}
              >
                {tab === "all"
                  ? t.shop.all
                  : tab === "new"
                    ? t.shop.new
                    : t.shop.sale}
              </button>
            ))}
          </div>
          <div className="flex min-w-0 gap-2">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label={t.shop.sort}
              className="hidden rounded-full border border-border bg-background px-4 text-sm outline-none sm:block"
            >
              <option value="featured">{t.shop.featured}</option>
              <option value="newest">{t.shop.newest}</option>
              <option value="price_asc">{t.shop.lowToHigh}</option>
              <option value="price_desc">{t.shop.highToLow}</option>
            </select>
            <button
              onClick={() => setFiltersOpen((open) => !open)}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-bold transition hover:border-accent hover:text-accent lg:hidden"
            >
              <SlidersHorizontal size={17} />
              {t.filters.mobile}
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          {categoriesLoading ? (
            <span className="text-xs text-muted-foreground">
              {t.filters.loadingCategories}
            </span>
          ) : (
            <>
              <button
                onClick={() => setCategory("")}
                className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${!category ? "bg-accent text-white" : "border border-border text-muted-foreground hover:border-accent"}`}
              >
                {t.shop.all}
              </button>
              {categories.map((item) => (
                <button
                  key={item.slug}
                  onClick={() => setCategory(item.slug)}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${category === item.slug ? "bg-accent text-white" : "border border-border text-muted-foreground hover:border-accent"}`}
                >
                  {item.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-muted-foreground">
            {locale === "fa" ? "فیلترهای فعال:" : "Active filters:"}
          </span>
          {category && (
            <button
              onClick={() => setCategory("")}
              className="rounded-full bg-accent/10 px-3 py-1.5 font-bold text-accent"
            >
              {categories.find((item) => item.slug === category)?.name ??
                category}{" "}
              ×
            </button>
          )}
          {activeChips.map((chip) => (
            <button
              key={`${chip.slug}-${chip.value}`}
              onClick={() => toggleFilter(chip.slug, chip.value)}
              className="rounded-full bg-accent/10 px-3 py-1.5 font-bold text-accent"
            >
              {chip.value} ×
            </button>
          ))}
          <button
            onClick={resetFilters}
            className="font-bold text-muted-foreground underline"
          >
            {t.filters.clear}
          </button>
        </div>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main className="order-2 min-w-0 lg:order-1">
          {query.isError ? (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-red-300 text-center">
              <p className="text-xl font-bold">{apiErrorMessage}</p>
              <button
                onClick={() => query.refetch()}
                className="mt-5 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background"
              >
                {t.common.retry}
              </button>
            </div>
          ) : products.length ? (
            <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-14">
                {products.map((product, index) => (
                  <motion.div
                    key={`${product.id}-${index}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.035, 0.35) }}
                  >
                    <ProductCard product={product} priority={index < 2} />
                  </motion.div>
                ))}
              </div>
              <div
                ref={loadMoreRef}
                className="flex min-h-24 items-center justify-center"
              >
                {isFetchingNextPage && (
                  <Loader2 className="animate-spin text-accent" size={25} />
                )}
                {!hasNextPage && !query.isLoading && (
                  <span className="text-xs text-muted-foreground">
                    {locale === "fa"
                      ? "به انتهای لیست رسیدی."
                      : "You reached the end."}
                  </span>
                )}
              </div>
            </>
          ) : query.isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-[4/5] rounded-[1.5rem] bg-border/50" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-border/50" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-border/50" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border text-center">
              <p className="text-2xl font-bold">{t.shop.empty}</p>
              <button
                onClick={resetFilters}
                className="mt-5 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background"
              >
                {t.common.clear}
              </button>
            </div>
          )}
        </main>
        <aside
          className={`${filtersOpen ? "block" : "hidden"} order-1 lg:order-2 lg:block`}
        >
          <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-accent" />
                  <h2 className="font-black">{t.filters.title}</h2>
                </div>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {t.filters.hint}
                </p>
              </div>
              <button
                onClick={resetFilters}
                className="shrink-0 text-xs font-bold text-accent"
              >
                {t.filters.clear}
              </button>
            </div>
            <div className="space-y-5">
              {filters.map((filter) => (
                <details
                  key={filter.slug}
                  open
                  className="group border-t border-border pt-4 first:border-t-0 first:pt-0"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
                    <span>{filter.name}</span>
                    <ChevronDown
                      size={15}
                      className="transition group-open:rotate-180"
                    />
                  </summary>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {filter.values.map((value) => {
                      const active = selectedFilters[filter.slug]?.includes(
                        value.slug,
                      );
                      return (
                        <button
                          key={value.slug}
                          onClick={() => toggleFilter(filter.slug, value.slug)}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${active ? "border-accent bg-accent text-white" : "border-border text-muted-foreground hover:border-accent hover:text-accent"}`}
                        >
                          {filter.type === "color" && (
                            <span
                              className="h-3 w-3 rounded-full border border-black/10"
                              style={{ backgroundColor: value.color ?? "#aaa" }}
                            />
                          )}
                          {value.name}
                        </button>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
