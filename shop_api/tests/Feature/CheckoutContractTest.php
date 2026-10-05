<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Currency;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CheckoutContractTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Currency::create([
            'code' => 'IRT',
            'name' => 'Toman',
            'symbol' => 'تومان',
            'decimal_places' => 0,
            'locale' => 'fa-IR',
            'is_active' => true,
        ]);
    }

    public function test_checkout_decrements_stock_clears_the_cart_and_survives_unconfigured_postal_service(): void
    {
        $user = User::create(['phone' => '09120000004', 'name' => 'Checkout customer']);
        $address = Address::create([
            'user_id' => $user->id,
            'title' => 'خانه',
            'recipient_name' => 'Checkout customer',
            'phone' => $user->phone,
            'province' => 'تهران',
            'city' => 'تهران',
            'address' => 'خیابان تست، پلاک ۱',
            'postal_code' => '1234567890',
            'is_default' => true,
        ]);
        $product = Product::create([
            'slug' => 'checkout-hoodie',
            'sku' => 'CHECKOUT-HOODIE',
            'gender' => 'unisex',
            'status' => 'published',
            'is_featured' => false,
            'is_new' => false,
            'sort_order' => 1,
        ]);
        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'CHECKOUT-HOODIE-DEFAULT',
            'price_toman' => 250000,
            'price_usd' => 8,
            'stock' => 3,
            'low_stock_threshold' => 1,
            'is_default' => true,
            'is_active' => true,
        ]);
        Sanctum::actingAs($user);
        $session = '99999999-8888-7777-6666-555555555555';

        $this->withHeader('X-Cart-Session', $session)
            ->postJson('/api/cart/items', ['variant_id' => $variant->id, 'quantity' => 2])
            ->assertOk();

        $response = $this->postJson('/api/checkout/fake-pay', [
            'address_id' => $address->id,
            'card_number' => '1111222233334444',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.postal_status', 'not_configured')
            ->assertJsonPath('data.total_toman', 500000);
        $this->assertDatabaseHas('product_variants', ['id' => $variant->id, 'stock' => 1]);
        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('cart_items', 0);
    }
}
