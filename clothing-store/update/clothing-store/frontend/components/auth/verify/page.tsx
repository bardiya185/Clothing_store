// app/verify/page.tsx
"use client";
import { useVerifyOtp } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 120; // ۲ دقیقه = ۱۲۰ ثانیه

function VerifyForm() {
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [timeLeft, setTimeLeft] = useState(RESEND_SECONDS);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const { mutate, isPending } = useVerifyOtp();

  // ⏱️ تایمر شمارش معکوس
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // فرمت زمان به صورت mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    if (!digit) return;

    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...otp];

      if (otp[index]) {
        next[index] = "";
        setOtp(next);
      } else if (index > 0) {
        next[index - 1] = "";
        setOtp(next);
        inputsRef.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtp(next);

    const lastIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputsRef.current[lastIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phone) return;

    const code = otp.join("");
    if (code.length !== OTP_LENGTH) return;

    mutate({ phone, code });
  };

  // دکمه ارسال دوباره
  const handleResend = () => {
    if (timeLeft > 0) return;
    // اینجا mutate مربوط به ارسال دوباره OTP رو صدا بزن
    // مثلاً: resendMutate(phone);
    setOtp(Array(OTP_LENGTH).fill("")); // خونه‌ها رو خالی کن
    setTimeLeft(RESEND_SECONDS); // تایمر رو ریست کن
    inputsRef.current[0]?.focus(); // فوکوس روی اولی
  };

  const isComplete = otp.every((d) => d !== "");
  const canResend = timeLeft === 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-black">
      <form
        onSubmit={handleSubmit}
        dir="rtl"
        className="flex w-full max-w-md flex-col gap-6 rounded-2xl bg-white p-8 shadow-lg dark:bg-zinc-900"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            تایید شماره موبایل
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            کد ۶ رقمی ارسال شده به شماره{" "}
            <span dir="ltr" className="font-medium text-amber-500">
              {phone}
            </span>{" "}
            را وارد کنید
          </p>
        </div>

        <div dir="ltr" className="flex justify-center gap-2 sm:gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              disabled={isPending}
              className="h-14 w-12 rounded-lg border-2 border-zinc-300 bg-white text-center text-xl font-bold text-zinc-800 outline-none transition focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 xl:h-14 xl:w-13 sm:text-xl"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={!isComplete || isPending}
          className="w-full rounded-lg bg-amber-500 px-4 py-3 font-medium text-white transition hover:bg-amber-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "در حال بررسی..." : "تایید کد"}
        </button>

        {/* ⏱️ دکمه ارسال دوباره با تایمر */}
        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend}
          className="text-sm gap-3 flex self-center transition disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:text-zinc-400 dark:disabled:text-zinc-600 hover:text-amber-500 dark:text-zinc-400 dark:hover:text-amber-500"
        >
          {canResend ? (
            "ارسال دوباره کد"
          ) : (
            <>
              <span>ارسال دوباره کد در</span>
              <span dir="ltr" className="font-mono font-medium text-amber-500">
                {formatTime(timeLeft)}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-zinc-50 dark:bg-black" />}
    >
      <VerifyForm />
    </Suspense>
  );
}
