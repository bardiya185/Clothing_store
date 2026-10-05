<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    protected $fillable = ['variant_id', 'actor_id', 'movement_type', 'quantity_delta', 'stock_before', 'stock_after', 'reason', 'reference_type', 'reference_id', 'metadata'];
    protected function casts(): array { return ['metadata' => 'array']; }
    public function variant(): BelongsTo { return $this->belongsTo(ProductVariant::class, 'variant_id'); }
    public function actor(): BelongsTo { return $this->belongsTo(User::class, 'actor_id'); }
}
