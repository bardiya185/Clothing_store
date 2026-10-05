// app/login/page.tsx
"use client";
import { useState } from "react";
import { useSendOtp } from "@/hooks/useAuth";
import { BeatLoader } from "react-spinners";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const { mutate, isPending } = useSendOtp();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmed = phone.trim();
    if (!trimmed) return;

    mutate(trimmed); // ریدایرکت توی onSuccess هوک انجام می‌شه
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-black">
      <form
        onSubmit={handleSubmit}
        dir="rtl"
        className="flex w-full max-w-sm flex-col gap-5 rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-900"
      >
        <Link href="/">
          <div className="p-2 w-11  h-10 flex flex-row items-center self-center rounded-2xl cursor-pointer top-3 -mb-10 relative bg-[#e0e0e0] dark:bg-gray-700  hover:bg-gray-300">
            <ChevronRight
              size={24}
              className=" text-[#D87716] dark:text-[#FF8000] w-auto  m-auto flex self-center "
            />
          </div>
        </Link>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            ورود به حساب
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            شماره موبایل خود را وارد کنید
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="phone"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            شماره موبایل
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09123456789"
            disabled={isPending}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-center tracking-widest text-zinc-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || !phone.trim()}
          className="w-full rounded-lg bg-amber-500 px-4 py-3 font-medium text-white transition hover:bg-amber-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? <BeatLoader color="#ffffff" size={8} /> : "ارسال کد"}
        </button>
      </form>
    </div>
  );
}
