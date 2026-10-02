/* eslint-disable react-hooks/set-state-in-effect */
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
  const [isMobile, setIsMobile] = useState(false);

  const query = useCatalogProducts(
    { locale, search: term.trim() || undefined, sort: "featured" },
    term.trim().length >= 2,
  );
  const products =
    query.data?.pages.flatMap((page) => page.data).slice(0, 6) ?? [];

  // ✅ تشخیص موبایل
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ✅ قفل اسکرول + جلوگیری از جابجایی
  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  // ✅ بستن با Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // ✅ پاک کردن term موقع بستن
  useEffect(() => {
    if (!open) setTerm("");
  }, [open]);

  const openProduct = (slug: string) => {
    router.push(`/product/${slug}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          {/* ✅ wrapper برای کنترل اسکرول */}
          <div className="flex h-[100dvh] w-full items-start justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: isMobile ? 40 : -24, scale: isMobile ? 1 : 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isMobile ? 40 : -18, scale: isMobile ? 1 : 0.98 }}
              transition={{ type: "spring", damping: 25, stiffness: 260 }}
              role="dialog"
              aria-modal="true"
              aria-label={locale === "fa" ? "جست‌وجوی محصولات" : "Search products"}
              className="
                flex h-full w-full flex-col overflow-hidden bg-background shadow-2xl
                sm:h-auto sm:max-h-[calc(100dvh-3rem)] sm:max-w-3xl sm:rounded-[1.75rem] sm:border sm:border-border
              "
            >
              {/* ─── هدر ثابت ─── */}
              <div className="shrink-0 border-b border-border bg-background p-3 sm:border-0 sm:p-6 sm:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-accent sm:text-xs">
                      BARAN / SEARCH
                    </p>
                    <h2 className="mt-1 text-lg font-black leading-tight sm:mt-2 sm:text-3xl">
                      {locale === "fa"
                        ? "چی می‌خوای پیدا کنی؟"
                        : "What are you looking for?"}
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label={locale === "fa" ? "بستن جست‌وجو" : "Close search"}
                    className="shrink-0 rounded-full border border-border p-2 transition hover:border-accent hover:text-accent sm:p-2.5"
                  >
                    <X size={16} className="sm:hidden" />
                    <X size={18} className="hidden sm:block" />
                  </button>
                </div>

                {/* ─── input جستجو ─── */}
                <label className="mt-3 flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-3 py-2.5 transition focus-within:border-accent sm:mt-6 sm:gap-3 sm:px-4 sm:py-3.5">
                  <Search size={18} className="shrink-0 text-accent sm:hidden" />
                  <Search size={20} className="hidden shrink-0 text-accent sm:block" />
                  <input
                    // ❌ autoFocus روی موبایل حذف شد
                    autoFocus={!isMobile}
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder={t.shop.search}
                    // ✅ text-[16px] تا iOS زوم نکنه
                    className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-sm sm:text-base"
                    inputMode="search"
                    type="search"
                  />
                  {term && (
                    <button
                      onClick={() => setTerm("")}
                      aria-label={t.common.clear}
                      className="shrink-0 p-1"
                    >
                      <X size={16} className="text-muted-foreground" />
                    </button>
                  )}
                </label>
              </div>

              {/* ─── محتوای قابل اسکرول ─── */}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:max-h-[60vh] sm:p-6 sm:pt-4">
                {!term.trim() ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-xs text-muted-foreground sm:px-5 sm:text-sm">
                    {locale === "fa"
                      ? "نام محصول، دسته‌بندی یا جنس را جست‌وجو کن."
                      : "Search by product, category or material."}
                  </div>
                ) : term.trim().length < 2 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground sm:text-sm">
                    {locale === "fa"
                      ? "حداقل دو حرف وارد کن."
                      : "Type at least two characters."}
                  </p>
                ) : query.isLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-accent" />
                  </div>
                ) : products.length ? (
                  <div className="grid gap-2 sm:gap-3">
                    {products.map((product, index) => (
                      <motion.button
                        key={product.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.045 }}
                        onClick={() => openProduct(product.slug)}
                        className="group flex w-full items-center gap-2.5 rounded-2xl border border-border bg-card p-2 text-start transition active:scale-[0.98] hover:-translate-y-0.5 hover:border-accent hover:shadow-lg sm:gap-4 sm:p-3"
                      >
                        {/* ✅ عکس کوچیک‌تر روی موبایل */}
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#e8e5dc] sm:h-24 sm:w-24">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 64px, 96px"
                            className="object-cover transition duration-500 group-hover:scale-110"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold sm:text-base">
                            {product.name}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:mt-1 sm:text-xs">
                            {product.category?.name} · {product.shortDescription}
                          </p>
                          <p className="mt-1.5 text-xs font-black text-accent ltr-number sm:mt-2 sm:text-sm">
                            {formatPrice(product, locale)}
                          </p>
                        </div>

                        <ArrowLeft
                          size={15}
                          className="hidden shrink-0 text-muted-foreground transition group-hover:text-accent sm:block sm:h-[17px] sm:w-[17px]"
                        />
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-xs text-muted-foreground sm:px-5 sm:text-sm">
                    {t.shop.empty}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}