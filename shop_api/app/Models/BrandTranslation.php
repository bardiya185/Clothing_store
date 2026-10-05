<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrandTranslation extends Model
{
    protected $fillable = ['brand_id', 'locale_code', 'name', 'description'];
    public function brand(): BelongsTo { return $this->belongsTo(Brand::class); }
}
