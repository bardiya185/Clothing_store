<?php

namespace Database\Seeders;

use App\Models\Attribute;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductImageTranslation;
use App\Models\ProductTranslation;
use App\Models\ProductVariant;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::pluck('id', 'slug');
        $attributeIds = Attribute::with('values')->get()->mapWithKeys(fn ($attribute) => [$attribute->slug => $attribute->values->pluck('id', 'slug')]);
        $products = [
            ['slug' => 'essential-oversized-hoodie', 'sku' => 'BRN-HDY-001', 'category' => 'hoodies', 'gender' => 'unisex', 'image' => 'Images/product-hoodie.jpg', 'featured' => true, 'new' => true, 'fa' => ['name' => 'هودی اورسایز اسنشیال', 'short_description' => 'یک هودی سنگین و نرم برای روزهای خنک.', 'description' => 'طراحی اورسایز با پارچه دورس سه‌نخ، سرآستین کشباف و دوخت تمیز ایرانی.'], 'price_toman' => 1280000, 'price_usd' => 39, 'compare_toman' => 1490000, 'compare_usd' => 46, 'stock' => 18, 'values' => ['size' => 'm', 'color' => 'stone', 'material' => 'fleece']],
            ['slug' => 'daily-boxy-tee', 'sku' => 'BRN-TEE-002', 'category' => 't-shirts', 'gender' => 'unisex', 'image' => 'Images/product-tee.jpg', 'featured' => true, 'new' => false, 'fa' => ['name' => 'تیشرت باکسی دیلی', 'short_description' => 'بیسیک روزانه با فرم آزاد و شخصیت خودش.', 'description' => 'تیشرت پنبه‌ای با یقه محکم، فرم باکسی و چاپ مینیمال باران.'], 'price_toman' => 590000, 'price_usd' => 19, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 26, 'values' => ['size' => 'l', 'color' => 'black', 'material' => 'cotton']],
            ['slug' => 'آزاد-cargo-pants', 'sku' => 'BRN-PNT-003', 'category' => 'pants', 'gender' => 'men', 'image' => 'Images/product-pants.jpg', 'featured' => true, 'new' => true, 'fa' => ['name' => 'شلوار کارگو ریلکس', 'short_description' => 'جیب‌های کاربردی، فرم آزاد، حرکت بدون محدودیت.', 'description' => 'شلوار کارگو با کمر کشی، بند تنظیم و جیب‌های عمیق برای استایل هر روز.'], 'price_toman' => 1490000, 'price_usd' => 49, 'compare_toman' => 1690000, 'compare_usd' => 55, 'stock' => 14, 'values' => ['size' => 'm', 'color' => 'olive', 'material' => 'cotton']],
            ['slug' => 'soft-utility-overshirt', 'sku' => 'BRN-SHR-004', 'category' => 'hoodies', 'gender' => 'women', 'image' => 'Images/product-shirt.jpg', 'featured' => false, 'new' => true, 'fa' => ['name' => 'اورشرت سافت یوتیلیتی', 'short_description' => 'یک لایه سبک برای کامل‌کردن هر استایل.', 'description' => 'اورشرت سبک با دوخت کاربردی و فرم آزاد، ساخته‌شده برای لایه‌پوشی.'], 'price_toman' => 1190000, 'price_usd' => 38, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 11, 'values' => ['size' => 's', 'color' => 'cream', 'material' => 'linen']],
            ['slug' => 'baran-statement-cap', 'sku' => 'BRN-CAP-005', 'category' => 'accessories', 'gender' => 'unisex', 'image' => 'Images/product-accessory.jpg', 'featured' => false, 'new' => false, 'fa' => ['name' => 'کپ استیتمنت باران', 'short_description' => 'امضای آخر برای یک استایل کامل.', 'description' => 'کپ شش‌تکه با بند تنظیم و لوگوی گلدوزی‌شده باران.'], 'price_toman' => 420000, 'price_usd' => 15, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 35, 'values' => ['size' => 'm', 'color' => 'black', 'material' => 'cotton']],
            ['slug' => 'everyday-heavy-tee', 'sku' => 'BRN-TEE-006', 'category' => 't-shirts', 'gender' => 'women', 'image' => 'Images/product-tee.jpg', 'featured' => false, 'new' => true, 'fa' => ['name' => 'تیشرت سنگین روزمره', 'short_description' => 'سادگی‌ای که از دور هم دیده می‌شود.', 'description' => 'تیشرت سنگین با فرم آزاد و پارچه‌ای که بعد از شست‌وشو فرم خود را حفظ می‌کند.'], 'price_toman' => 690000, 'price_usd' => 22, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 20, 'values' => ['size' => 's', 'color' => 'stone', 'material' => 'cotton']],
        ];

        $products = array_merge($products, [
            ['slug' => 'zip-up-studio-hoodie', 'sku' => 'BRN-HDY-007', 'category' => 'hoodies', 'gender' => 'men', 'image' => 'Images/product-hoodie.jpg', 'featured' => false, 'new' => true, 'fa' => ['name' => 'هودی زیپ‌دار استودیو', 'short_description' => 'لایه‌ای تمیز برای شروع و پایان روز.', 'description' => 'هودی زیپ‌دار با فرم راحت، کلاه دو لایه و پارچه دورس نرم.'], 'price_toman' => 1390000, 'price_usd' => 44, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 16, 'values' => ['size' => 'l', 'color' => 'black', 'material' => 'fleece']],
            ['slug' => 'cropped-everyday-tee', 'sku' => 'BRN-TEE-008', 'category' => 't-shirts', 'gender' => 'women', 'image' => 'Images/product-tee.jpg', 'featured' => false, 'new' => true, 'fa' => ['name' => 'تیشرت کراپ روزمره', 'short_description' => 'فرم کوتاه، حس راحت و استایل دقیق.', 'description' => 'تیشرت کراپ پنبه‌ای با یقه کشباف و فرم متعادل برای لایه‌پوشی.'], 'price_toman' => 630000, 'price_usd' => 20, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 23, 'values' => ['size' => 's', 'color' => 'cream', 'material' => 'cotton']],
            ['slug' => 'wide-leg-denim', 'sku' => 'BRN-PNT-009', 'category' => 'pants', 'gender' => 'women', 'image' => 'Images/product-pants.jpg', 'featured' => true, 'new' => false, 'fa' => ['name' => 'جین وایدلگ', 'short_description' => 'آزاد، ساختاریافته و مناسب هر روز.', 'description' => 'جین وایدلگ با کمر استاندارد و فرم آزاد که با هر کفشی هماهنگ می‌شود.'], 'price_toman' => 1590000, 'price_usd' => 52, 'compare_toman' => 1790000, 'compare_usd' => 58, 'stock' => 12, 'values' => ['size' => 'm', 'color' => 'stone', 'material' => 'cotton']],
            ['slug' => 'nylon-track-pants', 'sku' => 'BRN-PNT-010', 'category' => 'pants', 'gender' => 'men', 'image' => 'Images/product-pants.jpg', 'featured' => false, 'new' => true, 'fa' => ['name' => 'شلوار ترک نایلونی', 'short_description' => 'سبک، سریع و آماده حرکت.', 'description' => 'شلوار نایلونی سبک با مچ قابل تنظیم و جیب‌های زیپ‌دار.'], 'price_toman' => 1190000, 'price_usd' => 38, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 17, 'values' => ['size' => 'l', 'color' => 'olive', 'material' => 'cotton']],
            ['slug' => 'وَرسیتی-fleece-sweatshirt', 'sku' => 'BRN-SWT-011', 'category' => 'hoodies', 'gender' => 'unisex', 'image' => 'Images/product-hoodie.jpg', 'featured' => true, 'new' => false, 'fa' => ['name' => 'سویشرت فلیس وَرسیتی', 'short_description' => 'گرم و ساده با یک جزئیات بازیگوش.', 'description' => 'سویشرت دورس با چاپ مینیمال و فرم آزاد برای روزهای طولانی.'], 'price_toman' => 1090000, 'price_usd' => 35, 'compare_toman' => 1290000, 'compare_usd' => 41, 'stock' => 19, 'values' => ['size' => 'm', 'color' => 'cream', 'material' => 'fleece']],
            ['slug' => 'ribbed-long-sleeve', 'sku' => 'BRN-TEE-012', 'category' => 't-shirts', 'gender' => 'women', 'image' => 'Images/product-tee.jpg', 'featured' => false, 'new' => false, 'fa' => ['name' => 'لانگ‌اسلیو ریب', 'short_description' => 'یک بیسیک لایه‌ای برای تمام فصل.', 'description' => 'لانگ‌اسلیو با بافت ریب نرم و فرم چسبان اما راحت.'], 'price_toman' => 760000, 'price_usd' => 25, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 28, 'values' => ['size' => 's', 'color' => 'stone', 'material' => 'cotton']],
            ['slug' => 'linen-resort-shirt', 'sku' => 'BRN-SHR-013', 'category' => 't-shirts', 'gender' => 'unisex', 'image' => 'Images/product-shirt.jpg', 'featured' => false, 'new' => true, 'fa' => ['name' => 'پیراهن لینن ریزورت', 'short_description' => 'سبک و خنک برای روزهای آفتابی.', 'description' => 'پیراهن لینن آزاد با یقه باز و دکمه‌های طبیعی.'], 'price_toman' => 1290000, 'price_usd' => 42, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 13, 'values' => ['size' => 'm', 'color' => 'cream', 'material' => 'linen']],
            ['slug' => 'utility-pocket-vest', 'sku' => 'BRN-VST-014', 'category' => 'hoodies', 'gender' => 'men', 'image' => 'Images/product-hoodie.jpg', 'featured' => false, 'new' => true, 'fa' => ['name' => 'جلیقه پاکتی یوتیلیتی', 'short_description' => 'لایه‌ای کاربردی برای استایل چندلایه.', 'description' => 'جلیقه سبک با جیب‌های کاربردی و بند تنظیم در کمر.'], 'price_toman' => 980000, 'price_usd' => 32, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 10, 'values' => ['size' => 'l', 'color' => 'olive', 'material' => 'cotton']],
            ['slug' => 'canvas-daily-tote', 'sku' => 'BRN-BAG-015', 'category' => 'accessories', 'gender' => 'unisex', 'image' => 'Images/product-accessory.jpg', 'featured' => true, 'new' => false, 'fa' => ['name' => 'توت‌بگ کنواس دیلی', 'short_description' => 'هر چیزی که امروز لازم داری، همراهت.', 'description' => 'توت‌بگ کنواس مقاوم با جیب داخلی و دسته‌های بلند.'], 'price_toman' => 480000, 'price_usd' => 16, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 32, 'values' => ['size' => 'm', 'color' => 'cream', 'material' => 'cotton']],
            ['slug' => 'ribbed-winter-beanie', 'sku' => 'BRN-HAT-016', 'category' => 'accessories', 'gender' => 'unisex', 'image' => 'Images/product-accessory.jpg', 'featured' => false, 'new' => true, 'fa' => ['name' => 'کلاه بافت زمستانی', 'short_description' => 'گرم، نرم و آماده هوای سرد.', 'description' => 'کلاه بافت ریب با لوگوی کوچک باران برای فصل سرد.'], 'price_toman' => 390000, 'price_usd' => 13, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 41, 'values' => ['size' => 'm', 'color' => 'black', 'material' => 'cotton']],
            ['slug' => 'studio-jogger', 'sku' => 'BRN-PNT-017', 'category' => 'pants', 'gender' => 'unisex', 'image' => 'Images/product-pants.jpg', 'featured' => false, 'new' => false, 'fa' => ['name' => 'جاگر استودیو', 'short_description' => 'راحتی خانه، فرم خیابان.', 'description' => 'جاگر دورس با کمر کشی و فرم مخروطی برای استفاده روزمره.'], 'price_toman' => 990000, 'price_usd' => 32, 'compare_toman' => 1150000, 'compare_usd' => 37, 'stock' => 22, 'values' => ['size' => 'm', 'color' => 'stone', 'material' => 'fleece']],
            ['slug' => 'everyday-sweatshort', 'sku' => 'BRN-SHT-018', 'category' => 'pants', 'gender' => 'women', 'image' => 'Images/product-pants.jpg', 'featured' => false, 'new' => true, 'fa' => ['name' => 'شلوارک روزمره', 'short_description' => 'فرم آزاد برای روزهای بی‌برنامه.', 'description' => 'شلوارک سبک با جیب‌های عمیق و بند تنظیم نرم.'], 'price_toman' => 690000, 'price_usd' => 23, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 24, 'values' => ['size' => 's', 'color' => 'olive', 'material' => 'cotton']],
            ['slug' => 'minimal-graphic-tee', 'sku' => 'BRN-TEE-019', 'category' => 't-shirts', 'gender' => 'men', 'image' => 'Images/product-tee.jpg', 'featured' => true, 'new' => false, 'fa' => ['name' => 'تیشرت گرافیک مینیمال', 'short_description' => 'یک نشانه کوچک با حضور بزرگ.', 'description' => 'تیشرت پنبه‌ای سنگین با گرافیک کوچک و فرم آزاد.'], 'price_toman' => 650000, 'price_usd' => 21, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 31, 'values' => ['size' => 'l', 'color' => 'black', 'material' => 'cotton']],
            ['slug' => 'commuter-light-jacket', 'sku' => 'BRN-JKT-020', 'category' => 'hoodies', 'gender' => 'men', 'image' => 'Images/product-hoodie.jpg', 'featured' => true, 'new' => true, 'fa' => ['name' => 'کت سبک کامیوتر', 'short_description' => 'برای رفت‌وآمد، سفر و هر مسیر تازه.', 'description' => 'کت سبک ضدباد با یقه ایستاده، جیب‌های مخفی و فرم تمیز.'], 'price_toman' => 1890000, 'price_usd' => 62, 'compare_toman' => null, 'compare_usd' => null, 'stock' => 9, 'values' => ['size' => 'l', 'color' => 'black', 'material' => 'cotton']],
        ]);

        foreach ($products as $sortOrder => $data) {
            $product = Product::updateOrCreate(['slug' => $data['slug']], [
                'category_id' => $categories[$data['category']], 'sku' => $data['sku'], 'gender' => $data['gender'], 'status' => 'published', 'is_featured' => $data['featured'], 'is_new' => $data['new'], 'sort_order' => $sortOrder,
            ]);
            foreach (['fa'] as $locale) ProductTranslation::updateOrCreate(['product_id' => $product->id, 'locale_code' => $locale], $data[$locale]);

            // Re-seeding should reflect the complete size range instead of leaving one hidden default size.
            $product->variants()->delete();
            $sizeSlugs = ['s', 'm', 'l', 'xl'];
            foreach ($sizeSlugs as $sizeIndex => $sizeSlug) {
                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'sku' => $data['sku'].'-'.strtoupper($sizeSlug),
                    'price_toman' => $data['price_toman'],
                    'price_usd' => $data['price_usd'],
                    'compare_at_toman' => $data['compare_toman'],
                    'compare_at_usd' => $data['compare_usd'],
                    'stock' => max(1, (int) ceil($data['stock'] / count($sizeSlugs))),
                    'is_default' => $sizeSlug === $data['values']['size'],
                    'is_active' => true,
                ]);
                $variantValues = $data['values'];
                $variantValues['size'] = $sizeSlug;
                $variant->attributeValues()->sync(array_map(
                    fn ($attributeSlug, $valueSlug) => $attributeIds[$attributeSlug][$valueSlug],
                    array_keys($variantValues),
                    $variantValues,
                ));
            }

            $image = ProductImage::updateOrCreate(['product_id' => $product->id, 'path' => $data['image']], ['variant_id' => $product->variants()->where('is_default', true)->value('id'), 'is_primary' => true, 'sort_order' => 0, 'alt_text' => $data['fa']['name']]);
            foreach (['fa'] as $locale) ProductImageTranslation::updateOrCreate(['product_image_id' => $image->id, 'locale_code' => $locale], ['alt_text' => $data[$locale]['name']]);
        }
    }
}
