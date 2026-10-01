"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Clock3, Loader2, MoveUpRight, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useActiveCampaigns } from "@/hooks/useCampaigns";
import { formatAmount } from "@/lib/product";
import type { Campaign } from "@/services/campaign.service";

function Countdown({ campaign }: { campaign: Campaign }) {
  const { locale } = useLocale();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(campaign.ends_at).getTime() - Date.now()),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, new Date(campaign.ends_at).getTime() - Date.now()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [campaign.ends_at]);

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const number = (value: number) => String(value).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 text-xs font-bold" dir="ltr">
      <Clock3 size={15} className="text-accent" />
      <span className="text-muted-foreground">
        {locale === "fa" ? "پایان پیشنهاد:" : "Ends in:"}
      </span>
      <span className="ltr-number rounded-lg bg-foreground px-2 py-1 text-background">
        {days > 0 ? `${number(days)}d ` : ""}
        {number(hours)}:{number(minutes)}:{number(seconds)}
      </span>
    </div>
  );
}

function CampaignBlock({ campaign }: { campaign: Campaign }) {
  const { locale } = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startDate = dateFormatter.format(new Date(campaign.starts_at));
  const endDate = dateFormatter.format(new Date(campaign.ends_at));

  return (
    <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
      <div
        className="relative overflow-hidden px-6 py-8 text-white sm:px-9 md:py-10"
        style={{ backgroundColor: campaign.accent_color || "#e65d2f" }}
      >
        <div className="absolute -end-16 -top-24 h-64 w-64 rounded-full border-[42px] border-white/15" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-xl">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-white/75">
              <Tag size={15} />
              {locale === "fa" ? "کمپین محدود باران" : "Limited Baran campaign"}
            </div>
            <h2 className="display-heading text-4xl font-black sm:text-6xl">{campaign.name}</h2>
            {campaign.description && <p className="mt-4 max-w-lg text-sm leading-7 text-white/80">{campaign.description}</p>}
          </div>
          <div className="shrink-0 rounded-2xl bg-white/15 p-4 backdrop-blur">
            <p className="text-xs text-white/75">{locale === "fa" ? `از ${startDate} تا ${endDate}` : `${startDate} – ${endDate}`}</p>
            <p className="mt-1 text-3xl font-black">{campaign.discount_percent}% <span className="text-sm font-bold">{locale === "fa" ? "تخفیف" : "OFF"}</span></p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Countdown campaign={campaign} />
          <Link href="/shop?sale=true" className="inline-flex items-center gap-2 text-sm font-bold transition hover:text-accent">
            {locale === "fa" ? "مشاهده همه پیشنهادها" : "Shop the campaign"}
            <ArrowLeft size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {campaign.products.slice(0, 4).map((product) => (
            <Link key={product.id} href={`/product/${product.slug}`} className="group min-w-0">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#e8e5dc]">
                <Image src={product.image || "/Images/hero.jpg"} alt={product.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <span className="absolute start-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-black text-white">-{product.discount_percent}%</span>
              </div>
              <p className="mt-3 truncate text-sm font-bold group-hover:text-accent">{product.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-black">
                <span className="text-accent">{formatAmount(product.sale_toman, product.sale_usd, locale)}</span>
                <span className="text-xs text-muted-foreground line-through">{formatAmount(product.price_toman, product.price_usd, locale)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CampaignBlocks() {
  const { locale } = useLocale();
  const { data: campaigns = [], isLoading } = useActiveCampaigns(locale);
  if (isLoading) return <div className="flex h-48 items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>;
  if (!campaigns.length) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-5 pb-24 md:px-10 md:pb-32">
      <div className="mb-9 flex items-end justify-between gap-5">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-accent">01 / BARAN CAMPAIGNS</p>
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">{locale === "fa" ? "پیشنهادهای زمان‌دار" : "Timed campaigns"}</h2>
        </div>
        <MoveUpRight className="hidden text-accent sm:block" size={25} />
      </div>
      <div className="grid gap-7">{campaigns.map((campaign) => <CampaignBlock key={campaign.slug} campaign={campaign} />)}</div>
    </section>
  );
}
