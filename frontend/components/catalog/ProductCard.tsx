"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import type { Product } from "@/lib/product";
import { formatPrice } from "@/lib/product";
import { useLocale } from "@/hooks/useLocale";
import {
  useCurrentUser,
  useToggleWishlist,
  useWishlist,
} from "@/hooks/useAccount";
import { useRouter } from "next/navigation";

export default function ProductCard({
  product,
  priority = false,
  compact = false,
  hideWishlist = false,
}: {
  product: Product;
  priority?: boolean;
  compact?: boolean;
  hideWishlist?: boolean;
}) {
  const { locale } = useLocale();
  const { data: user } = useCurrentUser();
  const wishlistQuery = useWishlist(Boolean(user));
  const isLiked = Boolean(
    wishlistQuery.data?.some((item) => item.id === product.id),
  );
  const wishlist = useToggleWishlist(product.id, isLiked);
  const router = useRouter();

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(`/product/${product.slug}`);
    }
  };

  return (
    <article
      className="group min-w-0 cursor-pointer rounded-[1.4rem] outline-none transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4"
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/product/${product.slug}`)}
      onKeyDown={handleCardKeyDown}
    >
      <div
        className={`relative mb-3 overflow-hidden rounded-[1.4rem] bg-[#e8e5dc] dark:bg-zinc-800 ${compact ? "aspect-[1.05]" : "aspect-[4/5]"}`}
      >
        <Link
          href={`/product/${product.slug}`}
          aria-label={product.name}
          className="absolute inset-0 z-[1]"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        </Link>
        <div className="hero-gradient pointer-events-none absolute inset-0 z-[2] opacity-40 transition duration-500 group-hover:opacity-70" />
        <div className="absolute left-4 right-4 top-4 z-[3] flex items-start justify-between">
          <div className="flex gap-2">
            {product.isNew && (
              <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-black backdrop-blur dark:bg-black/70 dark:text-white">
                {locale === "fa" ? "جدید" : "New"}
              </span>
            )}
            {product.compareToman && (
              <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-white">
                {locale === "fa" ? "پیشنهاد ویژه" : "Sale"}
              </span>
            )}
          </div>
          {!hideWishlist && (
            <button
              aria-label={
                isLiked
                  ? locale === "fa"
                    ? "حذف از علاقه‌مندی‌ها"
                    : "Remove from wishlist"
                  : locale === "fa"
                    ? "افزودن به علاقه‌مندی‌ها"
                    : "Add to wishlist"
              }
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!user) {
                  router.push("/login");
                  return;
                }
                wishlist.mutate();
              }}
              disabled={wishlist.isPending}
              className={`rounded-full p-2.5 backdrop-blur transition disabled:opacity-70 ${isLiked ? "bg-red-500 text-white hover:bg-red-600" : "bg-white/90 text-black hover:bg-black hover:text-white dark:bg-black/60 dark:text-white dark:hover:bg-white dark:hover:text-black"}`}
            >
              {wishlist.isPending ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Heart
                  size={17}
                  strokeWidth={1.8}
                  fill={isLiked ? "currentColor" : "none"}
                />
              )}
            </button>
          )}
        </div>
      </div>
      <div className="flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <Link
            href={`/product/${product.slug}`}
            className="block truncate text-base font-bold transition hover:text-accent"
          >
            {product.name}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {product.category?.name}
          </p>
          <p className="mt-2 font-bold text-accent ltr-number">
            {formatPrice(product, locale)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 pt-1 text-xs text-muted-foreground">
          <span className="text-amber-500">★</span>
          {product.rating || "—"}
        </div>
      </div>
    </article>
  );
}
