"use client";

import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";

export default function AboutPage() {
  const { locale, t } = useLocale();
  const points = [t.about.point1, t.about.point2, t.about.point3];
  return (
    <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 md:py-28">
      <div className="grid gap-16 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-[.2em] text-accent">
            {t.about.eyebrow}
          </p>
          <h1 className="display-heading max-w-4xl text-7xl font-black md:text-[9rem]">
            {t.about.title}
          </h1>
        </div>
        <div>
          <p className="text-lg leading-9 text-muted-foreground md:text-xl">
            {t.about.body}
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background transition hover:bg-accent hover:text-white"
          >
            {t.actions.shopNow}
            <ArrowLeft size={17} />
          </Link>
        </div>
      </div>
      <div className="mt-20 grid gap-3 border-y border-border py-6 md:grid-cols-3 md:gap-8">
        {points.map((point, index) => (
          <div key={point} className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Check size={16} />
            </span>
            <span className="font-bold">
              0{index + 1} / {point}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-20 grid min-h-[420px] place-items-center overflow-hidden rounded-[2rem] bg-[#d8c9b6]">
        <div className="text-center">
          <p className="text-[10rem] font-black tracking-[.15em] text-black/10 md:text-[16rem]">
            BARAN
          </p>
          <p className="-mt-24 text-sm font-bold tracking-[.3em] text-black/50">
            {locale === "fa"
              ? "ساده بپوش، متفاوت دیده شو"
              : "DRESS SIMPLE / BE SEEN"}
          </p>
        </div>
      </div>
    </div>
  );
}
