<?php

namespace Tests\Feature;

use App\Models\Currency;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartContractTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Currency::create([
            'code' => 'IRT',
            'name' => 'تومان',
            'symbol' => 'تومان',
            'decimal_places' => 0,
            'locale' => 'fa-IR',
            'is_active' => true,
        ]);
    }

    public function test_guest_cart_uses_the_valid_session_header_and_returns_a_cookie(): void
    {
        $session = '11111111-2222-3333-4444-555555555555';

        $response = $this->withHeader('X-Cart-Session', $session)->getJson('/api/cart');

        $response->assertOk()
            ->assertJsonPath('data.session_id', $session)
            ->assertJsonPath('data.total_quantity', 0)
            ->assertCookie('baran_cart_session', $session);
    }

    public function test_cart_quantity_is_capped_by_stock_and_the_ten_item_limit(): void
    {
        $product = Product::create([
            'slug' => 'contract-tee',
            'sku' => 'CONTRACT-TEE',
            'gender' => 'unisex',
            'status' => 'published',
            'is_featured' => false,
            'is_new' => true,
            'sort_order' => 1,
        ]);
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'CONTRACT-TEE-DEFAULT',
            'price_toman' => 100000,
            'price_usd' => 0,
            'stock' => 5,
            'low_stock_threshold' => 1,
            'is_default' => true,
            'is_active' => true,
        ]);
        $session = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

        $response = $this->withHeader('X-Cart-Session', $session)
            ->postJson('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 10]);

        $response->assertOk()
            ->assertJsonPath('data.total_quantity', 5)
            ->assertJsonPath('data.items.0.quantity', 5);
    }
}
