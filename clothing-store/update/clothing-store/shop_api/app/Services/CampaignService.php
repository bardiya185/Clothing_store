<?php

namespace App\Services;

use App\Models\Campaign;
use App\Support\LocaleManager;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class CampaignService
{
    public function active(Request $request): Collection
    {
        $locale = LocaleManager::resolve($request);
        $now = now();

        return Campaign::query()
            ->where('is_active', true)
            ->where('starts_at', '<=', $now)
            ->where('ends_at', '>', $now)
            ->with(['products' => fn ($products) => $products
                ->where('status', 'published')
                ->withCount(['reviews' => fn ($reviews) => $reviews->where('status', 'approved')])
                ->withAvg(['reviews' => fn ($reviews) => $reviews->where('status', 'approved')], 'rating')])
            ->latest()
            ->get()
            ->map(function (Campaign $campaign) use ($locale) {
                $discount = (int) $campaign->discount_percent;
                return [
                    'slug' => $campaign->slug,
                    'name' => $locale === 'fa' ? $campaign->name_fa : $campaign->name_en,
                    'description' => $locale === 'fa' ? $campaign->description_fa : $campaign->description_en,
                    'discount_percent' => $discount,
                    'accent_color' => $campaign->accent_color,
                    'starts_at' => $campaign->starts_at?->toIso8601String(),
                    'ends_at' => $campaign->ends_at?->toIso8601String(),
                    'products' => $campaign->products->map(function ($product) use ($locale, $discount) {
                        $translation = $product->translations->firstWhere('locale_code', $locale)
                            ?? $product->translations->firstWhere('locale_code', LocaleManager::fallback($locale));
                        $variant = $product->variants->firstWhere('is_default', true)
                            ?? $product->variants->firstWhere('is_active', true)
                            ?? $product->variants->first();
                        $productDiscount = (int) ($product->pivot->discount_percent ?? $discount);
                        $priceToman = (int) ($variant?->price_toman ?? 0);
                        $priceUsd = (float) ($variant?->price_usd ?? 0);
                        return [
                            'id' => $product->id,
                            'slug' => $product->slug,
                            'name' => $translation?->name,
                            'image' => $product->images->first()?->path ? '/'.ltrim($product->images->first()->path, '/') : null,
                            'price_toman' => $priceToman,
                            'price_usd' => $priceUsd,
                            'sale_toman' => (int) round($priceToman * (100 - $productDiscount) / 100),
                            'sale_usd' => round($priceUsd * (100 - $productDiscount) / 100, 2),
                            'discount_percent' => $productDiscount,
                            'rating' => $product->reviews_avg_rating ? round((float) $product->reviews_avg_rating, 1) : 0,
                        ];
                    })->values(),
                ];
            });
    }
}
