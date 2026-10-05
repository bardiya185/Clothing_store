<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Keep existing English rows for data integrity and rollback, but make
        // Persian the only active/default language exposed by the application.
        DB::table('locales')->where('code', 'fa')->update([
            'name' => 'فارسی',
            'native_name' => 'فارسی',
            'direction' => 'rtl',
            'currency_code' => 'IRT',
            'is_default' => true,
            'is_active' => true,
            'sort_order' => 1,
            'updated_at' => now(),
        ]);
        DB::table('locales')->where('code', '!=', 'fa')->update([
            'is_default' => false,
            'is_active' => false,
            'updated_at' => now(),
        ]);
        DB::table('currencies')->where('code', 'IRT')->update([
            'name' => 'تومان',
            'symbol' => 'تومان',
            'locale' => 'fa-IR',
            'is_active' => true,
            'updated_at' => now(),
        ]);
        DB::table('currencies')->where('code', '!=', 'IRT')->update([
            'is_active' => false,
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('locales')->where('code', 'en')->update([
            'is_active' => true,
            'is_default' => false,
            'updated_at' => now(),
        ]);
        DB::table('currencies')->where('code', 'USD')->update([
            'is_active' => true,
            'updated_at' => now(),
        ]);
    }
};
