"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  MapPin,
  Printer,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatAmount } from "@/lib/product";
import { getApiErrorMessage } from "@/lib/api-error";
import { useLocale } from "@/hooks/useLocale";
import { useCart } from "@/hooks/useCart";
import { useAddresses, useCurrentUser } from "@/hooks/useAccount";
import { fakePay, type Receipt } from "@/services/checkout.service";

const initialCardNumber = "6037991812345678";

function ReceiptPrinter({ receipt }: { receipt: Receipt }) {
  const { locale, t } = useLocale();

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl shadow-black/5"
    >
      <div className="relative overflow-hidden bg-[#24231f] px-6 py-8 text-white sm:px-10">
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[.22em] text-accent">
              BARAN / RECEIPT
            </p>
            <h1 className="mt-3 text-3xl font-black">{t.checkout.receipt}</h1>
            <p className="mt-2 text-sm text-white/60">
              {t.checkout.receiptHint}
            </p>
          </div>
          <motion.div
            initial={{ rotate: -25, scale: 0.7 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.7, type: "spring" }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white"
          >
            <Check size={28} strokeWidth={3} />
          </motion.div>
        </motion.div>
        <div className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full border-[26px] border-accent/30" />
      </div>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.75 }}
        className="overflow-hidden"
      >
        <div className="relative p-6 sm:p-10">
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.65, duration: 0.8, ease: "easeOut" }}
            style={{ transformOrigin: "top" }}
            className="absolute inset-x-6 top-0 border-t-2 border-dashed border-accent/50 sm:inset-x-10"
          />
          <div className="grid gap-3 border-b border-border pb-6 text-sm sm:grid-cols-3">
            <div>
              <span className="block text-xs text-muted-foreground">
                {t.checkout.orderNumber}
              </span>
              <strong className="mt-1 block ltr-number">
                {receipt.order_number}
              </strong>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">
                {t.checkout.reference}
              </span>
              <strong className="mt-1 block ltr-number">
                {receipt.payment_reference}
              </strong>
            </div>
            <div>
              <span className="block text-xs text-muted-foreground">
                {t.checkout.paidAt}
              </span>
              <strong className="mt-1 block ltr-number">
                {new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(receipt.paid_at))}
              </strong>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-accent/5 px-4 py-3 text-sm">
            <p className="font-bold">{t.checkout.postalStatus}</p>
            <p className="mt-1 text-muted-foreground">
              {receipt.postal_tracking_code
                ? `${t.account.postalTracking}: ${receipt.postal_tracking_code}`
                : receipt.postal_status === "not_configured"
                  ? t.checkout.postalNotConfigured
                  : receipt.postal_status === "registration_failed"
                    ? t.checkout.postalFailed
                    : receipt.postal_status || t.checkout.postalNotConfigured}
            </p>
          </div>
          <div className="divide-y divide-border">
            {receipt.items.map((item, index) => (
              <motion.div
                key={`${item.sku}-${index}`}
                initial={{ opacity: 0, x: locale === "fa" ? 18 : -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.12 }}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.sku} · {item.quantity} × {item.options?.size || "—"}
                  </p>
                </div>
                <span className="shrink-0 font-bold text-accent ltr-number">
                  {formatAmount(item.total_toman, item.total_usd, locale)}
                </span>
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-5 flex items-center justify-between border-t-2 border-foreground pt-5 text-lg"
          >
            <span className="font-black">
              {t.checkout.paidTotal}
            </span>
            <span className="font-black text-accent ltr-number">
              {formatAmount(receipt.total_toman, receipt.total_usd, locale)}
            </span>
          </motion.div>
          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-emerald-600">
            <Printer size={15} />
            {t.checkout.print}
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}

export default function CheckoutPage() {
  const { locale, t } = useLocale();
  const router = useRouter();
  const { items, clear, discount, isLoading } = useCart();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const addresses = useAddresses(Boolean(user));
  const [addressId, setAddressId] = useState<number | null>(null);
  const [cardNumber, setCardNumber] = useState(initialCardNumber);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userLoading && !user) router.replace("/login?next=/checkout");
  }, [router, user, userLoading]);

  const defaultAddress = addresses.data?.find((address) => address.is_default) ?? addresses.data?.[0];
  const selectedAddress = addresses.data?.find((address) => address.id === addressId) ?? defaultAddress;
  const profileReady = Boolean(user?.name && selectedAddress);
  const tomanSubtotal = items.reduce((total, item) => total + item.totalToman, 0);
  const usdSubtotal = items.reduce((total, item) => total + item.totalUsd, 0);
  const tomanTotal = Math.max(0, tomanSubtotal - (discount?.discount_toman ?? 0));
  const usdTotal = Math.max(0, usdSubtotal - (discount?.discount_usd ?? 0));

  const submitPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAddress) return;
    setProcessing(true);
    setError("");
    try {
      const response = await fakePay({
        locale,
        address_id: selectedAddress.id,
        card_number: cardNumber,

      });
      setReceipt(response.data);
      clear();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, locale === "fa" ? "پرداخت انجام نشد. دوباره تلاش کن." : "Payment failed. Please try again."));
    } finally {
      setProcessing(false);
    }
  };

  if (receipt) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-5 md:px-10 md:py-20">
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-accent">BARAN / DONE</p>
          <h1 className="display-heading text-5xl font-black sm:text-7xl">{t.checkout.receipt}</h1>
        </div>
        <ReceiptPrinter receipt={receipt} />
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background transition hover:bg-accent hover:text-white">{t.checkout.continue}<ArrowLeft size={16} /></Link>
          <Link href="/account" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-bold transition hover:border-accent hover:text-accent">{t.account.title}</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>;
  }

  if (!items.length) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-[1440px] flex-col items-center justify-center px-5 py-20 text-center">
        <CreditCard className="mb-6 text-accent" size={42} />
        <h1 className="text-3xl font-black">{t.cart.empty}</h1>
        <Link href="/shop" className="mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background">{t.actions.continue}<ArrowLeft size={16} /></Link>
      </div>
    );
  }

  if (userLoading || addresses.isLoading) {
    return <div className="flex min-h-[65vh] items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>;
  }

  if (!user || !selectedAddress || !profileReady) {
    return (
      <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
        <MapPin className="text-accent" size={42} />
        <h1 className="mt-5 text-3xl font-black">{locale === "fa" ? "اطلاعات سفارش کامل نیست" : "Complete your account first"}</h1>
        <p className="mt-3 leading-7 text-muted-foreground">{locale === "fa" ? "برای پرداخت، نام و یک آدرس معتبر را از صفحه حساب کاربری ثبت کن." : "Add your name and a saved address before continuing to payment."}</p>
        <Link href="/account" className="mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background transition hover:bg-accent hover:text-white">{t.account.title}<ArrowLeft size={16} /></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-5 md:px-10 md:py-16">
      <Link href="/cart" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition hover:text-accent"><ArrowLeft size={16} />{t.checkout.backToBag}</Link>
      <div className="mb-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[.2em] text-accent">BARAN / CHECKOUT</p>
        <h1 className="display-heading text-5xl font-black sm:text-7xl">{t.checkout.title}</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">{t.checkout.subtitle}</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <form onSubmit={submitPayment} className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-8">
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
            <div className="flex items-start gap-3"><MapPin className="mt-0.5 shrink-0 text-accent" size={21} /><div><p className="font-black">{t.account.addresses}</p><p className="mt-1 text-sm text-muted-foreground">{selectedAddress.title || selectedAddress.city} · {selectedAddress.recipient_name} · {selectedAddress.phone}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{selectedAddress.province}، {selectedAddress.city}، {selectedAddress.address}</p></div></div>
            {addresses.data && addresses.data.length > 1 && <select value={selectedAddress.id} onChange={(event) => setAddressId(Number(event.target.value))} className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent">{addresses.data.map((address) => <option key={address.id} value={address.id}>{address.title || address.city} · {address.address}</option>)}</select>}
            <Link href="/account" className="mt-4 inline-block text-xs font-bold text-accent">{locale === "fa" ? "ویرایش آدرس در حساب کاربری" : "Edit address in account"}</Link>
          </div>
          <label className="mt-6 block"><span className="mb-2 flex items-center gap-2 text-sm font-bold"><CreditCard size={16} className="text-accent" />{t.checkout.cardNumber}</span><input required minLength={16} maxLength={16} pattern="[0-9]{16}" inputMode="numeric" value={cardNumber} onChange={(event) => { setCardNumber(event.target.value.replace(/\D/g, "").slice(0, 16)); setError(""); }} className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 tracking-[.2em] outline-none transition focus:border-accent" /><span className="mt-2 block text-xs text-muted-foreground">{t.checkout.cardHint}</span></label>
          {error && <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
          <button type="submit" disabled={processing} className="mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 py-4 text-sm font-bold text-background transition hover:bg-accent hover:text-white disabled:cursor-wait disabled:opacity-60">{processing ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}{processing ? t.checkout.processing : t.checkout.pay}</button>
          <p className="mt-4 text-center text-xs text-muted-foreground">{t.checkout.secure}</p>
        </form>
        <aside className="rounded-[1.75rem] bg-[#24231f] p-6 text-white shadow-xl sm:p-7 lg:sticky lg:top-28"><h2 className="text-xl font-black">{t.cart.summary}</h2><div className="mt-6 space-y-4">{items.map((item) => <div key={`${item.product.id}-${item.variantId}`} className="flex justify-between gap-3 text-sm"><span className="min-w-0 truncate text-white/65">{item.product.name} × {item.quantity}</span><span className="shrink-0 font-bold ltr-number">{formatAmount(item.totalToman, item.totalUsd, locale)}</span></div>)}</div>{discount && <div className="mt-5 flex justify-between border-t border-white/15 pt-5 text-sm text-[#9ed1a9]"><span>{t.cart.discount} ({discount.code})</span><span className="font-bold">-{formatAmount(discount.discount_toman, discount.discount_usd, locale)}</span></div>}<div className="mt-7 flex justify-between border-t border-white/15 pt-5 text-lg"><span className="font-black">{t.cart.total}</span><span className="font-black text-[#ff8a61] ltr-number">{formatAmount(tomanTotal, usdTotal, locale)}</span></div></aside>
      </div>
      <AnimatePresence>{processing && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]"><motion.div initial={{ scale: 0.8, rotate: -5 }} animate={{ scale: 1, rotate: 0 }} className="rounded-3xl bg-card p-7 text-center shadow-2xl"><Printer className="mx-auto mb-3 animate-pulse text-accent" size={34} /><p className="font-bold">{t.checkout.processing}</p></motion.div></motion.div>}</AnimatePresence>
    </div>
  );
}
