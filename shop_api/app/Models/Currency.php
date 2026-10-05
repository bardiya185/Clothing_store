<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    protected $primaryKey = 'code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['code', 'name', 'symbol', 'decimal_places', 'locale', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'decimal_places' => 'integer'];
    }
}
