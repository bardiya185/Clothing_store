<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CampaignService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignController extends Controller
{
    public function __construct(private readonly CampaignService $campaigns) {}

    public function active(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $this->campaigns->active($request),
        ]);
    }
}
