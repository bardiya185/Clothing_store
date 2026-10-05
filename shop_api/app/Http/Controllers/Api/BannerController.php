<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Support\LocaleManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BannerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $locale = LocaleManager::resolve($request);
        $placement = trim((string) $request->query('placement', ''));

        $banners = Banner::query()
            ->where('is_active', true)
            ->when($placement !== '', fn ($query) => $query->where('placement', $placement))
            ->where(fn ($query) => $query
                ->whereNull('starts_at')
                ->orWhere('starts_at', '<=', now()))
            ->where(fn ($query) => $query
                ->whereNull('ends_at')
                ->orWhere('ends_at', '>=', now()))
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Banner $banner) => $this->present($banner, $locale))
            ->values();

        return response()->json(['status' => 'success', 'data' => $banners]);
    }

    private function present(Banner $banner, string $locale): array
    {
        return [
            'id' => $banner->id,
            'placement' => $banner->placement,
            'title' => LocaleManager::localizedValue($banner, $locale, 'title_fa', 'title_en'),
            'subtitle' => LocaleManager::localizedValue($banner, $locale, 'subtitle_fa', 'subtitle_en'),
            'image' => $banner->image,
            'mobile_image' => $banner->mobile_image ?: $banner->image,
            'href' => $banner->href,
            'cta' => LocaleManager::localizedValue($banner, $locale, 'cta_fa', 'cta_en'),
            'accent_color' => $banner->accent_color,
            'text_color' => $banner->text_color,
            'metadata' => $banner->metadata ?? [],
        ];
    }
}
