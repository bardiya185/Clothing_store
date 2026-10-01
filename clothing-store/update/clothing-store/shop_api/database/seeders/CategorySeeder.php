<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\CategoryTranslation;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'hoodies' => ['image_path' => 'Images/product-hoodie.jpg', 'fa' => ['name' => 'هودی و سویشرت', 'description' => 'لایه‌های گرم و راحت برای استایل شهری.'], 'en' => ['name' => 'Hoodies & Sweatshirts', 'description' => 'Warm, relaxed layers for everyday city life.']],
            't-shirts' => ['image_path' => 'Images/product-tee.jpg', 'fa' => ['name' => 'تیشرت', 'description' => 'بیسیک‌های خوش‌دوخت برای هر روز.'], 'en' => ['name' => 'T-shirts', 'description' => 'Well-cut essentials for every day.']],
            'pants' => ['image_path' => 'Images/product-pants.jpg', 'fa' => ['name' => 'شلوار', 'description' => 'فرم‌های آزاد با پارچه‌های ماندگار.'], 'en' => ['name' => 'Pants', 'description' => 'Relaxed silhouettes made to last.']],
            'accessories' => ['image_path' => 'Images/product-accessory.jpg', 'fa' => ['name' => 'اکسسوری', 'description' => 'جزئیات کوچک، تفاوت بزرگ.'], 'en' => ['name' => 'Accessories', 'description' => 'Small details, unmistakable impact.']],
        ];

        foreach ($categories as $sortOrder => $data) {
            $category = Category::updateOrCreate(['slug' => $sortOrder], [
                'image_path' => $data['image_path'],
                'is_active' => true,
                'sort_order' => array_search($sortOrder, array_keys($categories), true),
            ]);

            foreach (['fa', 'en'] as $locale) {
                CategoryTranslation::updateOrCreate(['category_id' => $category->id, 'locale_code' => $locale], $data[$locale]);
            }
        }
    }
}
