"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useCatalogProducts } from "@/hooks/useCatalog";
import { formatPrice } from "@/lib/product";

export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const [term, setTerm] = useState("");
  const query = useCatalogProducts(
    { locale, search: term.trim() || undefined, sort: "featured" },
    term.trim().length >= 2,
  );
  const products =
    query.data?.pages.flatMap((page) => page.data).slice(0, 6) ?? [];

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const openProduct = (slug: string) => {
    onClose();
    router.push(`/product/${slug}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/30 p-3 backdrop-blur-md sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.98 }}
            transition={{ type: "spring", damping: 25, stiffness: 260 }}
            role="dialog"
            aria-modal="true"
            aria-label={
              locale === "fa" ? "جست‌وجوی محصولات" : "Search products"
            }
            className="mx-auto  max-h-[calc(100vh-1.5rem)] max-w-xl overflow-y-auto rounded-[1.75rem] border border-border bg-background p-4 shadow-2xl sm:max-h-[calc(100vh-3rem)] sm:p-7"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-accent">
                  BARAN / SEARCH
                </p>
                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  {locale === "fa"
                    ? "چی می‌خوای پیدا کنی؟"
                    : "What are you looking for?"}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label={locale === "fa" ? "بستن جست‌وجو" : "Close search"}
                className="rounded-full border border-border p-2.5 transition hover:border-accent hover:text-accent"
              >
                <X size={18} />
              </button>
            </div>
            <label className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3.5 transition focus-within:border-accent">
              <Search size={20} className="shrink-0 text-accent" />
              <input
                autoFocus
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={t.shop.search}
                className="min-w-0 flex-1 bg-transparent text-base outline-none"
              />
              {term && (
                <button onClick={() => setTerm("")} aria-label={t.common.clear}>
                  <X size={16} className="text-muted-foreground" />
                </button>
              )}
            </label>
            <div className="mt-6 w-50">
              {!term.trim() ? (
                <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
                  {locale === "fa"
                    ? "نام محصول، دسته‌بندی یا جنس را جست‌وجو کن."
                    : "Search by product, category or material."}
                </div>
              ) : term.trim().length < 2 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {locale === "fa"
                    ? "حداقل دو حرف وارد کن."
                    : "Type at least two characters."}
                </p>
              ) : query.isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin text-accent" />
                </div>
              ) : products.length ? (
                <div className="grid gap-3">
                  {products.map((product, index) => (
                    <motion.button
                      key={product.id}
                      initial={{ opacity: 0, x: locale === "fa" ? 14 : -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.045 }}
                      onClick={() => openProduct(product.slug)}
                      className="group flex w-screen items-center gap-3 rounded-2xl border border-border bg-card p-2 text-start transition hover:-translate-y-0.5 hover:border-accent hover:shadow-lg sm:gap-4 sm:p-3"
                    >
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#e8e5dc] sm:h-24 sm:w-24">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="96px"
                          className="object-cover transition duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{product.name}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {product.category?.name} · {product.shortDescription}
                        </p>
                        <p className="mt-2 text-sm font-black text-accent ltr-number">
                          {formatPrice(product, locale)}
                        </p>
                      </div>
                      <ArrowLeft
                        size={17}
                        className="shrink-0 text-muted-foreground transition group-hover:text-accent"
                      />
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
                  {t.shop.empty}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
