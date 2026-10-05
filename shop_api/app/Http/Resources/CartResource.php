<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $discount = $this->getAttribute('discount_preview');
        $subtotalToman = (int) $this->getAttribute('subtotal_toman');
        $subtotalUsd = (float) $this->getAttribute('subtotal_usd');

        return [
            'id' => $this->id,
            'session_id' => $this->session_id,
            'count' => $this->items->count(),
            'total_quantity' => (int) $this->items->sum('quantity'),
            'discount_code' => $this->discount_code,
            'discount' => $discount,
            'subtotal_toman' => $subtotalToman,
            'subtotal_usd' => $subtotalUsd,
            'total_toman' => max(0, $subtotalToman - (int) ($discount['discount_toman'] ?? 0)),
            'total_usd' => max(0, $subtotalUsd - (float) ($discount['discount_usd'] ?? 0)),
            'items' => CartItemResource::collection($this->items),
        ];
    }
}
