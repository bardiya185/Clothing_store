<?php

namespace App\Services;

use App\Models\Attribute;
use App\Models\Category;
use App\Models\Product;
use App\Support\LocaleManager;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;

class CatalogService
{
    public function products(Request $request): LengthAwarePaginator
    {
        $locale = LocaleManager::resolve($request);
        $query = Product::query()
            ->where('status', 'published')
            ->withCount(['reviews' => fn ($reviews) => $reviews->where('status', 'approved')])
            ->withAvg(['reviews' => fn ($reviews) => $reviews->where('status', 'approved')], 'rating')
            ->with([
                'translations',
                'category.translations',
                'images.translations',
                'variants' => fn ($variants) => $variants->where('is_active', true),
            ]);

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($category) => $category->where('slug', $request->string('category')->toString()));
        }

        if ($request->filled('gender') && in_array($request->string('gender')->toString(), ['men', 'women', 'unisex'], true)) {
            $query->whereIn('gender', [$request->string('gender')->toString(), 'unisex']);
        }

        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        if ($request->boolean('new')) {
            $query->where('is_new', true);
        }

        if ($request->boolean('sale')) {
            $query->whereHas('variants', fn ($variants) => $variants
                ->where('is_active', true)
                ->where(fn ($prices) => $prices->whereNotNull('compare_at_toman')->orWhereNotNull('compare_at_usd')));
        }

        foreach (['size', 'color', 'material'] as $attributeSlug) {
            $rawValues = $request->string($attributeSlug)->toString();
            if ($rawValues === '') {
                continue;
            }

            $values = collect(explode(',', $rawValues))
                ->map(fn ($value) => trim($value))
                ->filter()
                ->values();

            if ($values->isEmpty()) {
                continue;
            }

            $query->whereHas('variants', function ($variants) use ($attributeSlug, $values) {
                $variants->where('is_active', true)
                    ->whereHas('attributeValues', function ($attributeValues) use ($attributeSlug, $values) {
                        $attributeValues->whereIn('slug', $values->all())
                            ->whereHas('attribute', fn ($attribute) => $attribute->where('slug', $attributeSlug));
                    });
            });
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->whereHas('translations', function ($translations) use ($search, $locale) {
                $translations->where('locale_code', $locale)
                    ->where(fn ($translation) => $translation
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%"));
            });
        }

        match ($request->string('sort', 'featured')->toString()) {
            'price_asc' => $query->orderByRaw('(select price_toman from product_variants where product_variants.product_id = products.id and product_variants.is_active = 1 order by is_default desc, id asc limit 1) asc'),
            'price_desc' => $query->orderByRaw('(select price_toman from product_variants where product_variants.product_id = products.id and product_variants.is_active = 1 order by is_default desc, id asc limit 1) desc'),
            'newest' => $query->latest(),
            default => $query->orderByDesc('is_featured')->orderByDesc('is_new')->orderBy('sort_order'),
        };

        return $query->paginate(min(max($request->integer('per_page', 10), 1), 10))->withQueryString();
    }

    public function find(string $slug): ?Product
    {
        return Product::query()
            ->where('status', 'published')
            ->where('slug', $slug)
            ->withCount(['reviews' => fn ($reviews) => $reviews->where('status', 'approved')])
            ->withAvg(['reviews' => fn ($reviews) => $reviews->where('status', 'approved')], 'rating')
            ->with([
                'translations',
                'category.translations',
                'images.translations',
                'variants.attributeValues.translations',
                'variants.attributeValues.attribute.translations',
            ])
            ->first();
    }

    public function categories(): Collection
    {
        return Category::query()
            ->where('is_active', true)
            ->with('translations')
            ->withCount(['products' => fn ($products) => $products->where('status', 'published')])
            ->orderBy('sort_order')
            ->get();
    }

    public function filters(): Collection
    {
        return Attribute::query()
            ->where('is_filterable', true)
            ->with(['translations', 'values.translations'])
            ->orderBy('sort_order')
            ->get();
    }

    public function localizedCategories(Request $request): array
    {
        $locale = LocaleManager::resolve($request);
        return $this->categories()->map(function (Category $category) use ($locale) {
            $translation = $category->translations->firstWhere('locale_code', $locale)
                ?? $category->translations->firstWhere('locale_code', LocaleManager::fallback($locale));

            return [
                'slug' => $category->slug,
                'name' => $translation?->name,
                'description' => $translation?->description,
                'image' => $category->image_path ? '/'.ltrim($category->image_path, '/') : null,
                'products_count' => $category->products_count,
            ];
        })->all();
    }

    public function localizedFilters(Request $request): array
    {
        $locale = LocaleManager::resolve($request);
        return $this->filters()->map(function (Attribute $attribute) use ($locale) {
            $translation = $attribute->translations->firstWhere('locale_code', $locale)
                ?? $attribute->translations->firstWhere('locale_code', LocaleManager::fallback($locale));

            return [
                'slug' => $attribute->slug,
                'name' => $translation?->name,
                'type' => $attribute->type,
                'values' => $attribute->values->map(function ($value) use ($locale) {
                    $translation = $value->translations->firstWhere('locale_code', $locale)
                        ?? $value->translations->firstWhere('locale_code', LocaleManager::fallback($locale));
                    return ['slug' => $value->slug, 'name' => $translation?->name, 'color' => $value->color_hex];
                })->values()->all(),
            ];
        })->all();
    }
}
