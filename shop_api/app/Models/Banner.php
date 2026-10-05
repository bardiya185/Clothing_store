<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    protected $fillable = [
        'placement',
        'title_fa',
        'title_en',
        'subtitle_fa',
        'subtitle_en',
        'image',
        'mobile_image',
        'href',
        'cta_fa',
        'cta_en',
        'accent_color',
        'text_color',
        'sort_order',
        'starts_at',
        'ends_at',
        'is_active',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function isCurrentlyVisible(): bool
    {
        return $this->is_active
            && (!$this->starts_at || now()->greaterThanOrEqualTo($this->starts_at))
            && (!$this->ends_at || now()->lessThanOrEqualTo($this->ends_at));
    }
}
