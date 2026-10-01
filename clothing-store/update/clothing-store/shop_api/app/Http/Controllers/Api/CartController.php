<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CartResource;
use App\Services\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    public function __construct(private readonly CartService $carts) {}

    public function show(Request $request): JsonResponse
    {
        return $this->respond($request, $this->carts->forRequest($request, Auth::guard('sanctum')->user()));
    }

    public function store(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'variant_id' => ['required', 'integer', 'exists:product_variants,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        return $this->respond(
            $request,
            $this->carts->add($request, $payload),
            __('cart.updated'),
        );
    }

    public function update(Request $request, int $variant): JsonResponse
    {
        $payload = $request->validate([
            'quantity' => ['required', 'integer', 'min:0', 'max:10'],
        ]);

        return $this->respond(
            $request,
            $this->carts->update($request, $variant, (int) $payload['quantity']),
            __('cart.updated'),
        );
    }

    public function destroy(Request $request, int $variant): JsonResponse
    {
        return $this->respond(
            $request,
            $this->carts->remove($request, $variant),
            __('cart.updated'),
        );
    }

    public function clear(Request $request): JsonResponse
    {
        return $this->respond(
            $request,
            $this->carts->clear($request),
            __('cart.cleared'),
        );
    }

    public function discount(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'code' => ['nullable', 'string', 'max:40'],
        ]);

        return $this->respond(
            $request,
            $this->carts->applyDiscount($request, $payload['code'] ?? null),
            empty($payload['code']) ? __('cart.discount_removed') : __('discount.applied'),
        );
    }

    private function respond(Request $request, $cart, ?string $message = null): JsonResponse
    {
        $response = response()->json([
            'status' => 'success',
            ...($message ? ['message' => $message] : []),
            'data' => new CartResource($cart),
        ]);

        if (!$cart->session_id) return $response;

        return $response->cookie(
            'baran_cart_session',
            $cart->session_id,
            60 * 24 * 30,
            '/',
            null,
            $request->isSecure(),
            true,
            false,
            'lax',
        );
    }
}
