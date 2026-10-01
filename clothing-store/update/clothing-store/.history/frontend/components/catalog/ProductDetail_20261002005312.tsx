"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  Send,
  Star,
  ShieldCheck,
  Truck,
  ChartBar,
  ShoppingBag,
} from "lucide-react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatAmount, type ProductVariant } from "@/lib/product";
import { getApiErrorMessage } from "@/lib/api-error";
import { useLocale } from "@/hooks/useLocale";
import { useCart } from "@/hooks/useCart";
import { useCurrentUser } from "@/hooks/useAccount";
import { useCatalogProduct, useCatalogProducts } from "@/hooks/useCatalog";
import { useCreateProductReview, useProductReviews } from "@/hooks/useReviews";
import ProductCard from "./ProductCard";

function uniqueAttributeValues(variants: ProductVariant[], slug: string) {
  const values = new Map<string, { value: string; color: string | null }>();
  variants.forEach((variant) => {
    variant.attributes.forEach((attribute) => {
      if (
        attribute.slug === slug &&
        attribute.value &&
        !values.has(attribute.value)
      ) {
        values.set(attribute.value, {
          value: attribute.value,
          color: attribute.color,
        });
      }
    });
  });
  return [...values.values()];
}

export default function ProductDetail({ slug }: { slug: string }) {
  const { locale, t } = useLocale();
  
  const { addItem, items } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const [quantity, setQuantity] = useState(1);
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useCatalogProduct(slug, locale);
  const { data: relatedPage } = useCatalogProducts(
    { locale, sort: "featured" },
    Boolean(product),
  );
  const { data: currentUser } = useCurrentUser();
  const reviewsQuery = useProductReviews(slug);
  const reviewMutation = useCreateProductReview(slug);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");

  const variants = useMemo(() => product?.variants ?? [], [product?.variants]);
  const selectedVariant =
    variants.find((item) => item.id === selectedVariantId) ?? variants[0];
  const selectedAttributes = useMemo(
    () => selectedVariant?.attributes ?? [],
    [selectedVariant],
  );
  const sizeOptions = useMemo(
    () => uniqueAttributeValues(variants, "size"),
    [variants],
  );
  const colorOptions = useMemo(
    () => uniqueAttributeValues(variants, "color"),
    [variants],
  );
  const materialOptions = useMemo(
    () => uniqueAttributeValues(variants, "material"),
    [variants],
  );
  const selectedSize =
    selectedAttributes.find((attribute) => attribute.slug === "size")?.value ??
    null;
  const selectedColor =
    selectedAttributes.find((attribute) => attribute.slug === "color")?.value ??
    null;
  const isInCart = Boolean(
    selectedVariant &&
      items.some(
        (item) =>
          item.product.id === product?.id && item.variantId === selectedVariant.id,
      ),
  );

  if (isLoading)
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-[1440px] items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={30} />
      </div>
    );
  if (isError || !product)
    return (
      <div className="mx-auto max-w-[1440px] px-5 py-24 text-center">
        <p className="text-xl font-bold">
          {getApiErrorMessage(
            error,
            locale === "fa" ? "محصول پیدا نشد." : "Product not found.",
          )}
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background"
        >
          {t.actions.back}
        </Link>
      </div>
    );

  const chooseAttribute = (slug: string, value: string) => {
    const matchingVariant =
      variants.find((variant) => {
        const hasValue = variant.attributes.some(
          (attribute) => attribute.slug === slug && attribute.value === value,
        );
        const keepsSize =
          slug === "size" || !selectedSize
            ? true
            : variant.attributes.some(
                (attribute) =>
                  attribute.slug === "size" && attribute.value === selectedSize,
              );
        const keepsColor =
          slug === "color" || !selectedColor
            ? true
            : variant.attributes.some(
                (attribute) =>
                  attribute.slug === "color" &&
                  attribute.value === selectedColor,
              );
        return hasValue && keepsSize && keepsColor && variant.stock > 0;
      }) ??
      variants.find((variant) =>
        variant.attributes.some(
          (attribute) => attribute.slug === slug && attribute.value === value,
        ),
      );

    if (matchingVariant) {
      setSelectedVariantId(matchingVariant.id);
      setQuantity(1);
    }
  };

  const addToBag = async () => {
    if (isInCart) return;
    const added = await addItem(product, {
      variantId: selectedVariant?.id,
      size: selectedSize ?? "",
      color: selectedColor ?? "",
      quantity,
    });
    if (added) toast.success(t.actions.added, { description: product.name });
  };
  const submitReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    reviewMutation.mutate(
      {
        rating: reviewRating,
        title: reviewTitle || undefined,
        body: reviewBody,
      },
      {
        onSuccess: () => {
          setReviewRating(0);
          setReviewTitle("");
          setReviewBody("");
        },
      },
    );
  };
  const stock = selectedVariant?.stock ?? product.stock;
  const related =
    relatedPage?.pages[0]?.data
      .filter((item) => item.id !== product.id)
      .slice(0, 3) ?? [];
  const productImages = product.images.length
    ? product.images
    : [{ url: product.image, alt: product.name }];

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-5 md:px-10 md:py-14">
      <Link
        href="/shop"
        className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-accent"
      >
        <ArrowLeft size={16} />
        {t.actions.back}
      </Link>
      <div className="grid gap-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {productImages.slice(0, 4).map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className={`relative overflow-hidden rounded-[1.25rem] bg-[#e8e5dc] dark:bg-zinc-800 ${index === 0 ? "col-span-2 aspect-[1.18]" : "aspect-square"}`}
            >
              <Image
                src={image.url}
                alt={image.alt ?? product.name}
                fill
                priority={index === 0}
                sizes={
                  index === 0
                    ? "(max-width: 1024px) 100vw, 55vw"
                    : "(max-width: 1024px) 50vw, 28vw"
                }
                className="object-cover transition duration-700 hover:scale-105"
              />
            </div>
          ))}
        </div>
        <div className="lg:pt-4">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-accent">
            <span>{product.category?.name}</span>
            <span className="text-border">/</span>
            <span>{product.sku}</span>
          </div>
          <h1 className="display-heading max-w-xl text-4xl font-black sm:text-5xl md:text-7xl">
            {product.name}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="text-2xl font-black text-accent ltr-number">
              {formatAmount(
                selectedVariant?.prices.toman ?? product.priceToman,
                selectedVariant?.prices.usd ?? product.priceUsd,
                locale,
              )}
            </span>
            {product.compareToman && (
              <span className="text-sm text-muted-foreground line-through ltr-number">
                {locale === "fa"
                  ? `${product.compareToman.toLocaleString("fa-IR")} تومان`
                  : `$${product.compareUsd}`}
              </span>
            )}
            <span className="text-sm text-amber-500">
              ★ {product.rating || "—"}{" "}
              <span className="text-muted-foreground">
                ({product.reviews || 0})
              </span>
            </span>
          </div>
          <p className="mt-6 max-w-xl text-sm leading-8 text-muted-foreground sm:text-base">
            {product.description}
          </p>

          <div className="my-7 space-y-6 border-y border-border py-6">
            {sizeOptions.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold">{t.product.size}</span>
                  <span className="text-xs text-muted-foreground">
                    {selectedSize ??
                      (locale === "fa" ? "انتخاب نشده" : "Not selected")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => chooseAttribute("size", option.value)}
                      className={`min-w-12 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${selectedSize === option.value ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
                    >
                      {option.value}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {colorOptions.length > 0 && (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold">{t.product.color}</span>
                  <span className="text-xs text-muted-foreground">
                    {selectedColor ??
                      (locale === "fa" ? "انتخاب نشده" : "Not selected")}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => chooseAttribute("color", option.value)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${selectedColor === option.value ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: option.color ?? "#aaa" }}
                      />
                      {option.value}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {materialOptions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold">{t.product.material}:</span>
                {materialOptions.map((option) => (
                  <span key={option.value} className="text-muted-foreground">
                    {option.value}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
           {isInCart ? 
           <button className=" w-auto rounded-2xl p-4 bg-[#D2D2D285] "><ShoppingBag size={2} className="text-mist-950 dark:text-amber-50   " /></button>
           : <div className="flex w-fit items-center self-start rounded-full border border-border">
              <button
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="p-3"
                aria-label={locale === "fa" ? "کم کردن" : "Decrease"}
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-sm font-bold">
                {quantity}
              </span>
              <button
                onClick={() =>
                  setQuantity((value) => Math.min(stock, value + 1))
                }
                className="p-3"
                aria-label={locale === "fa" ? "زیاد کردن" : "Increase"}
              >
                <Plus size={16} />
              </button>
            </div>}
            <button
              onClick={addToBag}
              disabled={stock < 1 || isInCart}
              className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-100 ${isInCart ? "bg-emerald-500/10 text-emerald-600" : "bg-foreground text-background hover:bg-accent hover:text-white"}`}
            >
              {isInCart ? <Check size={17} /> : null}
              {isInCart ? t.actions.added : stock > 0 ? t.actions.add : t.product.unavailable}
              {!isInCart && <ArrowLeft size={16} />}
            </button>
          </div>
          <div className="mt-7 grid gap-4 border-t border-border pt-6 text-sm">
            <div className="flex items-center gap-3">
              <Truck size={18} className="text-accent" />
              <span>{t.product.shipping}</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-accent" />
              <span>{t.product.returns}</span>
            </div>
            <div className="flex items-center gap-3">
              <Check size={18} className="text-accent" />
              <span>
                {stock} {t.product.stock}
              </span>
            </div>
          </div>
        </div>
      </div>
      <section className="mt-16 border-t border-border pt-10 md:mt-24 md:pt-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-accent">
              BARAN / COMMUNITY
            </p>
            <h2 className="text-3xl font-black">{t.reviews.title}</h2>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-amber-500">
            <Star size={17} fill="currentColor" />
            {product.rating || t.reviews.noRating}
            <span className="text-muted-foreground">
              ({product.reviews || 0})
            </span>
          </div>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <div className="rounded-[1.5rem] border border-border bg-card p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <MessageCircle className="text-accent" size={20} />
              <h3 className="font-black">{t.reviews.write}</h3>
            </div>
            {currentUser ? (
              <form onSubmit={submitReview} className="mt-6 grid gap-4">
                <div>
                  <p className="mb-2 text-sm font-bold">{t.reviews.rating}</p>
                  <div className="flex gap-1" dir="ltr">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setReviewRating(value)}
                        aria-label={`${value} stars`}
                        className="rounded-lg p-1 transition hover:scale-110"
                      >
                        <Star
                          size={23}
                          fill={value <= reviewRating ? "currentColor" : "none"}
                          className={
                            value <= reviewRating
                              ? "text-amber-500"
                              : "text-muted-foreground"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  value={reviewTitle}
                  onChange={(event) => setReviewTitle(event.target.value)}
                  placeholder={t.reviews.titlePlaceholder}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent"
                />
                <textarea
                  required
                  minLength={3}
                  rows={4}
                  value={reviewBody}
                  onChange={(event) => setReviewBody(event.target.value)}
                  placeholder={t.reviews.bodyPlaceholder}
                  className="resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-accent"
                />
                <button
                  disabled={reviewRating === 0 || reviewMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background transition hover:bg-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reviewMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {reviewMutation.isPending
                    ? t.reviews.submitting
                    : t.reviews.submit}
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-2xl bg-accent/5 p-5 text-sm text-muted-foreground">
                <p>{t.reviews.loginHint}</p>
                <Link
                  href="/login"
                  className="mt-3 inline-flex font-bold text-accent"
                >
                  {t.common.signIn}
                </Link>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {reviewsQuery.isLoading ? (
              <Loader2 className="animate-spin text-accent" />
            ) : reviewsQuery.data?.length ? (
              reviewsQuery.data.map((review) => (
                <motion.article
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1 }}
                  className="rounded-[1.35rem] border border-border bg-card p-5"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-bold">{review.author}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {review.created_at
                          ? new Date(review.created_at).toLocaleDateString(
                              locale === "fa" ? "fa-IR" : "en-US",
                            )
                          : "—"}
                      </p>
                    </div>
                    <div className="flex gap-0.5" dir="ltr">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          size={15}
                          fill={
                            value <= review.rating ? "currentColor" : "none"
                          }
                          className={
                            value <= review.rating
                              ? "text-amber-500"
                              : "text-border"
                          }
                        />
                      ))}
                    </div>
                  </div>
                  {review.title && (
                    <h4 className="mt-4 font-bold">{review.title}</h4>
                  )}
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {review.body}
                  </p>
                </motion.article>
              ))
            ) : (
              <div className="rounded-[1.35rem] border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                {t.reviews.empty}
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="mt-16 border-t border-border pt-10 md:mt-24 md:pt-12">
        <h2 className="mb-8 text-3xl font-black">{t.product.related}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
