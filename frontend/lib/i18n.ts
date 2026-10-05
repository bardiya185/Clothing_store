export type Locale = string;

export type LocaleConfig = {
  label: string;
  nativeLabel: string;
  direction: "rtl" | "ltr";
  numberLocale: string;
  calendar: "persian" | "gregorian";
  currency: string;
  fallback: string;
};

/**
 * Price inputs use a currency registry instead of currency-specific JSX.
 * Adding a locale only requires mapping it to one of the configured currencies;
 * the admin form then picks the right price input automatically.
 */
export type CurrencyCode = string;
export type ProductPriceField = "price_toman";
export type ProductCompareField = "compare_at_toman";
export type CurrencyConfig = {
  code: CurrencyCode;
  labelFa: string;
  symbol: string;
  decimals: number;
  /** Legacy backend field mapping. New currencies can add their own mapping. */
  productField: ProductPriceField;
  compareField: ProductCompareField;
  active?: boolean;
};

/**
 * Currency is intentionally a registry, not a two-value union. The current
 * Legacy API columns remain compatible, while the active registry exposes only
 * the Persian toman currency.
 */
export const currencyRegistry: Record<string, CurrencyConfig> = {
  IRT: { code: "IRT", labelFa: "تومان", symbol: "تومان", decimals: 0, productField: "price_toman", compareField: "compare_at_toman", active: true },
};

/**
 * Add a language here and a matching dictionary in i18n/messages.ts.
 * The rest of the application consumes this registry instead of hardcoding
 * a language toggle, so an unknown locale safely falls back to Persian.
 */
export const localeRegistry: Record<string, LocaleConfig> = {
  fa: {
    label: "FA",
    nativeLabel: "فارسی",
    direction: "rtl",
    numberLocale: "fa-IR",
    calendar: "persian",
    currency: "IRT",
    fallback: "fa",
  },
};

export const defaultLocale = "fa";
const fallbackLocale = "fa";

export function getLocaleConfig(locale: Locale): LocaleConfig {
  if (localeRegistry[locale]) return localeRegistry[locale];
  const baseLocale = locale.split("-")[0];
  return localeRegistry[baseLocale] ?? localeRegistry[fallbackLocale];
}

export function normalizeLocale(value: string | null | undefined): Locale {
  if (!value || !/^[a-z]{2,3}(?:-[A-Z]{2})?$/i.test(value)) return defaultLocale;

  const normalized = value.toLowerCase();
  const exact = Object.keys(localeRegistry).find((code) => code.toLowerCase() === normalized);
  if (exact) return exact;

  const base = normalized.split("-")[0];
  const baseCode = Object.keys(localeRegistry).find((code) => code.toLowerCase() === base);
  if (baseCode) return baseCode;

  // Valid but unregistered locale values should not create a split-brain UI:
  // the frontend and API both use the controlled Persian fallback.
  return defaultLocale;
}

export function getSupportedLocales() {
  return Object.entries(localeRegistry).map(([code, config]) => ({ code, ...config }));
}

export function getCurrencyConfig(code: CurrencyCode): CurrencyConfig | undefined {
  return currencyRegistry[code];
}

/**
 * Only currencies referenced by active locale entries are offered by default.
 * This keeps the selector aligned with the current site configuration while
 * allowing a future locale/currency to be added by registry data alone.
 */
export function getSupportedCurrencies() {
  const configuredCodes = new Set(Object.values(localeRegistry).map((locale) => locale.currency));
  return Object.values(currencyRegistry).filter((currency) => currency.active !== false && configuredCodes.has(currency.code));
}
