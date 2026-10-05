"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowLeft, Loader2, MoveUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/hooks/useLocale";
import { getBanners, type StoreBanner } from "@/services/banner.service";

function BannerLink({ banner, children }: { banner: StoreBanner; children: React.ReactNode }) {
  const href = banner.href || "/shop";
  if (/^https?:\/\//.test(href)) return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
  return <Link href={href}>{children}</Link>;
}

export default function BannerSlot({ placement, compact = false }: { placement: string; compact?: boolean }) {
  const { locale } = useLocale();
  const [active, setActive] = useState(0);
  const query = useQuery({
    queryKey: ["store-banners", placement, locale],
    queryFn: () => getBanners(placement, locale),
    staleTime: 1000 * 60 * 3,
  });
  const banners = query.data ?? [];
  const activeIndex = banners.length ? active % banners.length : 0;

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % banners.length), 6000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (query.isLoading) return <div className="flex h-32 items-center justify-center rounded-[1.75rem] bg-card/60"><Loader2 className="animate-spin text-accent" size={20} /></div>;
  if (!banners.length) return null;

  return <section aria-label={locale === "fa" ? "بنرهای فروشگاه" : "Store banners"} className={`relative overflow-hidden rounded-[1.75rem] ${compact ? "aspect-[2.4/1]" : "aspect-[2.05/1] sm:aspect-[3.8/1]"}`}><div className="flex h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>{banners.map((banner) => <div key={banner.id} className="relative h-full min-w-full" style={{ backgroundColor: banner.accent_color }}><BannerLink banner={banner}><div className="absolute inset-0"><picture>{banner.mobile_image && <source media="(max-width: 640px)" srcSet={banner.mobile_image} />}{banner.image && <img src={banner.image} alt={banner.title || ""} className="h-full w-full object-cover opacity-90" />}</picture><div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-transparent" /></div><div className="relative flex h-full max-w-2xl flex-col justify-center px-6 py-7 text-start sm:px-10 md:px-14" style={{ color: banner.text_color }}><p className="text-[10px] font-bold uppercase tracking-[.25em] opacity-70">باران / {placement.replaceAll(".", " ")}</p>{banner.title && <h2 className="mt-3 max-w-lg text-3xl font-black leading-tight sm:text-5xl">{banner.title}</h2>}{banner.subtitle && <p className="mt-3 max-w-xl text-sm leading-7 opacity-80 sm:text-base">{banner.subtitle}</p>}{banner.cta && <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/90 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg">{banner.cta}<MoveUpRight size={15} /></span>}</div></BannerLink></div>)}</div>{banners.length > 1 && <div className="absolute bottom-4 end-5 flex items-center gap-1.5 rounded-full bg-black/20 px-2 py-1 backdrop-blur"><button type="button" aria-label={locale === "fa" ? "بنر قبلی" : "Previous banner"} onClick={() => setActive((current) => (current - 1 + banners.length) % banners.length)} className="rounded-full p-1.5 text-white hover:bg-white/20"><ArrowLeft className="rotate-180" size={14} /></button>{banners.map((banner, index) => <button key={banner.id} type="button" aria-label={`${index + 1}`} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />)}<button type="button" aria-label={locale === "fa" ? "بنر بعدی" : "Next banner"} onClick={() => setActive((current) => (current + 1) % banners.length)} className="rounded-full p-1.5 text-white hover:bg-white/20"><ArrowLeft size={14} /></button></div>}</section>;
}
