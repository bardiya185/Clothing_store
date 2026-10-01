"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpLeft,
  Loader2,
  MoveUpRight,
  Sparkles,
} from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { useCatalogCategories, useCatalogProducts } from "@/hooks/useCatalog";
import ProductCard from "@/components/catalog/ProductCard";
import CampaignBlocks from "@/components/home/CampaignBlocks";

export default function HomePage() {
  const { locale, t } = useLocale();
  const { data: categories = [], isLoading: categoriesLoading } =
    useCatalogCategories(locale);
  const { data: featuredPage, isLoading: productsLoading } = useCatalogProducts(
    { locale, featured: true, sort: "featured" },
  );
  const featured = featuredPage?.pages[0]?.data ?? [];

  return (
    <div className="animate-page-entry">
      <section className="mx-auto max-w-[1440px] px-4 pt-4 md:px-8 md:pt-8">
        <div className="relative min-h-[680px] overflow-hidden rounded-[2rem] bg-[#c7b8a4] md:min-h-[calc(100vh-120px)]">
          <Image
            src="/Images/hero.jpg"
            alt="Baran Fall collection"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col justify-between gap-12 p-7 text-white md:flex-row md:items-end md:p-14">
            <div className="max-w-2xl">
              <div className="mb-6 flex items-center gap-3 text-xs font-bold tracking-[.18em] text-white/80">
                <span className="h-2 w-2 rounded-full bg-accent" />
                {t.home.eyebrow}
              </div>
              <h1 className="display-heading text-balance text-6xl font-black md:text-8xl lg:text-[9.5rem]">
                {t.home.titleA}
                <br />
                <span className="text-[#ff8a61]">{t.home.titleB}</span>
              </h1>
              <p className="mt-7 max-w-lg text-sm leading-7 text-white/75 md:text-base">
                {t.home.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-black transition hover:bg-accent hover:text-white"
                >
                  {t.actions.shopNow}
                  <ArrowLeft size={17} />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-3 rounded-full border border-white/40 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white hover:text-black"
                >
                  {t.actions.explore}
                  <MoveUpRight size={16} />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-5 border-t border-white/25 pt-5 text-center md:min-w-[330px] md:border-t-0 md:border-s md:pt-0 md:ps-7">
              <div>
                <strong className="block text-2xl font-black">+۱۲۰</strong>
                <span className="text-xs text-white/60">{t.home.models}</span>
              </div>
              <div>
                <strong className="block text-2xl font-black">۴.۹</strong>
                <span className="text-xs text-white/60">
                  {locale === "fa" ? "امتیاز کاربران" : "User rating"}
                </span>
              </div>
              <div>
                <strong className="block text-2xl font-black">۲۴س</strong>
                <span className="text-xs text-white/60">{t.home.shipping}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <CampaignBlocks />
      <section className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 md:py-32">
        <div className="mb-9 flex items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-accent">
              01 / {locale === "fa" ? "انتخاب کن" : "Choose your lane"}
            </p>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">
              {t.home.categories}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {t.home.categoryHint}
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden items-center gap-2 text-sm font-bold transition hover:text-accent sm:flex"
          >
            {t.actions.viewAll}
            <ArrowLeft size={16} />
          </Link>
        </div>
        {categoriesLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {categories.map((category, index) => (
              <Link
                href={`/shop?category=${category.slug}`}
                key={category.slug}
                className="group relative aspect-[.8] overflow-hidden rounded-[1.5rem] bg-card"
              >
                <Image
                  src={category.image ?? "/Images/hero.jpg"}
                  alt={category.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between text-white">
                  <div>
                    <span className="mb-2 block text-xs text-white/60">
                      ۰{index + 1} / {category.products_count}{" "}
                      {locale === "fa" ? "مدل" : "styles"}
                    </span>
                    <h3 className="text-xl font-bold md:text-2xl">
                      {category.name}
                    </h3>
                  </div>
                  <span className="rounded-full border border-white/40 p-2 transition group-hover:bg-accent group-hover:text-white">
                    <ArrowUpLeft size={18} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-32">
        <div className="mb-9 flex items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-accent">
              02 / {t.home.bestsellers}
            </p>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">
              {t.home.featured}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {t.home.featuredHint}
            </p>
          </div>
          <Link
            href="/shop"
            className="hidden items-center gap-2 text-sm font-bold transition hover:text-accent sm:flex"
          >
            {t.actions.viewAll}
            <ArrowLeft size={16} />
          </Link>
        </div>
        {productsLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="animate-spin text-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-7">
            {featured.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index === 0}
              />
            ))}
          </div>
        )}
      </section>
      <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-32">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#24231f] px-7 py-16 text-white md:px-16 md:py-24">
          <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full border-[50px] border-accent/70 blur-sm" />
          <Sparkles className="absolute left-12 top-12 text-accent" size={28} />
          <div className="relative max-w-3xl">
            <p className="mb-6 text-xs font-bold uppercase tracking-[.2em] text-accent">
              03 / BARAN MANIFESTO
            </p>
            <h2 className="display-heading text-5xl font-black md:text-7xl">
              {t.home.manifesto}
            </h2>
            <p className="mt-8 max-w-xl text-sm leading-8 text-white/60 md:text-base">
              {t.home.manifestoHint}
            </p>
            <Link
              href="/about"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-accent hover:text-white"
            >
              {t.actions.explore}
              <MoveUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-5 pb-28 md:px-10">
        <div className="flex flex-col justify-between gap-6 rounded-[1.5rem] border border-border p-7 md:flex-row md:items-center md:p-10">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-accent">
              BARAN / LETTERS
            </p>
            <h2 className="text-3xl font-black">{t.home.join}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t.home.joinHint}
            </p>
          </div>
          <form
            className="flex w-full max-w-md rounded-full border border-border bg-card p-1"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder={locale === "fa" ? "ایمیل شما" : "Your email"}
              className="min-w-0 flex-1 bg-transparent px-5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button className="flex shrink-0 items-center gap-1 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background transition hover:bg-accent hover:text-white">
              {locale === "fa" ? "عضویت" : "Join"}
              <ArrowUpLeft size={16} />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
