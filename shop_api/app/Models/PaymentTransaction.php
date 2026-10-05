<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentTransaction extends Model
{
    protected $fillable = ['order_id', 'provider', 'transaction_type', 'status', 'currency_code', 'amount_toman', 'amount_usd', 'reference', 'provider_transaction_id', 'failure_reason', 'metadata', 'paid_at'];
    protected function casts(): array { return ['amount_usd' => 'decimal:2', 'metadata' => 'array', 'paid_at' => 'datetime']; }
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
}
