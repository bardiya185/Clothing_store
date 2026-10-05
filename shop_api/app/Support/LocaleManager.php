<?php

namespace App\Support;

use App\Models\Locale;
use Illuminate\Http\Request;
use Throwable;

class LocaleManager
{
    /**
     * These values are only a safe installation fallback. Active locales are
     * read from the locales table so adding a language does not require a new
     * conditional in this class.
     */
    public const DEFAULT_LOCALE = 'fa';
    public const SUPPORTED_LOCALES = ['fa'];

    private static ?array $availableLocalesCache = null;
    private static array $currencyCache = [];

    public static function resolve(?Request $request = null): string
    {
        $request ??= request();
        $requested = $request->query('locale')
            ?? $request->header('X-Locale')
            ?? $request->header('Accept-Language');

        $requested = self::normalizeRequestedValue((string) $requested);
        $available = self::availableLocales();

        if (in_array($requested, $available, true)) {
            return $requested;
        }

        // Accept regional tags such as de-DE when the database stores de.
        $baseLocale = strtolower((string) strtok($requested, '-'));
        if ($baseLocale !== '' && in_array($baseLocale, $available, true)) {
            return $baseLocale;
        }

        return self::defaultLocale($available);
    }

    public static function currencyFor(string $locale): string
    {
        if (array_key_exists($locale, self::$currencyCache)) {
            return self::$currencyCache[$locale];
        }

        try {
            $currency = Locale::query()
                ->where('code', $locale)
                ->where('is_active', true)
                ->value('currency_code');

            if (is_string($currency) && $currency !== '') {
                return self::$currencyCache[$locale] = $currency;
            }
        } catch (Throwable) {
            // The config fallback keeps early boot and migrations safe.
        }

        $baseLocale = strtolower((string) strtok($locale, '-'));
        return self::$currencyCache[$locale] = (string) (
            config("locales.currencies.{$locale}")
            ?? config("locales.currencies.{$baseLocale}")
            ?? config('locales.currencies.*', 'IRT')
        );
    }

    public static function defaultCurrency(): string
    {
        $defaultLocale = self::defaultLocale();

        try {
            $currency = Locale::query()
                ->where('code', $defaultLocale)
                ->where('is_active', true)
                ->value('currency_code');

            if (is_string($currency) && $currency !== '') {
                return $currency;
            }
        } catch (Throwable) {
            // The config fallback keeps early boot and migrations safe.
        }

        return self::currencyFor($defaultLocale);
    }

    public static function fallback(string $locale): string
    {
        $fallback = config("locales.fallbacks.{$locale}")
            ?? config('locales.fallbacks.*', 'fa');

        if ($fallback === $locale) {
            return (string) config('locales.fallbacks.*', 'fa');
        }

        return (string) $fallback;
    }

    /**
     * Return the ordered fallback chain used by all translation consumers.
     * A missing third-language translation therefore falls back predictably
     * instead of returning an arbitrary first database row.
     */
    public static function fallbackChain(string $locale): array
    {
        $chain = [$locale, self::fallback($locale), self::defaultLocale()];

        return array_values(array_unique(array_filter($chain, fn ($item) => is_string($item) && $item !== '')));
    }

    /**
     * Resolve the first translation by fallback priority, rather than by the
     * order in which rows happened to be returned from the database.
     */
    public static function findTranslation($translations, string $locale): mixed
    {
        $items = collect($translations);

        foreach (self::fallbackChain($locale) as $candidate) {
            $translation = $items->firstWhere('locale_code', $candidate);
            if ($translation) {
                return $translation;
            }
        }

        return null;
    }

    public static function translate($translations, string $locale, string $field = 'name'): ?string
    {
        $items = collect($translations);

        foreach (self::fallbackChain($locale) as $candidate) {
            $translation = $items->firstWhere('locale_code', $candidate);
            $value = $translation?->{$field};
            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        return null;
    }

    /**
     * Read the Persian legacy column while keeping the old fallback argument in
     * the method signature for source compatibility. The retained *_en fields
     * are never treated as a separate language.
     */
    public static function localizedValue(object $source, string $locale, string $nativeField, string $fallbackField): mixed
    {
        unset($fallbackField);
        $nativeSuffix = strrchr($nativeField, '_');
        $baseField = $nativeSuffix === false
            ? $nativeField
            : substr($nativeField, 0, -strlen($nativeSuffix));
        $localizedField = $baseField.'_fa';

        foreach ([$localizedField, $nativeField] as $field) {
            $value = $source->{$field} ?? null;
            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        return null;
    }

    /** @return array<int, string> */
    public static function availableLocales(): array
    {
        if (self::$availableLocalesCache !== null) {
            return self::$availableLocalesCache;
        }

        try {
            $locales = Locale::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('code')
                ->pluck('code')
                ->map(fn ($code) => strtolower((string) $code))
                ->all();

            if ($locales !== []) {
                return self::$availableLocalesCache = array_values(array_unique($locales));
            }
        } catch (Throwable) {
            // The config list is used before the database is ready.
        }

        return self::$availableLocalesCache = array_values(array_unique(array_map(
            fn ($locale) => strtolower((string) $locale),
            (array) config('locales.supported', self::SUPPORTED_LOCALES),
        )));
    }

    private static function defaultLocale(?array $available = null): string
    {
        $configured = strtolower((string) config('locales.default', self::DEFAULT_LOCALE));
        $available ??= self::availableLocales();

        return in_array($configured, $available, true)
            ? $configured
            : ($available[0] ?? self::DEFAULT_LOCALE);
    }

    private static function normalizeRequestedValue(string $value): string
    {
        // Accept-Language may contain a weighted list; only the first tag is
        // relevant here because the browser sends X-Locale on subsequent calls.
        $value = trim(explode(',', $value)[0] ?? '');
        $value = trim(explode(';', $value)[0] ?? '');

        return strtolower(str_replace('_', '-', $value));
    }
}
