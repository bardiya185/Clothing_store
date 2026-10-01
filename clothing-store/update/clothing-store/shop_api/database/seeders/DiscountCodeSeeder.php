<?php

namespace Database\Seeders;

use App\Models\DiscountCode;
use Illuminate\Database\Seeder;

class DiscountCodeSeeder extends Seeder
{
    public function run(): void
    {
        DiscountCode::updateOrCreate(['code' => 'BARAN25'], [
            'discount_type' => 'percentage',
            'percentage' => 25,
            'value_toman' => 0,
            'value_usd' => 0,
            'minimum_subtotal_toman' => 500000,
            'maximum_discount_toman' => 1000000,
            'maximum_discount_usd' => 30,
            'usage_limit' => null,
            'is_active' => true,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(30),
        ]);
    }
}
