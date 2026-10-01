<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('slug')->unique();
            $table->string('sku')->unique();
            $table->string('gender', 20)->default('unisex');
            $table->string('status', 20)->default('published');
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_new')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedInteger('views_count')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'is_featured']);
            $table->index(['gender', 'status']);
        });

        Schema::create('product_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('locale_code', 5);
            $table->string('name');
            $table->string('short_description')->nullable();
            $table->longText('description')->nullable();
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();
            $table->unique(['product_id', 'locale_code']);
            $table->foreign('locale_code')->references('code')->on('locales')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('sku')->unique();
            $table->unsignedBigInteger('price_toman');
            $table->decimal('price_usd', 10, 2);
            $table->unsignedBigInteger('compare_at_toman')->nullable();
            $table->decimal('compare_at_usd', 10, 2)->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('low_stock_threshold')->default(3);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['product_id', 'is_active']);
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->string('path');
            $table->string('alt_text')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('product_image_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_image_id')->constrained()->cascadeOnDelete();
            $table->string('locale_code', 5);
            $table->string('alt_text')->nullable();
            $table->unique(['product_image_id', 'locale_code']);
            $table->foreign('locale_code')->references('code')->on('locales')->restrictOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_image_translations');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('product_translations');
        Schema::dropIfExists('products');
    }
};
