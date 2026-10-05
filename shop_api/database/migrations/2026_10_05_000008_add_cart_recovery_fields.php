<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->timestamp('recovery_reminded_at')->nullable()->after('discount_code');
            $table->timestamp('recovered_at')->nullable()->after('recovery_reminded_at');
            $table->uuid('recovery_token')->nullable()->unique()->after('recovered_at');
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropUnique(['recovery_token']);
            $table->dropColumn(['recovery_reminded_at', 'recovered_at', 'recovery_token']);
        });
    }
};
