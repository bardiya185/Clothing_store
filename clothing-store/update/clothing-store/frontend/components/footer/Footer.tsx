"use client";

import Link from "next/link";
import { ArrowUpLeft, Camera, Send } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";

export default function Footer() {
  const pathname = usePathname();
  const { locale, t } = useLocale();
  if (pathname.startsWith("/login") || pathname.startsWith("/verify"))
    return null;

  return (
    <footer className="mt-24 border-t border-border bg-card">
      <div className="mx-auto max-w-[1440px] px-5 pb-8 pt-14 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_.7fr_.7fr_1.4fr]">
          <div>
            <Link href="/" className="text-3xl font-black tracking-[.2em]">
              BARAN<span className="text-accent">.</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">
              {t.footer.tagline}
            </p>
            <div className="mt-6 flex gap-2">
              <a
                href="#"
                aria-label="Instagram"
                className="rounded-full border border-border p-2.5 transition hover:border-accent hover:text-accent"
              >
                <Camera size={16} />
              </a>
              <a
                href="#"
                aria-label="Telegram"
                className="rounded-full border border-border p-2.5 transition hover:border-accent hover:text-accent"
              >
                <Send size={16} />
              </a>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold">{t.footer.shop}</h3>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <Link href="/shop" className="transition hover:text-accent">
                {t.nav.shop}
              </Link>
              <Link href="/men" className="transition hover:text-accent">
                {t.nav.men}
              </Link>
              <Link href="/women" className="transition hover:text-accent">
                {t.nav.women}
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold">{t.footer.account}</h3>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <Link href="/login" className="transition hover:text-accent">
                {locale === "fa" ? "ورود" : "Sign in"}
              </Link>
              <Link href="/cart" className="transition hover:text-accent">
                {locale === "fa" ? "سبد خرید" : "Your bag"}
              </Link>
              <Link href="/about" className="transition hover:text-accent">
                {t.nav.about}
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-bold">{t.footer.newsletter}</h3>
            <p className="mb-5 text-sm leading-6 text-muted-foreground">
              {t.footer.newsletterHint}
            </p>
            <form
              className="flex rounded-full border border-border bg-background p-1"
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                type="email"
                required
                placeholder={t.footer.email}
                className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button className="flex shrink-0 items-center gap-1 rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background transition hover:bg-accent hover:text-white">
                {t.footer.subscribe}
                <ArrowUpLeft size={15} />
              </button>
            </form>
          </div>
        </div>
        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© ۱۴۰۵ BARAN — {t.footer.rights}</p>
          <p>
            {locale === "fa"
              ? "ساخته‌شده برای استایل‌های ماندگار."
              : "Made for lasting personal style."}
          </p>
        </div>
      </div>
    </footer>
  );
}
