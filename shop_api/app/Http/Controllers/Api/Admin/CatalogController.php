<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Collection;
use App\Models\Locale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CatalogController extends Controller
{
    public function brands(Request $request): JsonResponse
    {
        $query = Brand::query()->with('translations')->withCount('products')->orderBy('sort_order')->orderBy('id');
        if ($search = trim((string) $request->query('search'))) $query->where(fn ($builder) => $builder->where('slug', 'like', "%{$search}%")->orWhereHas('translations', fn ($translations) => $translations->where('name', 'like', "%{$search}%")));
        $brands = $query->paginate(min((int) $request->query('per_page', 50), 100));
        return response()->json(['status' => 'success', 'data' => $brands->getCollection()->map(fn (Brand $brand) => $this->brandSummary($brand))->values(), 'meta' => $this->meta($brands)]);
    }

    public function storeBrand(Request $request): JsonResponse
    {
        $data = $request->validate($this->brandRules());
        $brand = DB::transaction(function () use ($data): Brand {
            $brand = Brand::create(['slug' => $data['slug'], 'logo_path' => $data['logo_path'] ?? null, 'is_active' => $data['is_active'] ?? true, 'sort_order' => $data['sort_order'] ?? 0]);
            $this->saveTranslations($brand, $data['translations'] ?? []);
            return $brand;
        });
        return response()->json(['status' => 'success', 'data' => $this->brandSummary($brand->load('translations'))], 201);
    }

    public function updateBrand(Request $request, Brand $brand): JsonResponse
    {
        $data = $request->validate($this->brandRules($brand));
        DB::transaction(function () use ($brand, $data): void { $brand->update(['slug' => $data['slug'], 'logo_path' => $data['logo_path'] ?? null, 'is_active' => $data['is_active'] ?? true, 'sort_order' => $data['sort_order'] ?? 0]); $this->saveTranslations($brand, $data['translations'] ?? []); });
        return response()->json(['status' => 'success', 'data' => $this->brandSummary($brand->fresh()->load('translations'))]);
    }

    public function destroyBrand(Brand $brand): JsonResponse
    {
        abort_if($brand->products()->exists(), 422, 'A brand with products cannot be deleted.');
        $brand->delete();
        return response()->json(['status' => 'success']);
    }

    public function collections(Request $request): JsonResponse
    {
        $query = Collection::query()->with('translations')->withCount('products')->orderBy('sort_order')->orderBy('id');
        if ($search = trim((string) $request->query('search'))) $query->where(fn ($builder) => $builder->where('slug', 'like', "%{$search}%")->orWhereHas('translations', fn ($translations) => $translations->where('name', 'like', "%{$search}%")));
        $collections = $query->paginate(min((int) $request->query('per_page', 50), 100));
        return response()->json(['status' => 'success', 'data' => $collections->getCollection()->map(fn (Collection $collection) => $this->collectionSummary($collection))->values(), 'meta' => $this->meta($collections)]);
    }

    public function storeCollection(Request $request): JsonResponse
    {
        $data = $request->validate($this->collectionRules());
        $collection = DB::transaction(function () use ($data): Collection { $collection = Collection::create(['slug' => $data['slug'], 'is_active' => $data['is_active'] ?? true, 'sort_order' => $data['sort_order'] ?? 0, 'starts_at' => $data['starts_at'] ?? null, 'ends_at' => $data['ends_at'] ?? null]); $this->saveTranslations($collection, $data['translations'] ?? []); $collection->products()->sync($data['product_ids'] ?? []); return $collection; });
        return response()->json(['status' => 'success', 'data' => $this->collectionSummary($collection->load(['translations', 'products']))], 201);
    }

    public function updateCollection(Request $request, Collection $collection): JsonResponse
    {
        $data = $request->validate($this->collectionRules($collection));
        DB::transaction(function () use ($collection, $data): void { $collection->update(['slug' => $data['slug'], 'is_active' => $data['is_active'] ?? true, 'sort_order' => $data['sort_order'] ?? 0, 'starts_at' => $data['starts_at'] ?? null, 'ends_at' => $data['ends_at'] ?? null]); $this->saveTranslations($collection, $data['translations'] ?? []); if (array_key_exists('product_ids', $data)) $collection->products()->sync($data['product_ids'] ?? []); });
        return response()->json(['status' => 'success', 'data' => $this->collectionSummary($collection->fresh()->load(['translations', 'products']))]);
    }

    public function destroyCollection(Collection $collection): JsonResponse { $collection->delete(); return response()->json(['status' => 'success']); }

    public function categories(Request $request): JsonResponse
    {
        $categories = Category::query()->with(['translations', 'parent'])->withCount('products')->orderBy('sort_order')->orderBy('id')->get();
        return response()->json(['status' => 'success', 'data' => $categories->map(fn (Category $category) => ['id' => $category->id, 'parent_id' => $category->parent_id, 'slug' => $category->slug, 'name_fa' => $this->translation($category, 'fa'), 'name_en' => $this->translation($category, 'fa'), 'products_count' => (int) $category->products_count, 'is_active' => (bool) $category->is_active])->values()]);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate($this->categoryRules());
        $category = DB::transaction(function () use ($data): Category { $category = Category::create(['parent_id' => $data['parent_id'] ?? null, 'slug' => $data['slug'], 'image_path' => $data['image_path'] ?? null, 'is_active' => $data['is_active'] ?? true, 'sort_order' => $data['sort_order'] ?? 0]); $this->saveTranslations($category, $data['translations'] ?? []); return $category; });
        return response()->json(['status' => 'success', 'data' => $category->load('translations')], 201);
    }

    public function updateCategory(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate($this->categoryRules($category));
        abort_if(($data['parent_id'] ?? null) === $category->id, 422, 'A category cannot be its own parent.');
        $category->update(['parent_id' => $data['parent_id'] ?? null, 'slug' => $data['slug'], 'image_path' => $data['image_path'] ?? null, 'is_active' => $data['is_active'] ?? true, 'sort_order' => $data['sort_order'] ?? 0]);
        $this->saveTranslations($category, $data['translations'] ?? []);
        return response()->json(['status' => 'success', 'data' => $category->fresh()->load('translations')]);
    }

    public function destroyCategory(Category $category): JsonResponse
    {
        abort_if($category->products()->exists() || $category->children()->exists(), 422, 'A category with products or child categories cannot be deleted.');
        $category->delete();
        return response()->json(['status' => 'success']);
    }

    private function brandRules(?Brand $brand = null): array { return ['slug' => ['required', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('brands', 'slug')->ignore($brand?->id)], 'logo_path' => ['nullable', 'string', 'max:1000'], 'is_active' => ['boolean'], 'sort_order' => ['integer', 'min:0', 'max:100000'], 'translations' => ['required', 'array', 'min:1', 'max:20'], 'translations.*.name' => ['required', 'string', 'max:255'], 'translations.*.description' => ['nullable', 'string']]; }
    private function collectionRules(?Collection $collection = null): array { return ['slug' => ['required', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('collections', 'slug')->ignore($collection?->id)], 'is_active' => ['boolean'], 'sort_order' => ['integer', 'min:0', 'max:100000'], 'starts_at' => ['nullable', 'date'], 'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'], 'translations' => ['required', 'array', 'min:1', 'max:20'], 'translations.*.name' => ['required', 'string', 'max:255'], 'translations.*.description' => ['nullable', 'string'], 'product_ids' => ['nullable', 'array', 'max:1000'], 'product_ids.*' => ['integer', 'distinct', 'exists:products,id']]; }
    private function categoryRules(?Category $category = null): array { return ['parent_id' => ['nullable', 'integer', 'exists:categories,id'], 'slug' => ['required', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('categories', 'slug')->ignore($category?->id)], 'image_path' => ['nullable', 'string', 'max:1000'], 'is_active' => ['boolean'], 'sort_order' => ['integer', 'min:0', 'max:100000'], 'translations' => ['required', 'array', 'min:1', 'max:20'], 'translations.*.name' => ['required', 'string', 'max:255'], 'translations.*.description' => ['nullable', 'string']]; }
    private function saveTranslations($model, array $translations): void { $activeLocales = Locale::query()->where('is_active', true)->pluck('code')->map(fn ($code) => (string) $code)->all(); foreach ($translations as $locale => $translation) { if (!in_array((string) $locale, $activeLocales, true)) continue; $model->translations()->updateOrCreate(['locale_code' => $locale], ['name' => $translation['name'], 'description' => $translation['description'] ?? null]); } }
    private function translation($model, string $locale): ?string { return $model->translations->firstWhere('locale_code', $locale)?->name; }
    private function brandSummary(Brand $brand): array { return ['id' => $brand->id, 'slug' => $brand->slug, 'logo_path' => $brand->logo_path, 'name_fa' => $this->translation($brand, 'fa'), 'name_en' => $this->translation($brand, 'fa'), 'products_count' => (int) ($brand->products_count ?? $brand->products()->count()), 'is_active' => (bool) $brand->is_active, 'sort_order' => (int) $brand->sort_order]; }
    private function collectionSummary(Collection $collection): array { return ['id' => $collection->id, 'slug' => $collection->slug, 'name_fa' => $this->translation($collection, 'fa'), 'name_en' => $this->translation($collection, 'fa'), 'products_count' => (int) ($collection->products_count ?? $collection->products()->count()), 'product_ids' => $collection->relationLoaded('products') ? $collection->products->pluck('id')->values() : [], 'is_active' => (bool) $collection->is_active, 'sort_order' => (int) $collection->sort_order, 'starts_at' => $collection->starts_at?->toIso8601String(), 'ends_at' => $collection->ends_at?->toIso8601String()]; }
    private function meta($p): array { return ['current_page' => $p->currentPage(), 'last_page' => $p->lastPage(), 'total' => $p->total()]; }
}
