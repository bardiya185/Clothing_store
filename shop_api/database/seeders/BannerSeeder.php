<?php

namespace Database\Seeders;

use App\Models\Banner;
use Illuminate\Database\Seeder;

class BannerSeeder extends Seeder
{
    public function run(): void
    {
        $banners = [
            [
                'placement' => 'home.after-hero',
                'sort_order' => 10,
                'title_fa' => 'دراپ تازه باران',
                'title_en' => 'دراپ تازه باران',
                'subtitle_fa' => 'استایل‌های تازه برای روزهایی که معمولی بودن کافی نیست.',
                'subtitle_en' => 'استایل‌های تازه برای روزهایی که معمولی بودن کافی نیست.',
                'image' => '/Images/hero.jpg',
                'mobile_image' => '/Images/hero.jpg',
                'href' => '/shop?new=true',
                'cta_fa' => 'مشاهده دراپ',
                'cta_en' => 'مشاهده دراپ',
                'accent_color' => '#183b56',
                'text_color' => '#ffffff',
                'is_active' => true,
            ],
            [
                'placement' => 'home.after-hero',
                'sort_order' => 20,
                'title_fa' => 'فروش محدود آخر فصل',
                'title_en' => 'فروش محدود آخر فصل',
                'subtitle_fa' => 'تعداد محدود، فرصت کوتاه.',
                'subtitle_en' => 'تعداد محدود، فرصت کوتاه.',
                'image' => '/Images/hero.jpg',
                'mobile_image' => '/Images/hero.jpg',
                'href' => '/shop?sale=true',
                'cta_fa' => 'خرید با تخفیف',
                'cta_en' => 'خرید با تخفیف',
                'accent_color' => '#e65d2f',
                'text_color' => '#ffffff',
                'is_active' => true,
            ],
            [
                'placement' => 'shop.top',
                'sort_order' => 10,
                'title_fa' => 'خودت انتخاب کن، ما سریع می‌فرستیم',
                'title_en' => 'خودت انتخاب کن، ما سریع می‌فرستیم',
                'subtitle_fa' => 'فیلتر کن، مقایسه کن و با خیال راحت سفارش بده.',
                'subtitle_en' => 'فیلتر کن، مقایسه کن و با خیال راحت سفارش بده.',
                'image' => '/Images/hero.jpg',
                'mobile_image' => '/Images/hero.jpg',
                'href' => '/shop?sort=newest',
                'cta_fa' => 'دیدن کالکشن',
                'cta_en' => 'دیدن کالکشن',
                'accent_color' => '#75624e',
                'text_color' => '#ffffff',
                'is_active' => true,
            ],
        ];

        foreach ($banners as $banner) {
            Banner::updateOrCreate(
                ['placement' => $banner['placement'], 'sort_order' => $banner['sort_order']],
                $banner,
            );
        }
    }
}
