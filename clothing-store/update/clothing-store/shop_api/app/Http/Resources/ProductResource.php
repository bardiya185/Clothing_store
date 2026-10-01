<?php

namespace App\Http\Resources;

use App\Support\LocaleManager;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locale = LocaleManager::resolve($request);
        $productTranslation = $this->translations->firstWhere('locale_code', $locale)
            ?? $this->translations->firstWhere('locale_code', LocaleManager::fallback($locale));
        $categoryTranslation = $this->category?->translations?->firstWhere('locale_code', $locale)
            ?? $this->category?->translations?->firstWhere('locale_code', LocaleManager::fallback($locale));
        $variant = $this->variants->firstWhere('is_default', true)
            ?? $this->variants->firstWhere('is_active', true)
            ?? $this->variants->first();

        $hasDetailedVariants = $this->relationLoaded('variants')
            && $this->variants->isNotEmpty()
            && $this->variants->every(fn ($variant) => $variant->relationLoaded('attributeValues'));

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'gender' => $this->gender,
            'is_featured' => (bool) $this->is_featured,
            'is_new' => (bool) $this->is_new,
            'category' => $this->category ? [
                'slug' => $this->category->slug,
                'name' => $categoryTranslation?->name,
            ] : null,
            'name' => $productTranslation?->name,
            'short_description' => $productTranslation?->short_description,
            'description' => $productTranslation?->description,
            'rating' => $this->reviews_avg_rating ? round((float) $this->reviews_avg_rating, 1) : 0,
            'reviews' => (int) ($this->reviews_count ?? 0),
            'prices' => $variant ? [
                'toman' => (int) $variant->price_toman,
                'usd' => (float) $variant->price_usd,
                'compare_at_toman' => $variant->compare_at_toman ? (int) $variant->compare_at_toman : null,
                'compare_at_usd' => $variant->compare_at_usd ? (float) $variant->compare_at_usd : null,
                'currency' => LocaleManager::currencyFor($locale),
            ] : null,
            'stock' => $variant?->stock ?? 0,
            'images' => $this->images->map(function ($image) use ($locale, $productTranslation) {
                $imageTranslation = $image->translations->firstWhere('locale_code', $locale)
                    ?? $image->translations->firstWhere('locale_code', LocaleManager::fallback($locale));

                return [
                    'path' => $image->path,
                    'url' => str_starts_with($image->path, 'http') ? $image->path : '/'.ltrim($image->path, '/'),
                    'alt' => $imageTranslation?->alt_text ?? $image->alt_text ?? $productTranslation?->name,
                    'is_primary' => (bool) $image->is_primary,
                ];
            })->values(),
            'variants' => $this->when($hasDetailedVariants, $this->variants->map(function ($variant) use ($locale) {
                return [
                    'id' => $variant->id,
                    'sku' => $variant->sku,
                    'stock' => $variant->stock,
                    'prices' => [
                        'toman' => (int) $variant->price_toman,
                        'usd' => (float) $variant->price_usd,
                        'compare_at_toman' => $variant->compare_at_toman ? (int) $variant->compare_at_toman : null,
                        'compare_at_usd' => $variant->compare_at_usd ? (float) $variant->compare_at_usd : null,
                        'currency' => LocaleManager::currencyFor($locale),
                    ],
                    'attributes' => $variant->attributeValues->map(function ($value) use ($locale) {
                        $valueTranslation = $value->translations->firstWhere('locale_code', $locale)
                            ?? $value->translations->firstWhere('locale_code', LocaleManager::fallback($locale));
                        $attributeTranslation = $value->attribute?->translations->firstWhere('locale_code', $locale)
                            ?? $value->attribute?->translations->firstWhere('locale_code', LocaleManager::fallback($locale));

                        return [
                            'slug' => $value->attribute?->slug,
                            'name' => $attributeTranslation?->name,
                            'value' => $valueTranslation?->name,
                            'color' => $value->color_hex,
                        ];
                    })->values(),
                ];
            })->values()),
        ];
    }
}
