"use client"
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {

    const pathname = usePathname();

  return (
    <footer className={`${pathname == "/login" || pathname == "/verify"  ? "hidden" : "sticky"} bg-[#f4f3f0] dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 mt-20 pt-16 pb-8 transition-colors`}>
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid xl:grid-cols-4 md:grid-cols-3 sm:grid-cols-1 text-center justify-items-center gap-4 mb-12">

          {/* ستون اول: لوگو و شبکه‌ها */}
          <div className='flex items-center flex-col'>
            <h2 className="text-2xl font-black uppercase mb-4 text-black dark:text-zinc-50">
              BARAN
            </h2>
            <p className="text-sm text-gray-600 dark:text-zinc-400 mb-6">
              فروشگاه لباس استریت‌ویر ایرانی
            </p>
            <div className="flex gap-2">
              {['IG', 'TG', 'YT'].map((social) => (
                <div
                  key={social}
                  className="w-10 h-10 border border-gray-300 dark:border-zinc-700 rounded-full flex items-center justify-center text-xs font-bold text-black dark:text-zinc-100 hover:bg-black dark:hover:bg-zinc-50 hover:text-white dark:hover:text-black cursor-pointer transition"
                >
                  {social}
                </div>
              ))}
            </div>
          </div>

          {/* ستون‌های لینک */}
          <div>
            <h3 className="font-bold mb-4 text-black dark:text-zinc-50">فروشگاه</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-zinc-400">
              <li>
                <Link href="#" className="hover:text-black dark:hover:text-zinc-50 transition">
                  تازه‌ها
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-black dark:hover:text-zinc-50 transition">
                  مردانه
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-black dark:hover:text-zinc-50 transition">
                  زنانه
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-black dark:hover:text-zinc-50 transition">
                  تخفیف ویژه
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-black dark:text-zinc-50">حساب کاربری</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-zinc-400">
              <li>
                <Link href="#" className="hover:text-black dark:hover:text-zinc-50 transition">
                  ورود
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-black dark:hover:text-zinc-50 transition">
                  سفارش‌های من
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-black dark:hover:text-zinc-50 transition">
                  علاقه‌مندی‌ها
                </Link>
              </li>
            </ul>
          </div>

          {/* خبرنامه */}
          <div>
            <h3 className="font-bold mb-4 text-black dark:text-zinc-50">خبرنامه</h3>
            <div className="flex bg-white dark:bg-zinc-800 rounded-full p-1 border border-gray-200 dark:border-zinc-700">
              <input
                type="email"
                placeholder="ایمیل یا شماره موبایل"
                className="w-full px-4 text-sm outline-none bg-transparent text-black dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
              />
              <button className="bg-black dark:bg-zinc-50 text-white dark:text-black px-6 py-2 rounded-full text-sm hover:bg-gray-800 dark:hover:bg-zinc-200 transition whitespace-nowrap">
                عضویت
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-4">
              پرداخت امن با درگاه‌های معتبر
            </p>
          </div>

        </div>

        {/* کپی‌رایت */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 border-t border-gray-200 dark:border-zinc-800 pt-6 text-xs text-gray-500 dark:text-zinc-500">
          <p>کلیه حقوق محفوظ است © ۱۴۰۵ BARAN</p>
          <p>قوانین و مقررات - حریم خصوصی</p>
        </div>
      </div>
    </footer>
  );
}