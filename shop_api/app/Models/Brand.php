<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Brand extends Model
{
    protected $fillable = ['slug', 'logo_path', 'is_active', 'sort_order'];
    protected function casts(): array { return ['is_active' => 'boolean']; }
    public function translations(): HasMany { return $this->hasMany(BrandTranslation::class); }
    public function products(): HasMany { return $this->hasMany(Product::class); }
}
