<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Campaign extends Model
{
    protected $fillable = ['slug', 'name_fa', 'name_en', 'description_fa', 'description_en', 'discount_percent', 'accent_color', 'starts_at', 'ends_at', 'is_active'];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class)
            ->withPivot('discount_percent')
            ->with(['translations', 'category.translations', 'images.translations', 'variants' => fn ($variants) => $variants->where('is_active', true)]);
    }
}
