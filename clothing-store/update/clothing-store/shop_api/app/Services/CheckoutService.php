<?php

namespace App\Services;

use App\Models\Address;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\User;
use App\Support\LocaleManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CheckoutService
{
    public function __construct(
        private readonly PostalService $postal,
        private readonly DiscountCodeService $discounts,
        private readonly CartService $carts,
    ) {}

    public function fakePay(array $payload, string $locale, User $user, Request $request): Order
    {
        $address = $user->addresses()->find($payload['address_id']);

        if (!$address instanceof Address) {
            throw ValidationException::withMessages([
                'address_id' => [__('checkout.address_required')],
            ]);
        }

        return DB::transaction(function () use ($payload, $locale, $user, $address, $request): Order {
            $cart = $this->carts->forRequest($request, $user);
            $cart->load('items');

            if ($cart->items->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => [__('cart.empty')],
                ]);
            }

            $subtotalToman = 0;
            $subtotalUsd = 0;
            $items = [];

            foreach ($cart->items as $cartItem) {
                $variant = ProductVariant::query()
                    ->whereKey($cartItem->variant_id)
                    ->where('is_active', true)
                    ->with([
                        'product.translations',
                        'attributeValues.translations',
                        'attributeValues.attribute.translations',
                    ])
                    ->lockForUpdate()
                    ->first();

                if (!$variant || !$variant->product || $variant->product->status !== 'published') {
                    throw ValidationException::withMessages([
                        'cart' => [__('checkout.product_unavailable')],
                    ]);
                }

                if ($variant->stock < $cartItem->quantity) {
                    throw ValidationException::withMessages([
                        'cart' => [__('checkout.stock_insufficient', ['product' => $variant->product->slug])],
                    ]);
                }

                $product = $variant->product;
                $nameFa = LocaleManager::translate($product->translations, 'fa') ?? $product->slug;
                $nameEn = LocaleManager::translate($product->translations, 'en') ?? $product->slug;
                $lineToman = (int) $variant->price_toman * $cartItem->quantity;
                $lineUsd = (float) $variant->price_usd * $cartItem->quantity;
                $subtotalToman += $lineToman;
                $subtotalUsd += $lineUsd;

                $variant->decrement('stock', $cartItem->quantity);
                $items[] = [
                    'product_id' => $product->id,
                    'variant_id' => $variant->id,
                    'sku' => $variant->sku,
                    'product_name_fa' => $nameFa,
                    'product_name_en' => $nameEn,
                    'quantity' => $cartItem->quantity,
                    'unit_price_toman' => (int) $variant->price_toman,
                    'unit_price_usd' => (float) $variant->price_usd,
                    'total_toman' => $lineToman,
                    'total_usd' => $lineUsd,
                    'options' => [
                        'size' => $this->variantAttribute($variant, 'size', 'fa'),
                        'color' => $this->variantAttribute($variant, 'color', 'fa'),
                    ],
                ];
            }

            $discount = $cart->discount_code
                ? $this->discounts->calculate($cart->discount_code, $subtotalToman, $subtotalUsd, true)
                : ['code' => null, 'discount_toman' => 0, 'discount_usd' => 0];
            $reference = 'FAKE-'.strtoupper(Str::random(10));
            $order = Order::create([
                'user_id' => $user->id,
                'address_id' => $address->id,
                'number' => 'BRN-'.now()->format('ymdHis').strtoupper(Str::random(4)),
                'status' => 'paid',
                'payment_status' => 'paid',
                'payment_reference' => $reference,
                'discount_code' => $discount['code'],
                'currency_code' => LocaleManager::currencyFor($locale),
                'subtotal_toman' => $subtotalToman,
                'subtotal_usd' => $subtotalUsd,
                'discount_toman' => $discount['discount_toman'],
                'discount_usd' => $discount['discount_usd'],
                'total_toman' => max(0, $subtotalToman - $discount['discount_toman']),
                'total_usd' => max(0, $subtotalUsd - $discount['discount_usd']),
                'customer_name' => $address->recipient_name,
                'customer_phone' => $address->phone,
                'customer_address' => $address->address,
                'postal_code' => $address->postal_code,
                'paid_at' => now(),
            ]);

            $order->items()->createMany($items);
            if ($discount['code']) $this->discounts->markUsed($discount['code']);
            $postal = $this->postal->register($order, $address);
            $order->update([
                'postal_status' => $postal['status'],
                'postal_tracking_code' => $postal['tracking_code'],
            ]);

            $cart->items()->delete();
            $cart->update(['discount_code' => null]);

            return $order->load('items');
        });
    }

    private function variantAttribute(ProductVariant $variant, string $slug, string $locale): ?string
    {
        $value = $variant->attributeValues->first(fn ($item) => $item->attribute?->slug === $slug);
        if (!$value) return null;

        return LocaleManager::translate($value->translations, $locale)
            ?? LocaleManager::translate($value->translations, LocaleManager::fallback($locale));
    }
}
