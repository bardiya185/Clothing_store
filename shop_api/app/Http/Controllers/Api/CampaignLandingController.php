<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Services\CampaignService;
use App\Support\LocaleManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignLandingController extends Controller
{
    public function __construct(private readonly CampaignService $campaigns) {}

    public function show(Request $request, string $slug): JsonResponse
    {
        $campaign = Campaign::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->where('starts_at', '<=', now())
            ->where('ends_at', '>', now())
            ->with('landingPage')
            ->first();

        if (!$campaign || !$campaign->landingPage?->is_published) {
            return response()->json(['status' => 'error', 'message' => __('catalog.campaign_not_found')], 404);
        }

        $locale = LocaleManager::resolve($request);
        $activeCampaigns = $this->campaigns->active($request);
        $currentCampaign = $activeCampaigns->firstWhere('slug', $campaign->slug);
        $relatedCampaigns = $activeCampaigns
            ->reject(fn (array $item) => $item['slug'] === $campaign->slug)
            ->take(2)
            ->map(fn (array $item) => [
                'slug' => $item['slug'],
                'name' => $item['name'],
                'description' => $item['description'],
                'discount_percent' => $item['discount_percent'],
                'accent_color' => $item['accent_color'],
            ])
            ->values();

        $landing = $campaign->landingPage;

        return response()->json(['status' => 'success', 'data' => [
            'slug' => $landing->slug,
            'title' => LocaleManager::localizedValue($landing, $locale, 'title_fa', 'title_en'),
            'description' => LocaleManager::localizedValue($landing, $locale, 'description_fa', 'description_en'),
            'blocks' => $landing->blocks ?? [],
            'seo_title' => LocaleManager::localizedValue($landing, $locale, 'seo_title_fa', 'seo_title_en'),
            'campaign' => [
                'slug' => $campaign->slug,
                'name' => LocaleManager::localizedValue($campaign, $locale, 'name_fa', 'name_en'),
                'discount_percent' => $campaign->discount_percent,
                'accent_color' => $campaign->accent_color,
            ],
            'products' => $currentCampaign['products'] ?? [],
            'related_campaigns' => $relatedCampaigns,
        ]]);
    }
}
