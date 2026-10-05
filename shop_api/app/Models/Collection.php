<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Collection extends Model
{
    protected $fillable = ['slug', 'is_active', 'sort_order', 'starts_at', 'ends_at'];
    protected function casts(): array { return ['is_active' => 'boolean', 'starts_at' => 'datetime', 'ends_at' => 'datetime']; }
    public function translations(): HasMany { return $this->hasMany(CollectionTranslation::class); }
    public function products(): BelongsToMany { return $this->belongsToMany(Product::class, 'collection_product'); }
}
