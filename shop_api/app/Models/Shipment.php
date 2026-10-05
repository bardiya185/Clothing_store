<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shipment extends Model
{
    protected $fillable = ['order_id', 'shipping_method_id', 'provider', 'status', 'tracking_code', 'failure_reason', 'metadata', 'shipped_at', 'delivered_at'];
    protected function casts(): array { return ['metadata' => 'array', 'shipped_at' => 'datetime', 'delivered_at' => 'datetime']; }
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function method(): BelongsTo { return $this->belongsTo(ShippingMethod::class, 'shipping_method_id'); }
}
