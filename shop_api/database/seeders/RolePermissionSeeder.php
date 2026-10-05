<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Permissions are the stable authorization contract. Roles only group
        // these permissions; controllers and routes never authorize by role name.
        $permissionDefinitions = [
            'dashboard.view' => ['name' => 'مشاهده داشبورد', 'group_name' => 'dashboard'],
            'analytics.view' => ['name' => 'مشاهده تحلیل‌ها', 'group_name' => 'dashboard'],
            'audit.view' => ['name' => 'مشاهده گزارش فعالیت', 'group_name' => 'dashboard'],
            'catalog.view' => ['name' => 'مشاهده ساختار کاتالوگ', 'group_name' => 'catalog'],
            'products.view' => ['name' => 'مشاهده محصولات', 'group_name' => 'catalog'],
            'products.create' => ['name' => 'ایجاد محصول', 'group_name' => 'catalog'],
            'products.update' => ['name' => 'ویرایش محصول', 'group_name' => 'catalog'],
            'products.delete' => ['name' => 'حذف محصول', 'group_name' => 'catalog'],
            'categories.view' => ['name' => 'مشاهده دسته‌بندی‌ها', 'group_name' => 'catalog'],
            'categories.manage' => ['name' => 'مدیریت دسته‌بندی‌ها', 'group_name' => 'catalog'],
            'brands.view' => ['name' => 'مشاهده برندها', 'group_name' => 'catalog'],
            'brands.manage' => ['name' => 'مدیریت برندها', 'group_name' => 'catalog'],
            'collections.view' => ['name' => 'مشاهده کالکشن‌ها', 'group_name' => 'catalog'],
            'collections.manage' => ['name' => 'مدیریت کالکشن‌ها', 'group_name' => 'catalog'],
            'inventory.view' => ['name' => 'مشاهده موجودی', 'group_name' => 'inventory'],
            'inventory.adjust' => ['name' => 'تنظیم موجودی', 'group_name' => 'inventory'],
            'orders.view' => ['name' => 'مشاهده سفارش‌ها', 'group_name' => 'orders'],
            'orders.update' => ['name' => 'ویرایش سفارش‌ها', 'group_name' => 'orders'],
            'fulfillment.view' => ['name' => 'مشاهده ارسال', 'group_name' => 'orders'],
            'fulfillment.update' => ['name' => 'ویرایش ارسال', 'group_name' => 'orders'],
            'customers.view' => ['name' => 'مشاهده مشتری‌ها', 'group_name' => 'customers'],
            'reviews.view' => ['name' => 'مشاهده نظرات', 'group_name' => 'content'],
            'reviews.moderate' => ['name' => 'مدیریت نظرات', 'group_name' => 'content'],
            'reviews.delete' => ['name' => 'حذف نظرات', 'group_name' => 'content'],
            'marketing.view' => ['name' => 'مشاهده بازاریابی', 'group_name' => 'marketing'],
            'campaigns.view' => ['name' => 'مشاهده کمپین‌ها', 'group_name' => 'marketing'],
            'campaigns.create' => ['name' => 'ایجاد کمپین', 'group_name' => 'marketing'],
            'campaigns.update' => ['name' => 'ویرایش کمپین', 'group_name' => 'marketing'],
            'campaigns.delete' => ['name' => 'حذف کمپین', 'group_name' => 'marketing'],
            'discounts.view' => ['name' => 'مشاهده تخفیف‌ها', 'group_name' => 'marketing'],
            'discounts.create' => ['name' => 'ایجاد کد تخفیف', 'group_name' => 'marketing'],
            'discounts.update' => ['name' => 'ویرایش کد تخفیف', 'group_name' => 'marketing'],
            'discounts.delete' => ['name' => 'حذف کد تخفیف', 'group_name' => 'marketing'],
            'banners.view' => ['name' => 'مشاهده بنرها', 'group_name' => 'marketing'],
            'banners.create' => ['name' => 'ایجاد بنر', 'group_name' => 'marketing'],
            'banners.update' => ['name' => 'ویرایش بنر', 'group_name' => 'marketing'],
            'banners.delete' => ['name' => 'حذف بنر', 'group_name' => 'marketing'],
            'homepage.view' => ['name' => 'مشاهده سازنده صفحه اصلی', 'group_name' => 'marketing'],
            'homepage.create' => ['name' => 'ایجاد بخش صفحه اصلی', 'group_name' => 'marketing'],
            'homepage.update' => ['name' => 'ویرایش بخش صفحه اصلی', 'group_name' => 'marketing'],
            'homepage.delete' => ['name' => 'حذف بخش صفحه اصلی', 'group_name' => 'marketing'],
            'users.manage' => ['name' => 'مدیریت دسترسی کاربران', 'group_name' => 'settings'],
            'roles.view' => ['name' => 'مشاهده نقش‌ها', 'group_name' => 'settings'],
            'roles.manage' => ['name' => 'مدیریت نقش‌ها و دسترسی‌ها', 'group_name' => 'settings'],
        ];

        foreach ($permissionDefinitions as $slug => $definition) {
            Permission::updateOrCreate(
                ['name' => $slug, 'guard_name' => 'web'],
                ['name' => $slug, 'group_name' => $definition['group_name'], 'guard_name' => 'web']
            );
        }

        $all = array_keys($permissionDefinitions);
        $roleMap = [
            'super_admin' => ['label' => 'مدیر ارشد', 'permissions' => $all],
            'store_manager' => ['label' => 'مدیر فروشگاه', 'permissions' => array_values(array_diff($all, ['roles.manage']))],
            'product_manager' => ['label' => 'مدیر محصولات', 'permissions' => ['dashboard.view', 'catalog.view', 'products.view', 'products.create', 'products.update', 'products.delete', 'categories.view', 'categories.manage', 'brands.view', 'brands.manage', 'collections.view', 'collections.manage', 'inventory.view']],
            'inventory_manager' => ['label' => 'مدیر موجودی', 'permissions' => ['dashboard.view', 'products.view', 'inventory.view', 'inventory.adjust', 'orders.view', 'fulfillment.view']],
            'order_manager' => ['label' => 'مدیر سفارش‌ها', 'permissions' => ['dashboard.view', 'orders.view', 'orders.update', 'fulfillment.view', 'fulfillment.update', 'customers.view', 'inventory.view']],
            'marketing_manager' => ['label' => 'مدیر بازاریابی', 'permissions' => ['dashboard.view', 'marketing.view', 'campaigns.view', 'campaigns.create', 'campaigns.update', 'campaigns.delete', 'discounts.view', 'discounts.create', 'discounts.update', 'discounts.delete', 'banners.view', 'banners.create', 'banners.update', 'banners.delete', 'homepage.view', 'homepage.create', 'homepage.update', 'homepage.delete']],
            'customer_support' => ['label' => 'پشتیبانی مشتری', 'permissions' => ['dashboard.view', 'orders.view', 'customers.view', 'reviews.view']],
            // Legacy slugs stay available for existing assignments, but are still
            // permission collections rather than special cases in application code.
            'admin' => ['label' => 'مدیر سامانه', 'permissions' => $all],
            'manager' => ['label' => 'مدیر فروشگاه', 'permissions' => array_values(array_diff($all, ['roles.manage']))],
            'inventory' => ['label' => 'مدیر موجودی', 'permissions' => ['dashboard.view', 'products.view', 'inventory.view', 'inventory.adjust', 'orders.view', 'fulfillment.view']],
            'writer' => ['label' => 'نویسنده محتوا', 'permissions' => ['dashboard.view', 'reviews.view', 'reviews.moderate']],
            'visual_editor' => ['label' => 'ویرایشگر محتوای تصویری', 'permissions' => ['dashboard.view', 'products.view', 'products.update']],
            'content_moderator' => ['label' => 'ناظر محتوا', 'permissions' => ['dashboard.view', 'reviews.view', 'reviews.moderate']],
        ];

        foreach ($roleMap as $slug => $definition) {
            $role = Role::updateOrCreate(
                ['name' => $slug, 'guard_name' => 'web'],
                ['name' => $slug, 'label' => $definition['label'], 'guard_name' => 'web', 'is_active' => true]
            );
            $role->syncPermissions($definition['permissions']);
        }

        // Migrate users created by the old role-column flow into permission
        // collections. This keeps existing admin accounts working without a
        // role-name bypass in User::hasPermission().
        User::query()->where('role', 'admin')->get()->each(fn (User $user) => $user->syncRoles(['super_admin']));
        User::query()->where('role', 'manager')->get()->each(fn (User $user) => $user->syncRoles(['store_manager']));
    }
}
