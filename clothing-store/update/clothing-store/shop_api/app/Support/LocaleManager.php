<?php

namespace App\Support;

use App\Models\Locale;
use Illuminate\Http\Request;

class LocaleManager
{
    public const DEFAULT_LOCALE = 'fa';
    public const SUPPORTED_LOCALES = ['fa', 'en'];

    public static function resolve(?Request $request = null): string
    {
        $request ??= request();
        $requested = $request->query('locale')
            ?? $request->header('X-Locale')
            ?? $request->header('Accept-Language');

        $locale = strtolower(substr((string) $requested, 0, 2));

        return in_array($locale, self::SUPPORTED_LOCALES, true)
            ? $locale
            : self::DEFAULT_LOCALE;
    }

    public static function currencyFor(string $locale): string
    {
        return $locale === 'en' ? 'USD' : 'IRT';
    }

    public static function fallback(string $locale): string
    {
        return $locale === 'en' ? 'fa' : 'en';
    }

    public static function translate($translations, string $locale, string $field = 'name'): ?string
    {
        $translation = collect($translations)->firstWhere('locale_code', $locale)
            ?? collect($translations)->firstWhere('locale_code', self::fallback($locale));

        return $translation?->{$field};
    }
}
