// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 dark:bg-black">
      <h1 className="text-8xl font-black text-amber-500">404</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        صفحه‌ای که دنبالش بودی پیدا نشد
      </p>
      <Link
        href="/"
        className="rounded-lg bg-amber-500 px-6 py-3 text-white transition hover:bg-amber-600"
      >
        برگشت به خانه
      </Link>
    </div>
  );
}
