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
            'size' => ['type' => 'select', 'required' => true, 'fa' => 'سایز', 'values' => [
                's' => ['fa' => 'کوچک'], 'm' => ['fa' => 'متوسط'], 'l' => ['fa' => 'بزرگ'], 'xl' => ['fa' => 'خیلی بزرگ'],
            ]],
            'color' => ['type' => 'color', 'required' => true, 'fa' => 'رنگ', 'values' => [
                'black' => ['fa' => 'مشکی', 'color_hex' => '#171717'], 'cream' => ['fa' => 'کرم', 'color_hex' => '#E9E2D0'], 'olive' => ['fa' => 'زیتونی', 'color_hex' => '#626B4D'], 'stone' => ['fa' => 'طوسی سنگی', 'color_hex' => '#9B9A96'],
            ]],
            'material' => ['type' => 'select', 'required' => false, 'fa' => 'جنس پارچه', 'values' => [
                'cotton' => ['fa' => 'نخ پنبه'], 'fleece' => ['fa' => 'دورس سه نخ'], 'linen' => ['fa' => 'لینن'],
            ]],
        ];

        foreach ($attributes as $attributeSlug => $data) {
            $attribute = Attribute::updateOrCreate(['slug' => $attributeSlug], [
                'type' => $data['type'], 'is_filterable' => true, 'is_required' => $data['required'], 'sort_order' => array_search($attributeSlug, array_keys($attributes), true),
            ]);
            foreach (['fa'] as $locale) {
                AttributeTranslation::updateOrCreate(['attribute_id' => $attribute->id, 'locale_code' => $locale], ['name' => $data[$locale]]);
            }
            foreach ($data['values'] as $valueSlug => $valueData) {
                $value = AttributeValue::updateOrCreate(['attribute_id' => $attribute->id, 'slug' => $valueSlug], [
                    'color_hex' => $valueData['color_hex'] ?? null,
                    'sort_order' => array_search($valueSlug, array_keys($data['values']), true),
                ]);
                foreach (['fa'] as $locale) {
                    AttributeValueTranslation::updateOrCreate(['attribute_value_id' => $value->id, 'locale_code' => $locale], ['name' => $valueData[$locale]]);
                }
            }
        }
    }
}
