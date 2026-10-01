<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = ['user_id', 'address_id', 'number', 'status', 'payment_status', 'payment_reference', 'discount_code', 'postal_status', 'postal_tracking_code', 'currency_code', 'subtotal_toman', 'subtotal_usd', 'discount_toman', 'discount_usd', 'shipping_toman', 'shipping_usd', 'total_toman', 'total_usd', 'customer_name', 'customer_phone', 'customer_address', 'postal_code', 'customer_note', 'paid_at', 'cancelled_at'];

    protected function casts(): array
    {
        return ['subtotal_usd' => 'decimal:2', 'discount_usd' => 'decimal:2', 'shipping_usd' => 'decimal:2', 'total_usd' => 'decimal:2', 'paid_at' => 'datetime', 'cancelled_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
