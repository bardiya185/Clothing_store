<?php

namespace Database\Seeders;

use App\Models\Currency;
use App\Models\Locale;
use Illuminate\Database\Seeder;

class LocaleSeeder extends Seeder
{
    public function run(): void
    {
        Currency::updateOrCreate(['code' => 'IRT'], [
            'name' => 'تومان',
            'symbol' => 'تومان',
            'decimal_places' => 0,
            'locale' => 'fa-IR',
            'is_active' => true,
        ]);

        Locale::updateOrCreate(['code' => 'fa'], [
            'name' => 'فارسی',
            'native_name' => 'فارسی',
            'direction' => 'rtl',
            'currency_code' => 'IRT',
            'is_default' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);

    }
}
