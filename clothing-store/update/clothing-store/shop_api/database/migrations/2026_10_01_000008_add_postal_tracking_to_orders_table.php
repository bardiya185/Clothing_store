<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('postal_status', 30)->default('not_registered')->after('payment_reference');
            $table->string('postal_tracking_code')->nullable()->after('postal_status');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['postal_status', 'postal_tracking_code']);
        });
    }
};
