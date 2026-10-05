<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // This migration is intentionally destructive for the English locale.
        // Take a database backup before running it in production.
        foreach ([
            'category_translations',
            'product_translations',
            'product_image_translations',
            'attribute_translations',
            'attribute_value_translations',
            'brand_translations',
            'collection_translations',
        ] as $table) {
            DB::table($table)->where('locale_code', 'en')->delete();
        }

        // Keep legacy bilingual columns for schema compatibility, but make
        // their stored value Persian before the English locale is removed.
        foreach ([
            'campaigns' => ['name_en' => 'name_fa', 'description_en' => 'description_fa'],
            'campaign_landing_pages' => ['title_en' => 'title_fa', 'description_en' => 'description_fa', 'seo_title_en' => 'seo_title_fa'],
            'banners' => ['title_en' => 'title_fa', 'subtitle_en' => 'subtitle_fa', 'cta_en' => 'cta_fa'],
            'shipping_methods' => ['name_en' => 'name_fa'],
            'order_items' => ['product_name_en' => 'product_name_fa'],
        ] as $table => $columns) {
            foreach ($columns as $target => $source) {
                DB::table($table)->update([$target => DB::raw($source)]);
            }
        }

        DB::table('locales')->where('code', 'en')->delete();
        DB::table('currencies')->where('code', 'USD')->delete();

        foreach ([
            'super_admin' => 'مدیر ارشد',
            'store_manager' => 'مدیر فروشگاه',
            'product_manager' => 'مدیر محصولات',
            'inventory_manager' => 'مدیر موجودی',
            'order_manager' => 'مدیر سفارش‌ها',
            'marketing_manager' => 'مدیر بازاریابی',
            'customer_support' => 'پشتیبانی مشتری',
            'admin' => 'مدیر سامانه',
            'manager' => 'مدیر فروشگاه',
            'inventory' => 'مدیر موجودی',
            'writer' => 'نویسنده محتوا',
            'visual_editor' => 'ویرایشگر محتوای تصویری',
            'content_moderator' => 'ناظر محتوا',
        ] as $name => $label) {
            DB::table('roles')->where('name', $name)->update(['label' => $label]);
        }
    }

    public function down(): void
    {
        // English translation rows were intentionally deleted and cannot be
        // reconstructed. Restore them from the pre-migration backup if needed.
    }
};
