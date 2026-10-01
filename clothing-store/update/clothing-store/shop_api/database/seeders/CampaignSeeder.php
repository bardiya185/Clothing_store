<?php

namespace Database\Seeders;

use App\Models\Campaign;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CampaignSeeder extends Seeder
{
    public function run(): void
    {
        $campaigns = [
            [
                'slug' => 'orange-days',
                'name_fa' => 'روزهای نارنجی',
                'name_en' => 'Orange Days',
                'description_fa' => 'تخفیف‌های استثنایی برای چند انتخاب محدود باران.',
                'description_en' => 'Exceptional offers on a limited Baran selection.',
                'discount_percent' => 25,
                'accent_color' => '#e65d2f',
                'products' => ['essential-oversized-hoodie', 'relaxed-cargo-pants', 'wide-leg-denim', 'commuter-light-jacket'],
            ],
            [
                'slug' => 'new-season-edit',
                'name_fa' => 'انتخاب فصل جدید',
                'name_en' => 'New Season Edit',
                'description_fa' => 'استایل‌های تازه برای شروع یک فصل متفاوت.',
                'description_en' => 'Fresh styles for a different kind of season.',
                'discount_percent' => 15,
                'accent_color' => '#6b7255',
                'products' => ['linen-resort-shirt', 'zip-up-studio-hoodie', 'utility-pocket-vest'],
            ],
        ];

        foreach ($campaigns as $data) {
            $campaign = Campaign::updateOrCreate(['slug' => $data['slug']], [
                'name_fa' => $data['name_fa'],
                'name_en' => $data['name_en'],
                'description_fa' => $data['description_fa'],
                'description_en' => $data['description_en'],
                'discount_percent' => $data['discount_percent'],
                'accent_color' => $data['accent_color'],
                'starts_at' => now()->subDay(),
                'ends_at' => now()->addDays(7),
                'is_active' => true,
            ]);

            $productIds = Product::whereIn('slug', $data['products'])->pluck('id');
            $campaign->products()->sync($productIds->mapWithKeys(fn ($id) => [$id => ['discount_percent' => $data['discount_percent']]])->all());
        }
    }
}
