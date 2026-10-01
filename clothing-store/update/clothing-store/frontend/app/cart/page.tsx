"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2, Minus, Plus, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { formatAmount } from "@/lib/product";
import { useLocale } from "@/hooks/useLocale";
import { useCart } from "@/hooks/useCart";

export default function CartPage() {
  const { locale, t } = useLocale();
  const {
    items,
    removeItem,
    updateQuantity,
    discount,
    isLoading,
    applyDiscount,
    clearDiscount,
    count,
  } = useCart();
  const [discountInput, setDiscountInput] = useState(discount?.code ?? "");
  const [discountError, setDiscountError] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const tomanSubtotal = items.reduce((total, item) => total + item.totalToman, 0);
  const usdSubtotal = items.reduce((total, item) => total + item.totalUsd, 0);
  const tomanTotal = Math.max(0, tomanSubtotal - (discount?.discount_toman ?? 0));
  const usdTotal = Math.max(0, usdSubtotal - (discount?.discount_usd ?? 0));
  const formattedSubtotal = formatAmount(tomanSubtotal, usdSubtotal, locale);
  const formattedTotal = formatAmount(tomanTotal, usdTotal, locale);

  const handleApplyDiscount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!discountInput.trim()) return;
    setDiscountLoading(true);
    setDiscountError("");
    const applied = await applyDiscount(discountInput);
    if (applied) {
      setDiscountInput(discountInput.toUpperCase());
      setDiscountError("");
    } else {
      setDiscountError(locale === "fa" ? "کد تخفیف معتبر نیست." : "This code is not valid.");
    }
    setDiscountLoading(false);
  };

  if (isLoading)
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Loader2 className="animate-spin text-accent" />
      </div>
    );

  if (!items.length)
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-[1440px] flex-col items-center justify-center px-5 py-20 text-center">
        <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10 text-4xl">
          ✦
        </div>
        <h1 className="text-4xl font-black">{t.cart.empty}</h1>
        <p className="mt-3 text-muted-foreground">{t.cart.emptyHint}</p>
        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background transition hover:bg-accent hover:text-white"
        >
          {t.actions.continue}
          <ArrowLeft size={16} />
        </Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-14 md:px-10 md:py-20">
      <div className="mb-12 flex items-end justify-between border-b border-border pb-8">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-accent">
            BARAN / BAG
          </p>
          <h1 className="display-heading text-6xl font-black md:text-8xl">
            {t.cart.title}
          </h1>
        </div>
        <span className="text-sm text-muted-foreground">
          {count} {locale === "fa" ? "آیتم" : "items"}
        </span>
      </div>
      <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="divide-y divide-border">
          {items.map((item) => (
            <div
              key={`${item.product.id}-${item.variantId}`}
              className="flex gap-4 py-6 first:pt-0 md:gap-6"
            >
              <div className="relative h-32 w-28 shrink-0 overflow-hidden rounded-2xl bg-[#e8e5dc] md:h-40 md:w-36">
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  sizes="150px"
                  className="object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="font-bold hover:text-accent"
                      >
                        {item.product.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.size ||
                          item.color ||
                          (locale === "fa" ? "مدل پیش‌فرض" : "Default variant")}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        removeItem(item.product.id, item.variantId)
                      }
                      aria-label={t.actions.remove}
                      className="text-muted-foreground transition hover:text-red-500"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <p className="mt-3 font-bold text-accent ltr-number">
                    {formatAmount(item.unitPriceToman, item.unitPriceUsd, locale)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.variantId,
                          item.quantity - 1,
                        )
                      }
                      className="p-2.5"
                          aria-label={locale === "fa" ? "کم کردن" : "Decrease"}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.variantId,
                          item.quantity + 1,
                        )
                      }
                      className="p-2.5"
                      aria-label={locale === "fa" ? "افزایش" : "Increase"}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="text-sm font-bold ltr-number">
                    {formatAmount(
                      item.totalToman,
                      item.totalUsd,
                      locale,
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className="rounded-[1.5rem] bg-card p-6 shadow-sm ring-1 ring-border/60">
          <h2 className="text-xl font-black">{t.cart.summary}</h2>
          <form onSubmit={handleApplyDiscount} className="mt-6">
            <label className="mb-2 flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Tag size={14} className="text-accent" />
              {t.cart.discountCode}
            </label>
            <div className="flex gap-2">
              <input
                value={discountInput || discount?.code || ""}
                onChange={(event) => {
                  setDiscountInput(event.target.value.toUpperCase());
                  setDiscountError("");
                }}
                placeholder={t.cart.discountPlaceholder}
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm uppercase outline-none focus:border-accent"
                maxLength={40}
              />
              <button
                type="submit"
                disabled={discountLoading}
                className="rounded-xl bg-foreground px-4 py-2.5 text-xs font-bold text-background disabled:opacity-60"
              >
                {discountLoading ? <Loader2 size={15} className="animate-spin" /> : t.cart.applyDiscount}
              </button>
            </div>
            {discountError && <p className="mt-2 text-xs font-bold text-rose-600">{discountError}</p>}
            {discount && (
              <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                <span>{t.cart.discountApplied}: {discount.code}</span>
                <button type="button" onClick={() => { clearDiscount(); setDiscountInput(""); }} aria-label={t.common.remove}><X size={14} /></button>
              </div>
            )}
          </form>
          <div className="mt-7 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.cart.subtotal}</span>
              <span className="font-bold ltr-number">{formattedSubtotal}</span>
            </div>
            {discount && (
              <div className="flex justify-between text-emerald-600">
                <span>{t.cart.discount}</span>
                <span className="font-bold ltr-number">-{formatAmount(discount.discount_toman, discount.discount_usd, locale)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.cart.shipping}</span>
              <span className="font-bold text-emerald-600">{t.cart.free}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-5 text-lg">
              <span className="font-black">{t.cart.total}</span>
              <span className="font-black text-accent ltr-number">
                {formattedTotal}
              </span>
            </div>
          </div>
          <Link
            href="/checkout"
            className="mt-7 flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3.5 text-sm font-bold text-background transition hover:bg-accent hover:text-white"
          >
            {t.actions.checkout}
            <ArrowLeft size={16} />
          </Link>
          <Link
            href="/shop"
            className="mt-4 block text-center text-sm font-bold text-muted-foreground transition hover:text-accent"
          >
            {t.actions.continue}
          </Link>
        </aside>
      </div>
    </div>
  );
}
