<?php

namespace Tests\Feature;

use App\Models\Currency;
use App\Models\Locale;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAuthorizationContractTest extends TestCase
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
        Locale::create([
            'code' => 'fa',
            'name' => 'Persian',
            'native_name' => 'فارسی',
            'direction' => 'rtl',
            'currency_code' => 'IRT',
            'is_default' => true,
            'is_active' => true,
            'sort_order' => 1,
        ]);
        $this->seed(RolePermissionSeeder::class);
    }

    public function test_user_without_a_role_cannot_access_admin_endpoints(): void
    {
        $user = User::create(['phone' => '09120000001', 'name' => 'بدون دسترسی']);
        Sanctum::actingAs($user);

        $this->getJson('/api/admin/products')->assertForbidden();
    }

    public function test_active_role_without_required_permission_is_still_denied(): void
    {
        $user = User::create(['phone' => '09120000002', 'name' => 'نویسنده']);
        $user->assignRole(Role::query()->where('name', 'writer')->firstOrFail());
        Sanctum::actingAs($user);

        $this->getJson('/api/admin/products')->assertForbidden();
    }

    public function test_product_sku_is_generated_when_admin_omits_it(): void
    {
        $user = User::create(['phone' => '09120000003', 'name' => 'مدیر کاتالوگ']);
        $user->assignRole(Role::query()->where('name', 'admin')->firstOrFail());
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/admin/products', [
            'slug' => 'generated-sku-product',
            'gender' => 'unisex',
            'status' => 'draft',
            'is_featured' => false,
            'is_new' => true,
            'sort_order' => 0,
            'name_fa' => 'محصول با شناسه خودکار',
            'name_en' => 'محصول با شناسه خودکار',
            'price_toman' => 100000,
            'price_usd' => 0,
            'stock' => 4,
            'low_stock_threshold' => 1,
        ]);

        $response->assertCreated();
        $this->assertStringStartsWith('PRD-', (string) $response->json('data.sku'));
        $this->assertDatabaseCount('products', 1);
        $this->assertDatabaseCount('product_variants', 1);
        $this->assertDatabaseHas('product_variants', ['is_default' => true]);
    }
}
