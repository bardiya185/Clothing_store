<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\CampaignEvent;
use App\Services\CampaignService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function __construct(private readonly CampaignService $campaigns) {}

    public function trackEvent(Request $request, Campaign $campaign): JsonResponse
    {
        $data = $request->validate([
            'event_type' => ['required', 'string', 'in:impression,click,view,add_to_cart'],
            'variant' => ['nullable', 'string', 'max:80'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'metadata' => ['nullable', 'array', 'max:10'],
        ]);

        CampaignEvent::create([
            'campaign_id' => $campaign->id,
            'user_id' => $request->user('sanctum')?->id,
            'product_id' => $data['product_id'] ?? null,
            'event_type' => $data['event_type'],
            'variant' => $data['variant'] ?? null,
            'session_id' => substr((string) ($request->header('X-Campaign-Session') ?: $request->cookie('baran_campaign_session')), 0, 100) ?: null,
            'metadata' => $data['metadata'] ?? [],
        ]);

        return response()->json(['status' => 'success']);
    }

    public function active(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->campaigns->active($request),
        ]);
    }
}
