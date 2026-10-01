<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DiscountCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiscountCodeController extends Controller
{
    public function __construct(private readonly DiscountCodeService $discounts) {}

    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:40'],
            'subtotal_toman' => ['required', 'integer', 'min:0'],
            'subtotal_usd' => ['required', 'numeric', 'min:0'],
        ]);

        $discount = $this->discounts->calculate(
            $validated['code'],
            (int) $validated['subtotal_toman'],
            (float) $validated['subtotal_usd'],
        );

        return response()->json([
            'status' => 'success',
            'message' => __('discount.applied'),
            'data' => $discount,
        ]);
    }
}
