<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = ['order_id', 'product_id', 'variant_id', 'sku', 'product_name_fa', 'product_name_en', 'quantity', 'unit_price_toman', 'unit_price_usd', 'total_toman', 'total_usd', 'options'];

    protected function casts(): array
    {
        return ['unit_price_usd' => 'decimal:2', 'total_usd' => 'decimal:2', 'options' => 'array'];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
}
