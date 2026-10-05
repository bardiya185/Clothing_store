<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $roleMap = [
            'super_admin' => 'super_admin',
            'admin' => 'super_admin',
            'manager' => 'store_manager',
            'inventory' => 'inventory_manager',
            'writer' => 'customer_support',
            'visual_editor' => 'product_manager',
            'content_moderator' => 'customer_support',
        ];

        foreach ($roleMap as $legacyRole => $roleName) {
            $roleId = DB::table('roles')
                ->where('name', $roleName)
                ->where('guard_name', 'web')
                ->where('is_active', true)
                ->value('id');

            if (!$roleId) {
                continue;
            }

            $users = DB::table('users')->where('role', $legacyRole)->pluck('id');
            foreach ($users as $userId) {
                DB::table('model_has_roles')->updateOrInsert(
                    [
                        'role_id' => $roleId,
                        'model_type' => 'App\\Models\\User',
                        'model_id' => $userId,
                    ],
                    [],
                );
            }
        }
    }

    public function down(): void
    {
        // Role assignments are retained so a rollback cannot accidentally
        // remove access that was explicitly granted after this migration.
    }
};
