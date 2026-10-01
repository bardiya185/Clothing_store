// components/ui/ThemeToggle.tsx
"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-9 h-9" />; // placeholder
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative p-2 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-full transition cursor-pointer"
      aria-label={isDark ? "تغییر به حالت روشن" : "تغییر به حالت تیره"}
    >
      <Sun className="w-5 h-5 text-gray-700 dark:text-zinc-300 hidden dark:block" />
      <Moon className="w-5 h-5 text-gray-700 dark:text-zinc-300 block dark:hidden" />
    </button>
  );
}
