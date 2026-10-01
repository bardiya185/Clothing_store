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

        Currency::updateOrCreate(['code' => 'USD'], [
            'name' => 'US Dollar',
            'symbol' => '$',
            'decimal_places' => 2,
            'locale' => 'en-US',
            'is_active' => true,
        ]);

        Locale::updateOrCreate(['code' => 'fa'], [
            'name' => 'Persian',
            'native_name' => 'فارسی',
            'direction' => 'rtl',
            'currency_code' => 'IRT',
            'is_default' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        Locale::updateOrCreate(['code' => 'en'], [
            'name' => 'English',
            'native_name' => 'English',
            'direction' => 'ltr',
            'currency_code' => 'USD',
            'is_default' => false,
            'is_active' => true,
            'sort_order' => 2,
        ]);
    }
}
