<?php

namespace Database\Seeders;

use App\Models\Attribute;
use App\Models\AttributeTranslation;
use App\Models\AttributeValue;
use App\Models\AttributeValueTranslation;
use Illuminate\Database\Seeder;

class AttributeSeeder extends Seeder
{
    public function run(): void
    {
        $attributes = [
            'size' => ['type' => 'select', 'required' => true, 'fa' => 'سایز', 'en' => 'Size', 'values' => [
                's' => ['fa' => 'کوچک', 'en' => 'Small'], 'm' => ['fa' => 'متوسط', 'en' => 'Medium'], 'l' => ['fa' => 'بزرگ', 'en' => 'Large'], 'xl' => ['fa' => 'خیلی بزرگ', 'en' => 'Extra Large'],
            ]],
            'color' => ['type' => 'color', 'required' => true, 'fa' => 'رنگ', 'en' => 'Color', 'values' => [
                'black' => ['fa' => 'مشکی', 'en' => 'Black', 'color_hex' => '#171717'], 'cream' => ['fa' => 'کرم', 'en' => 'Cream', 'color_hex' => '#E9E2D0'], 'olive' => ['fa' => 'زیتونی', 'en' => 'Olive', 'color_hex' => '#626B4D'], 'stone' => ['fa' => 'طوسی سنگی', 'en' => 'Stone', 'color_hex' => '#9B9A96'],
            ]],
            'material' => ['type' => 'select', 'required' => false, 'fa' => 'جنس پارچه', 'en' => 'Material', 'values' => [
                'cotton' => ['fa' => 'نخ پنبه', 'en' => 'Cotton'], 'fleece' => ['fa' => 'دورس سه نخ', 'en' => 'Three-thread fleece'], 'linen' => ['fa' => 'لینن', 'en' => 'Linen'],
            ]],
        ];

        foreach ($attributes as $attributeSlug => $data) {
            $attribute = Attribute::updateOrCreate(['slug' => $attributeSlug], [
                'type' => $data['type'], 'is_filterable' => true, 'is_required' => $data['required'], 'sort_order' => array_search($attributeSlug, array_keys($attributes), true),
            ]);
            foreach (['fa', 'en'] as $locale) {
                AttributeTranslation::updateOrCreate(['attribute_id' => $attribute->id, 'locale_code' => $locale], ['name' => $data[$locale]]);
            }
            foreach ($data['values'] as $valueSlug => $valueData) {
                $value = AttributeValue::updateOrCreate(['attribute_id' => $attribute->id, 'slug' => $valueSlug], [
                    'color_hex' => $valueData['color_hex'] ?? null,
                    'sort_order' => array_search($valueSlug, array_keys($data['values']), true),
                ]);
                foreach (['fa', 'en'] as $locale) {
                    AttributeValueTranslation::updateOrCreate(['attribute_value_id' => $value->id, 'locale_code' => $locale], ['name' => $valueData[$locale]]);
                }
            }
        }
    }
}
