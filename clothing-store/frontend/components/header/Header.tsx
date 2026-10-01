'use client';

import Link from 'next/link';
import { Search, ShoppingBag, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';


export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'خانه' },
    { href: '/shop', label: 'فروشگاه' },
    { href: '/men', label: 'مردانه' },
    { href: '/women', label: 'زنانه' },
    { href: '/about', label: 'درباره ما' },
  ];

  return (
    <header className={`${pathname == "/login" || pathname ==  "/verify"  ? "hidden" : "sticky"} z-30 top-0  w-full  bg-[#f4f3f0]/80 dark:bg-zinc-900/80 backdrop-blur-md border-b  border-gray-200/50 dark:border-zinc-800/50 transition-colors`}>
      <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between">

        {/* راست: لوگو */}
        <div className="flex items-center">
          <Link
            href="/"
            className="text-2xl font-black tracking-widest uppercase text-black dark:text-zinc-50"
          >
            BARAN
          </Link>
        </div>

        {/* وسط: منو */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={`relative py-2 transition-colors ${
                  isActive
                    ? 'font-bold text-black dark:text-zinc-50'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50'
                }`}
              >
                {label}

                {isActive && (
                  <motion.span
                    layoutId="active-nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-black dark:bg-zinc-50 rounded-full"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* چپ: آیکون‌ها */}
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition cursor-pointer">
            <Search className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
          </button>

          <Link
            href="/cart"
            className="relative p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition"
          >
            <ShoppingBag className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
              5
            </span>
          </Link>

          <ThemeToggle />

          <Link
            href="/login"
            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition"
          >
            <User className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
          </Link>
        </div>

      </div>
    </header>
  );
}