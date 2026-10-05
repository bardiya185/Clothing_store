"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpLeft, Loader2, MoveUpRight, ShoppingBag } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { getCampaignLanding, trackCampaignEvent, type CampaignLanding, type CampaignProduct } from "@/services/campaign.service";
import { getLocaleConfig } from "@/lib/i18n";

function formatPrice(value: number, locale: string, currency: "toman" | "usd") {
  if (currency === "usd") return `$${value.toLocaleString("en-US")}`;
  return `${value.toLocaleString(getLocaleConfig(locale).numberLocale)} ${locale === "fa" ? "تومان" : "Toman"}`;
}

function CampaignProductCard({ product, locale, campaignSlug, variant }: { product: CampaignProduct; locale: string; campaignSlug: string; variant: string }) {
  return <Link onClick={() => { void trackCampaignEvent(campaignSlug, "click", { variant, productId: product.id, metadata: { placement: "product" } }); }} href={`/product/${product.slug}`} className="group overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"><div className="relative aspect-[4/5] overflow-hidden bg-muted/20">{product.image ? <img src={product.image} alt={product.name || ""} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ShoppingBag size={28} /></div>}<span className="absolute start-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-black text-background">{product.discount_percent}% {locale === "fa" ? "تخفیف" : "OFF"}</span></div><div className="p-4"><h3 className="truncate text-sm font-black">{product.name || product.slug}</h3><div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-sm font-black text-accent">{formatPrice(product.sale_toman, locale, "toman")}</span><span className="text-xs text-muted-foreground line-through">{formatPrice(product.price_toman, locale, "toman")}</span></div><div className="mt-2 flex items-center justify-between text-xs text-muted-foreground"><span>{product.rating ? `★ ${product.rating}` : (locale === "fa" ? "بدون امتیاز" : "Not rated")}</span><span className="font-bold transition group-hover:text-accent">{locale === "fa" ? "مشاهده" : "View"} <ArrowUpLeft className="inline" size={13} /></span></div></div></Link>;
}

function RelatedCampaignBanner({ campaign, locale, index, sourceSlug, variant }: { campaign: CampaignLanding["related_campaigns"][number]; locale: string; index: number; sourceSlug: string; variant: string }) {
  return <Link onClick={() => { void trackCampaignEvent(sourceSlug, "click", { variant, metadata: { placement: "related_campaign", target: campaign.slug } }); }} href={`/campaign/${campaign.slug}`} className="group relative min-h-52 overflow-hidden rounded-[2rem] p-6 text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl md:min-h-64 md:p-8" style={{ backgroundColor: campaign.accent_color, animationDelay: `${index * 100}ms` }}><div className="absolute -end-12 -top-16 h-48 w-48 rounded-full border-[28px] border-white/15 transition duration-500 group-hover:scale-125" /><div className="absolute -bottom-20 -start-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" /><div className="relative flex h-full flex-col justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-white/70">باران / کمپین</p><h3 className="mt-5 max-w-xs text-3xl font-black md:text-4xl">{campaign.name}</h3>{campaign.description && <p className="mt-3 line-clamp-2 max-w-md text-sm leading-7 text-white/80">{campaign.description}</p>}</div><span className="mt-8 inline-flex items-center gap-2 text-sm font-black">{campaign.discount_percent}% {locale === "fa" ? "تخفیف · مشاهده کمپین" : "off · Explore campaign"}<MoveUpRight size={17} /></span></div></Link>;
}

function LandingBlock({ block, locale }: { block: CampaignLanding["blocks"][number]; locale: string }) {
  if (block.type === "image" && block.image) return <section className="animate-page-entry overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-sm"><img src={block.image} alt={block.title || ""} className="max-h-[560px] w-full object-cover" />{(block.title || block.body) && <div className="p-6 md:p-9">{block.title && <h2 className="text-3xl font-black">{block.title}</h2>}{block.body && <p className="mt-4 whitespace-pre-line text-sm leading-8 text-muted-foreground">{block.body}</p>}</div>}</section>;
  if (block.type === "cta") return <section className="animate-page-entry rounded-[2rem] bg-foreground p-7 text-background shadow-xl md:p-10"><h2 className="text-3xl font-black">{block.title || (locale === "fa" ? "انتخاب بعدی شما" : "Your next pick")}</h2>{block.body && <p className="mt-4 max-w-2xl text-sm leading-8 opacity-70">{block.body}</p>}<Link href={block.href || "/shop"} className="mt-7 inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-bold text-foreground">{block.label || (locale === "fa" ? "مشاهده محصولات" : "Shop products")}<MoveUpRight size={16} /></Link></section>;
  return <section className="animate-page-entry rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm md:p-10">{block.title && <h2 className="text-3xl font-black">{block.title}</h2>}{block.body && <p className="mt-4 whitespace-pre-line text-sm leading-8 text-muted-foreground md:text-base">{block.body}</p>}</section>;
}

function LandingContent({ landing, locale }: { landing: CampaignLanding; locale: string }) {
  const [variant] = useState(() => {
    if (typeof window === "undefined") return "A";
    const key = `baran-campaign-variant-${landing.campaign.slug}`;
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = Math.random() < 0.5 ? "A" : "B";
    window.localStorage.setItem(key, next);
    return next;
  });
  const banners = landing.related_campaigns.slice(0, 2);
  useEffect(() => {
    void trackCampaignEvent(landing.campaign.slug, "impression", { variant, metadata: { placement: "landing" } }).catch(() => undefined);
  }, [landing.campaign.slug, variant]);
  return <main dir={getLocaleConfig(locale).direction} className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-10 md:py-14"><section className="animate-page-entry relative overflow-hidden rounded-[2.25rem] px-6 py-16 text-white shadow-2xl sm:px-12 md:py-28" style={{ backgroundColor: landing.campaign.accent_color }}><div className="absolute -end-20 -top-28 h-80 w-80 rounded-full border-[48px] border-white/15" /><div className="absolute -bottom-32 -start-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" /><div className="relative max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.25em] text-white/75">باران / کمپین · {landing.campaign.discount_percent}% {locale === "fa" ? "تخفیف" : "OFF"}</p><h1 className="mt-5 text-5xl font-black leading-[.95] md:text-8xl">{landing.title}</h1>{landing.description && <p className="mt-6 max-w-2xl text-sm leading-8 text-white/80 md:text-lg">{landing.description}</p>}<Link onClick={() => { void trackCampaignEvent(landing.campaign.slug, "click", { variant, metadata: { placement: "hero" } }); }} href="#campaign-products" className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-slate-950">{locale === "fa" ? "مشاهده محصولات" : "Shop products"}<ArrowLeft size={17} /></Link></div></section>{banners.length > 0 && <section className="mt-8 grid gap-4 md:grid-cols-2 md:gap-6">{banners.map((campaign, index) => <RelatedCampaignBanner key={campaign.slug} campaign={campaign} locale={locale} index={index} sourceSlug={landing.campaign.slug} variant={variant} />)}</section>}<section id="campaign-products" className="mt-12"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">باران / ویرایش</p><h2 className="mt-2 text-3xl font-black md:text-5xl">{locale === "fa" ? "محصولات این کمپین" : "Campaign products"}</h2></div><span className="text-sm text-muted-foreground">{landing.products.length} {locale === "fa" ? "محصول" : "products"}</span></div>{landing.products.length > 0 ? <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">{landing.products.map((product) => <CampaignProductCard key={product.id} product={product} locale={locale} campaignSlug={landing.campaign.slug} variant={variant} />)}</div> : <div className="mt-6 rounded-[2rem] border border-dashed border-border p-12 text-center text-sm text-muted-foreground">{locale === "fa" ? "هنوز محصولی به این کمپین اضافه نشده است." : "No products have been added to this campaign yet."}</div>}</section><div className="mx-auto mt-12 grid max-w-4xl gap-6">{landing.blocks.filter((block) => block.type !== "products").map((block, index) => <LandingBlock key={`${block.type}-${index}`} block={block} locale={locale} />)}</div></main>;
}

export default function CampaignLandingPage() {
  const params = useParams<{ slug: string }>();
  const { locale } = useLocale();
  const query = useQuery({ queryKey: ["campaign-landing", params.slug, locale], queryFn: () => getCampaignLanding(params.slug, locale), retry: 1 });

  if (query.isLoading) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>;
  if (query.isError || !query.data) return <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 text-center"><h1 className="text-3xl font-black">{locale === "fa" ? "صفحه کمپین پیدا نشد" : "Campaign not found"}</h1><Link href="/shop" className="mt-6 rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background">{locale === "fa" ? "بازگشت به فروشگاه" : "Back to shop"}</Link></div>;
  return <LandingContent landing={query.data} locale={locale} />;
}
