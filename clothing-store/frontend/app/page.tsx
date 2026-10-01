import Image from "next/image";
import { ArrowLeft, Heart } from "lucide-react";

export default async function HomePage() {

  return (
    <div className="container mx-auto px-4 min-h-[100px] md:px-8 pt-8 space-y-24 transition-all z-1 animate-page-entry">
      
      {/* 🔴 سکشن ۱: هیرو (بنر اصلی) */}
      <section className="relative w-full h-[80vh] min-h-[600px] rounded-[2rem] overflow-hidden bg-gray-300 dark:bg-zinc-800">
        <Image
          src="/images/hero.jpg"
          alt="Hero Urban"
          fill
          loading="eager"
          className="object-cover "
        />

        {/* کارت روی بنر */}
        <div className="absolute bottom-12 right-12 bg-[#f4f3f0]/95 dark:bg-zinc-900/95 backdrop-blur p-10 rounded-3xl max-w-lg border border-transparent dark:border-zinc-800">
          <div className="flex gap-2 mb-6">
            <span className="px-3 py-1 border border-orange-600 text-orange-600 text-xs rounded-full">
              درآپ جدید
            </span>
            <span className="px-3 py-1 bg-white dark:bg-zinc-800 text-xs rounded-full text-black dark:text-zinc-100">
              پاییز ۱۴۰۵ - ۲۲ قطعه
            </span>
          </div>

          <h1 className="text-5xl font-black leading-tight mb-4 text-black dark:text-zinc-50">
            ساده بپوش،
            <br />
            <span className="relative">
              متفاوت{" "}
              <span className="absolute bottom-2 left-0 w-full h-1 bg-orange-600"></span>
            </span>{" "}
            دیده شو
          </h1>
          <p className="text-gray-600 dark:text-zinc-400 mb-8">
            پارچه‌ی سنگین، فیت اورسایز و دوخت ایرانی. ارسال رایگان بالای ۵۰۰ هزار
            تومان.
          </p>

          <div className="flex gap-4 mb-8">
            <button className="bg-black dark:bg-zinc-50 text-white dark:text-black px-8 py-3 rounded-full hover:bg-gray-800 dark:hover:bg-zinc-200 transition">
              دیدن کالکشن
            </button>
            <button className="bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-black dark:text-zinc-100 px-8 py-3 rounded-full hover:bg-gray-50 dark:hover:bg-zinc-700 transition">
              لوک‌بوک پاییز
            </button>
          </div>

          <div className="flex gap-8 border-t border-gray-300 dark:border-zinc-700 pt-6">
            <div>
              <p className="text-2xl font-bold text-black dark:text-zinc-50">
                +۱۲۰
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">مدل فعال</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-black dark:text-zinc-50">۴.۹</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                امتیاز کاربران
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-black dark:text-zinc-50">۲۴س</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">ارسال سریع</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🔴 سکشن ۲: دسته‌بندی‌ها */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-black text-black dark:text-zinc-50">
            دسته‌بندی‌ها
          </h2>
          <button className="text-orange-600 dark:text-orange-500 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
            مشاهده‌ی همه <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {["هودی", "تی‌شرت", "شلوار", "کفش"].map((cat, i) => (
            <div
              key={cat}
              className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-zinc-800 flex flex-col justify-between h-48 hover:shadow-lg dark:hover:shadow-zinc-800/50 transition cursor-pointer group"
            >
              <div className="flex justify-between items-start">
                <span className="text-2xl font-black text-gray-200 dark:text-zinc-700">
                  ۰{i + 1}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-2xl font-bold text-black dark:text-zinc-50">
                    {cat}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">
                    ۲۲ مدل
                  </p>
                </div>
                <ArrowLeft className="text-orange-600 dark:text-orange-500 opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🔴 سکشن ۳: پرفروش‌ترین‌ها */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-black dark:text-zinc-50">
              پرفروش‌ترین‌ها
            </h2>
            <p className="text-gray-500 dark:text-zinc-400 mt-2">
              انتخاب هفتگی تیم طراحی
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-5 py-2 bg-black dark:bg-zinc-50 text-white dark:text-black rounded-full text-sm">
              همه
            </button>
            <button className="px-5 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-black dark:text-zinc-100 rounded-full text-sm hover:bg-gray-50 dark:hover:bg-zinc-800">
              جدید
            </button>
            <button className="px-5 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-black dark:text-zinc-100 rounded-full text-sm hover:bg-gray-50 dark:hover:bg-zinc-800">
              تخفیف‌دار
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((item) => (
            <div key={item} className="group cursor-pointer">
              <div className="relative bg-gray-100 dark:bg-zinc-800 rounded-3xl aspect-[4/5] mb-4 overflow-hidden">
                <button className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur rounded-full hover:bg-white dark:hover:bg-zinc-800 transition">
                  <Heart className="w-5 h-5 text-gray-600 dark:text-zinc-400" />
                </button>
                <Image
                  src={`/images/p${item}.jpg`}
                  alt="Product"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="flex justify-between items-start px-2">
                <div>
                  <h3 className="font-bold text-lg mb-1 text-black dark:text-zinc-50">
                    هودی اورسایز خاکستری
                  </h3>
                  <p className="text-orange-600 dark:text-orange-500 font-bold mb-2">
                    ۱,۲۸۰,۰۰۰ تومان
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    ★ ۴.۸ (۱۲۰ دیدگاه)
                  </p>
                </div>
                <div className="flex flex-col items-end  gap-y-5 gap-3">
                  <div className="flex gap-1 dark:ml-1">
                    <span className="w-4 h-4 rounded-full bg-gray-800  border border-[#3d3d3d]"></span>
                    <span className="w-4 h-4 rounded-full bg-gray-400 border border-[#3d3d3d]"></span>
                    <span className="w-4 h-4 rounded-full bg-orange-800 border border-[#3d3d3d]"></span>
                  </div>
                  <button className="bg-[#e7e5df] dark:bg-zinc-700 cursor-pointer text-black dark:text-zinc-100 px-4 py-2 rounded-full text-sm font-bold hover:bg-black dark:hover:bg-zinc-50 hover:text-white dark:hover:text-black transition">
                    افزودن
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </section>

    </div>
  );
}