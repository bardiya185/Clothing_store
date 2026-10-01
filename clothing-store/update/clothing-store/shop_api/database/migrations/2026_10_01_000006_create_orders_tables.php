<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('address_id')->nullable()->constrained()->nullOnDelete();
            $table->string('number')->unique();
            $table->string('status', 30)->default('pending');
            $table->string('payment_status', 30)->default('unpaid');
            $table->string('payment_reference')->nullable();
            $table->string('currency_code', 3)->default('IRT');
            $table->unsignedBigInteger('subtotal_toman')->default(0);
            $table->decimal('subtotal_usd', 12, 2)->default(0);
            $table->unsignedBigInteger('discount_toman')->default(0);
            $table->decimal('discount_usd', 12, 2)->default(0);
            $table->unsignedBigInteger('shipping_toman')->default(0);
            $table->decimal('shipping_usd', 12, 2)->default(0);
            $table->unsignedBigInteger('total_toman')->default(0);
            $table->decimal('total_usd', 12, 2)->default(0);
            $table->string('customer_name');
            $table->string('customer_phone', 20);
            $table->text('customer_address');
            $table->string('postal_code', 20);
            $table->text('customer_note')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
            $table->foreign('currency_code')->references('code')->on('currencies')->restrictOnDelete();
            $table->index(['user_id', 'status']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->string('sku');
            $table->string('product_name_fa');
            $table->string('product_name_en');
            $table->unsignedInteger('quantity');
            $table->unsignedBigInteger('unit_price_toman');
            $table->decimal('unit_price_usd', 10, 2);
            $table->unsignedBigInteger('total_toman');
            $table->decimal('total_usd', 12, 2);
            $table->json('options')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
