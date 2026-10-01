<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CartService
{
    public function __construct(private readonly DiscountCodeService $discounts) {}

    public function forRequest(Request $request, ?User $user = null): Cart
    {
        $user ??= Auth::guard('sanctum')->user();
        $sessionId = $this->sessionId($request);

        $cart = DB::transaction(function () use ($user, $sessionId): Cart {
            if ($user) {
                $cart = Cart::query()
                    ->where('user_id', $user->id)
                    ->where('status', 'active')
                    ->lockForUpdate()
                    ->first();

                if (!$cart) {
                    $cart = Cart::create([
                        'user_id' => $user->id,
                        'status' => 'active',
                        'currency_code' => 'IRT',
                    ]);
                }

                if ($sessionId) {
                    $guestCart = Cart::query()
                        ->whereNull('user_id')
                        ->where('session_id', $sessionId)
                        ->where('status', 'active')
                        ->lockForUpdate()
                        ->first();

                    if ($guestCart && $guestCart->id !== $cart->id) {
                        $this->mergeGuestCart($guestCart, $cart);
                    }
                }

                return $cart;
            }

            return Cart::query()->firstOrCreate(
                ['session_id' => $sessionId, 'status' => 'active'],
                ['currency_code' => 'IRT'],
            );
        });

        return $this->prepare($cart->fresh());
    }

    public function add(Request $request, array $payload): Cart
    {
        return DB::transaction(function () use ($request, $payload): Cart {
            $cart = $this->forRequest($request);
            $variant = ProductVariant::query()
                ->whereKey($payload['variant_id'])
                ->where('is_active', true)
                ->with('product')
                ->lockForUpdate()
                ->first();

            $this->assertPurchasable($variant);
            $quantity = (int) $payload['quantity'];
            $item = $cart->items()->where('variant_id', $variant->id)->lockForUpdate()->first();
            $nextQuantity = min(10, (int) $variant->stock, ($item?->quantity ?? 0) + $quantity);

            if ($nextQuantity < 1) {
                throw ValidationException::withMessages(['variant_id' => [__('cart.out_of_stock')]]);
            }

            $attributes = [
                'quantity' => $nextQuantity,
                'unit_price_toman' => (int) $variant->price_toman,
                'unit_price_usd' => (float) $variant->price_usd,
            ];
            if ($item) $item->update($attributes);
            else $cart->items()->create(['variant_id' => $variant->id, ...$attributes]);

            return $this->prepare($cart->fresh());
        });
    }

    public function update(Request $request, int $variantId, int $quantity): Cart
    {
        return DB::transaction(function () use ($request, $variantId, $quantity): Cart {
            $cart = $this->forRequest($request);
            $item = $cart->items()->where('variant_id', $variantId)->lockForUpdate()->first();
            if (!$item) {
                throw ValidationException::withMessages(['variant_id' => [__('cart.item_not_found')]]);
            }
            if ($quantity < 1) {
                $item->delete();
                return $this->prepare($cart->fresh());
            }

            $variant = ProductVariant::query()
                ->whereKey($variantId)
                ->where('is_active', true)
                ->with('product')
                ->lockForUpdate()
                ->first();
            $this->assertPurchasable($variant);

            $nextQuantity = min(10, (int) $variant->stock, $quantity);
            if ($nextQuantity < 1) {
                $item->delete();
            } else {
                $item->update([
                    'quantity' => $nextQuantity,
                    'unit_price_toman' => (int) $variant->price_toman,
                    'unit_price_usd' => (float) $variant->price_usd,
                ]);
            }

            return $this->prepare($cart->fresh());
        });
    }

    public function remove(Request $request, int $variantId): Cart
    {
        $cart = $this->forRequest($request);
        $cart->items()->where('variant_id', $variantId)->delete();
        return $this->prepare($cart->fresh());
    }

    public function clear(Request $request): Cart
    {
        $cart = $this->forRequest($request);
        $cart->items()->delete();
        $cart->update(['discount_code' => null]);
        return $this->prepare($cart->fresh());
    }

    public function applyDiscount(Request $request, ?string $code): Cart
    {
        $cart = $this->forRequest($request);
        $code = trim((string) $code);

        if ($code === '') {
            $cart->update(['discount_code' => null]);
            return $this->prepare($cart->fresh());
        }

        $subtotal = $this->subtotal($cart);
        $this->discounts->calculate($code, $subtotal['toman'], $subtotal['usd']);
        $cart->update(['discount_code' => strtoupper($code)]);

        return $this->prepare($cart->fresh());
    }

    public function prepare(Cart $cart): Cart
    {
        $cart->load([
            'items.variant.attributeValues.translations',
            'items.variant.attributeValues.attribute.translations',
            'items.variant.product.translations',
            'items.variant.product.category.translations',
            'items.variant.product.images.translations',
            'items.variant.product.variants.attributeValues.translations',
            'items.variant.product.variants.attributeValues.attribute.translations',
        ]);

        $discount = null;
        if ($cart->discount_code) {
            try {
                $subtotal = $this->subtotal($cart);
                $discount = $this->discounts->calculate(
                    $cart->discount_code,
                    $subtotal['toman'],
                    $subtotal['usd'],
                );
            } catch (ValidationException) {
                $cart->update(['discount_code' => null]);
                $cart->discount_code = null;
                $discount = null;
            }
        }

        $cart->setAttribute('subtotal_toman', $this->subtotal($cart)['toman']);
        $cart->setAttribute('subtotal_usd', $this->subtotal($cart)['usd']);
        $cart->setAttribute('discount_preview', $discount);
        return $cart;
    }

    public function subtotal(Cart $cart): array
    {
        return [
            'toman' => (int) $cart->items->sum(fn (CartItem $item) => (int) $item->unit_price_toman * $item->quantity),
            'usd' => round((float) $cart->items->sum(fn (CartItem $item) => (float) $item->unit_price_usd * $item->quantity), 2),
        ];
    }

    public function sessionId(Request $request): string
    {
        $sessionId = (string) ($request->header('X-Cart-Session') ?: $request->cookie('baran_cart_session'));
        return preg_match('/^[a-f0-9-]{20,80}$/i', $sessionId) ? $sessionId : Str::uuid()->toString();
    }

    private function assertPurchasable(?ProductVariant $variant): void
    {
        if (!$variant || !$variant->product || $variant->product->status !== 'published') {
            throw ValidationException::withMessages(['variant_id' => [__('cart.item_not_found')]]);
        }
        if ((int) $variant->stock < 1) {
            throw ValidationException::withMessages(['variant_id' => [__('cart.out_of_stock')]]);
        }
    }

    private function mergeGuestCart(Cart $guest, Cart $userCart): void
    {
        foreach ($guest->items()->lockForUpdate()->get() as $guestItem) {
            $variant = ProductVariant::query()->find($guestItem->variant_id);
            if (!$variant || !$variant->is_active || $variant->stock < 1) continue;

            $userItem = $userCart->items()->where('variant_id', $variant->id)->lockForUpdate()->first();
            $quantity = min(10, (int) $variant->stock, ($userItem?->quantity ?? 0) + $guestItem->quantity);
            if ($userItem) {
                $userItem->update(['quantity' => $quantity]);
            } else {
                $userCart->items()->create([
                    'variant_id' => $variant->id,
                    'quantity' => $quantity,
                    'unit_price_toman' => $guestItem->unit_price_toman,
                    'unit_price_usd' => $guestItem->unit_price_usd,
                ]);
            }
        }

        if (!$userCart->discount_code && $guest->discount_code) {
            $userCart->discount_code = $guest->discount_code;
            $userCart->save();
        }
        $guest->delete();
    }
}
