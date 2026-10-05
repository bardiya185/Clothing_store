<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ShippingMethod extends Model
{
    protected $fillable = ['code', 'name_fa', 'name_en', 'price_toman', 'price_usd', 'estimated_days', 'is_active', 'sort_order', 'metadata'];
    protected function casts(): array { return ['price_usd' => 'decimal:2', 'is_active' => 'boolean', 'metadata' => 'array']; }
    public function shipments(): HasMany { return $this->hasMany(Shipment::class); }
}
