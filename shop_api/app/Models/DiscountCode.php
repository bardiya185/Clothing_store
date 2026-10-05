<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiscountCode extends Model
{
    protected $fillable = [
        'code',
        'discount_type',
        'value_toman',
        'value_usd',
        'percentage',
        'minimum_subtotal_toman',
        'maximum_discount_toman',
        'maximum_discount_usd',
        'usage_limit',
        'used_count',
        'starts_at',
        'ends_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value_usd' => 'decimal:2',
            'maximum_discount_usd' => 'decimal:2',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }
}
