<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Services\CatalogService;
use App\Support\LocaleManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function __construct(private readonly CatalogService $catalog) {}

    public function index(Request $request): JsonResponse
    {
        $products = $this->catalog->products($request);

        return response()->json([
            'status' => 'success',
            'data' => ProductResource::collection($products),
            'meta' => [
                'locale' => LocaleManager::resolve($request),
                'currency' => LocaleManager::currencyFor(LocaleManager::resolve($request)),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    public function show(Request $request, string $slug): JsonResponse
    {
        $product = $this->catalog->find($slug);
        if (!$product) {
            $message = __('catalog.product_not_found');
            return response()->json(['status' => 'error', 'message' => $message, 'errors' => ['slug' => [$message]]], 404);
        }

        $product->increment('views_count');
        $locale = LocaleManager::resolve($request);

        return response()->json([
            'status' => 'success',
            'data' => new ProductResource($product),
            'meta' => ['locale' => $locale, 'currency' => LocaleManager::currencyFor($locale)],
        ]);
    }

    public function categories(Request $request): JsonResponse
    {
        $locale = LocaleManager::resolve($request);
        return response()->json(['status' => 'success', 'data' => $this->catalog->localizedCategories($request), 'meta' => ['locale' => $locale]]);
    }

    public function filters(Request $request): JsonResponse
    {
        $locale = LocaleManager::resolve($request);
        return response()->json(['status' => 'success', 'data' => $this->catalog->localizedFilters($request), 'meta' => ['locale' => $locale]]);
    }
}
