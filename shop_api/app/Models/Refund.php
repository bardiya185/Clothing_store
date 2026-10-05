<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Refund extends Model
{
    protected $fillable = ['order_id', 'return_id', 'payment_transaction_id', 'status', 'provider', 'reference', 'amount_toman', 'amount_usd', 'reason', 'metadata', 'refunded_at'];
    protected function casts(): array { return ['amount_usd' => 'decimal:2', 'metadata' => 'array', 'refunded_at' => 'datetime']; }
    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function returnRequest(): BelongsTo { return $this->belongsTo(ReturnRequest::class, 'return_id'); }
    public function transaction(): BelongsTo { return $this->belongsTo(PaymentTransaction::class, 'payment_transaction_id'); }
}
