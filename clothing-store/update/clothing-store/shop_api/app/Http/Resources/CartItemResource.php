<?php

namespace App\Http\Resources;

use App\Support\LocaleManager;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $locale = LocaleManager::resolve($request);
        $variant = $this->variant;
        $product = $variant?->product;
        $attributes = collect($variant?->attributeValues ?? []);
        $value = function (string $slug) use ($attributes, $locale): ?string {
            $attribute = $attributes->first(fn ($item) => $item->attribute?->slug === $slug);
            if (!$attribute) return null;
            return $attribute->translations->firstWhere('locale_code', $locale)?->name
                ?? $attribute->translations->firstWhere('locale_code', LocaleManager::fallback($locale))?->name;
        };

        return [
            'id' => $this->id,
            'variant_id' => $this->variant_id,
            'product_id' => $product?->id,
            'sku' => $variant?->sku,
            'quantity' => (int) $this->quantity,
            'size' => $value('size'),
            'color' => $value('color'),
            'unit_price_toman' => (int) $this->unit_price_toman,
            'unit_price_usd' => (float) $this->unit_price_usd,
            'total_toman' => (int) $this->unit_price_toman * $this->quantity,
            'total_usd' => round((float) $this->unit_price_usd * $this->quantity, 2),
            'product' => $product ? new ProductResource($product) : null,
        ];
    }
}
