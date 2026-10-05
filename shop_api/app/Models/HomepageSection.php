<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HomepageSection extends Model
{
    protected $fillable = ['key', 'section_type', 'payload', 'sort_order', 'starts_at', 'ends_at', 'is_active', 'published_at'];
    protected function casts(): array { return ['payload' => 'array', 'starts_at' => 'datetime', 'ends_at' => 'datetime', 'is_active' => 'boolean', 'published_at' => 'datetime']; }
}
