"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { messages, type Messages } from "@/i18n/messages";
import { defaultLocale, getLocaleConfig, type Locale } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  direction: "rtl" | "ltr";
  t: Messages;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const dictionaries = messages as unknown as Record<string, Partial<Messages>>;

function mergeDictionary(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      result[key] = mergeDictionary(
        baseValue as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }

  return result;
}

function getDictionary(locale: Locale): Messages {
  const config = getLocaleConfig(locale);
  const fallback = dictionaries[config.fallback] ?? dictionaries.fa ?? {};
  const selected = dictionaries[locale] ?? {};

  return mergeDictionary(
    fallback as Record<string, unknown>,
    selected as Record<string, unknown>,
  ) as Messages;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale] = useState<Locale>(defaultLocale);
  const config = getLocaleConfig(locale);
  const localizedMessages = useMemo(() => getDictionary(locale), [locale]);

  useEffect(() => {
    // فارسی تنها زبان storefront است؛ هر نشست قدیمی پاک‌سازی می‌شود.
    window.localStorage.setItem("baran-locale", defaultLocale);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = config.direction;
    window.localStorage.setItem("baran-locale", locale);
  }, [config.direction, locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: () => undefined,
      direction: config.direction,
      t: localizedMessages,
    }),
    [config.direction, locale, localizedMessages],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}
