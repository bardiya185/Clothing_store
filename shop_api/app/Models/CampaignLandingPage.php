<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampaignLandingPage extends Model
{
    protected $fillable = ['campaign_id', 'slug', 'title_fa', 'title_en', 'description_fa', 'description_en', 'blocks', 'seo_title_fa', 'seo_title_en', 'is_published'];

    protected function casts(): array
    {
        return ['blocks' => 'array', 'is_published' => 'boolean'];
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
