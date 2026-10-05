<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnItem extends Model
{
    protected $fillable = ['return_id', 'order_item_id', 'quantity', 'reason'];
    public function request(): BelongsTo { return $this->belongsTo(ReturnRequest::class, 'return_id'); }
    public function orderItem(): BelongsTo { return $this->belongsTo(OrderItem::class); }
}
