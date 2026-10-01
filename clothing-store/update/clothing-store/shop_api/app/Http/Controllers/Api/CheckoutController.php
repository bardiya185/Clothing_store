<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Checkout\FakePaymentRequest;
use App\Services\CheckoutService;
use App\Support\LocaleManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function __construct(private readonly CheckoutService $checkout) {}

    public function fakePay(FakePaymentRequest $request): JsonResponse
    {
        abort_unless($request->user(), 401);
        $locale = LocaleManager::resolve($request);
        $order = $this->checkout->fakePay(
            $request->validated(),
            $locale,
            $request->user(),
            $request,
        );

        return response()->json([
            'status' => 'success',
            'message' => __('checkout.payment_success'),
            'data' => [
                'order_number' => $order->number,
                'payment_reference' => $order->payment_reference,
                'postal_status' => $order->postal_status,
                'postal_tracking_code' => $order->postal_tracking_code,
                'paid_at' => $order->paid_at?->toIso8601String(),
                'currency' => $order->currency_code,
                'discount_code' => $order->discount_code,
                'discount_toman' => (int) $order->discount_toman,
                'discount_usd' => (float) $order->discount_usd,
                'total_toman' => (int) $order->total_toman,
                'total_usd' => (float) $order->total_usd,
                'items' => $order->items->map(fn ($item) => [
                    'name' => $locale === 'fa' ? $item->product_name_fa : $item->product_name_en,
                    'sku' => $item->sku,
                    'quantity' => $item->quantity,
                    'unit_price_toman' => (int) $item->unit_price_toman,
                    'unit_price_usd' => (float) $item->unit_price_usd,
                    'total_toman' => (int) $item->total_toman,
                    'total_usd' => (float) $item->total_usd,
                    'options' => $item->options,
                ])->values(),
            ],
        ], 201);
    }
}
