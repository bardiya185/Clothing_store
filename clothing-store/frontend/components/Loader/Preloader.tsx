/* eslint-disable react-hooks/set-state-in-effect */
// components/layout/Preloader.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Preloader() {
  const [count, setCount] = useState(0);
  const [targetProgress, setTargetProgress] = useState(15); // درصد اولیه هنگام شروع
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // قفل کردن اسکرول صفحه
    document.body.style.overflow = 'hidden';

    // ۱. پایش وضعیت واقعی شبکه و لود شدن منابع سایت
    const handleLoad = () => {
      setTargetProgress(100); // تمام عکس‌ها، فونت‌ها و فایل‌ها کاملاً دانلود شدند
    };

    // بررسی وضعیت مرورگر
    if (document.readyState === 'complete') {
      setTargetProgress(100);
    } else {
      // اگر هنوز کامل نشده، رویدادهای شبکه را گوش کن
      window.addEventListener('load', handleLoad);

      // وقتی ساختار DOM آماده شد، درصد را تا ۶۰٪ بالا ببر
      const handleReadyState = () => {
        if (document.readyState === 'interactive') {
          setTargetProgress((prev) => Math.max(prev, 65));
        }
      };

      document.addEventListener('readystatechange', handleReadyState);

      return () => {
        window.removeEventListener('load', handleLoad);
        document.removeEventListener('readystatechange', handleReadyState);
      };
    }
  }, []);

  // ۲. انیمیشن روان نرم‌افزاری برای نزدیک کردن عدد فعلی به درصد واقعی شبکه
  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev < targetProgress) {
          // محاسبه فاصله تا هدف برای حرکت نرم
          const diff = targetProgress - prev;
          const step = Math.ceil(diff / 4); // سرعت حرکت بر اساس فاصله
          return prev + Math.max(step, 1);
        }

        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsLoading(false);
            document.body.style.overflow = 'unset';
          }, 350); // مکث کوتاه روی ۱۰۰٪
          return 100;
        }

        return prev;
      });
    }, 30);

    return () => clearInterval(timer);
  }, [targetProgress]);

  return (
    <AnimatePresence mode="wait" >
      {isLoading && (
        <motion.div
          key="preloader"
          initial={{ 
            opacity:1
        }}
          animate={{opacity:1}}
          exit={{ 
              opacity:0,
              transition:{duration: 0.8, ease: [0.76, 0, 0.24, 1] }
        }}
        
          className="fixed inset-0 z-[99999] flex flex-col justify-between transition-all p-8 md:p-12 bg-[#f8f7f4] text-slate-900 select-none pointer-events-auto"
        >
          {/* بالای پری‌لودر */}
          <div className="flex justify-between items-center text-xs font-bold tracking-widest uppercase opacity-60">
            <span>BARAN STREETWEAR</span>
            <span>COLLECTION 2026</span>
          </div>

          {/* برندینگ وسط */}
          <div className="flex flex-col items-center justify-center my-auto">
            <motion.h1 
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-6xl md:text-9xl font-black tracking-[0.25em] uppercase text-center"
            >
              BARAN
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.2 }}
              className="text-sm font-medium tracking-widest mt-4"
            >
              ساده بپوش، متفاوت دیده شو
            </motion.p>
          </div>

          {/* درصد شمارنده واقعی شبکه */}
          <div className="flex justify-between items-end">
            <div className="text-6xl md:text-8xl font-black tracking-tighter font-mono">
              {count < 10 ? `0${count}` : count}%
            </div>
            
            <div style={{direction:'ltr'}} className="hidden md:block text-xs  font-bold tracking-widest opacity-60">
              LOADING ASSETS & RESOURCES...
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}