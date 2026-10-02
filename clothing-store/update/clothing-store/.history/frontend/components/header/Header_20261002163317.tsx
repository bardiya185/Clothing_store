"use client";

import Link from "next/link";
import {
  CircleUserRound,
  LogIn,
  Search,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import SearchOverlay from "@/components/header/SearchOverlay";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useLocale } from "@/hooks/useLocale";
import { useCart } from "@/hooks/useCart";
import { useCurrentUser } from "@/hooks/useAccount";

export default function Header() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const { count } = useCart();
  const { data: user } = useCurrentUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const isAuth =
    pathname.startsWith("/login") || pathname.startsWith("/verify");
  const navLinks = [
    { href: "/", label: t.nav.home },
    { href: "/shop", label: t.nav.shop },
    { href: "/men", label: t.nav.men },
    { href: "/women", label: t.nav.women },
    { href: "/about", label: t.nav.about },
  ];

  if (isAuth) return null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 md:px-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen((open) => !open)}
              className="rounded-full p-2 transition hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
            <Link
              href="/"
              className="text-[1.6rem] font-black tracking-[.2em] text-foreground"
            >
              BARAN<span className="text-accent">.</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-8 text-sm md:flex">
            {navLinks.map(({ href, label }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative py-2 transition ${active ? "font-bold" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {label}
                  {active && (
                    <motion.span
                      layoutId="active-nav"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-accent"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label={locale === "fa" ? "جست‌وجو" : "Search"}
              className="rounded-full p-2.5 transition hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Search size={19} strokeWidth={1.8} />
            </button>
            <Link
              href="/cart"
              aria-label={locale === "fa" ? "سبد خرید" : "Shopping bag"}
              className="relative rounded-full p-2.5 transition hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ShoppingBag size={19} strokeWidth={1.8} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
            <ThemeToggle />
            <Link
              href={user ? "/account" : "/login"}
              aria-label={
                user
                  ? locale === "fa"
                    ? "حساب کاربری"
                    : "Account"
                  : locale === "fa"
                    ? "ورود"
                    : "Sign in"
              }
              className="hidden rounded-full p-2.5 transition hover:bg-black/5 dark:hover:bg-white/10 sm:block"
            >
              {user ? (
                <CircleUserRound size={19} strokeWidth={1.8} />
              ) : (
                <LogIn size={19} strokeWidth={1.8} />
              )}
            </Link>
            <button
              onClick={() => { navigation.reload() setTimeout(()) setLocale(locale === "fa" ? "en" : "fa");} }
              className="ms-1 rounded-full border border-border px-3 py-1.5 text-xs font-bold transition hover:border-accent hover:text-accent"
            >
              <span
                className={
                  locale === "fa" ? "text-accent" : "text-muted-foreground"
                }
              >
                فا
              </span>
              <span className="mx-1 text-muted-foreground">/</span>
              <span
                className={
                  locale === "en" ? "text-accent" : "text-muted-foreground"
                }
              >
                EN
              </span>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-4 py-3 text-lg font-bold transition hover:bg-card"
                >
                  {label}
                </Link>
              ))}
              <Link
                href={user ? "/account" : "/login"}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-lg font-bold text-accent"
              >
                {user
                  ? locale === "fa"
                    ? "حساب کاربری"
                    : "Account"
                  : locale === "fa"
                    ? "ورود / ثبت‌نام"
                    : "Sign in / Register"}
              </Link>
            </nav>
          </div>
        )}
      </header>
      <SearchOverlay
        key={searchOpen ? "open" : "closed"}
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
