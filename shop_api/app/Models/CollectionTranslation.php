<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CollectionTranslation extends Model
{
    protected $fillable = ['collection_id', 'locale_code', 'name', 'description'];
    public function collection(): BelongsTo { return $this->belongsTo(Collection::class); }
}
