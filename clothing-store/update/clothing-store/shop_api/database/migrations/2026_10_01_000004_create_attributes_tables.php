<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attributes', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('type', 20)->default('select');
            $table->boolean('is_filterable')->default(true);
            $table->boolean('is_required')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('attribute_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_id')->constrained()->cascadeOnDelete();
            $table->string('locale_code', 5);
            $table->string('name');
            $table->unique(['attribute_id', 'locale_code']);
            $table->foreign('locale_code')->references('code')->on('locales')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_id')->constrained()->cascadeOnDelete();
            $table->string('slug');
            $table->string('color_hex', 7)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->unique(['attribute_id', 'slug']);
            $table->timestamps();
        });

        Schema::create('attribute_value_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_value_id')->constrained()->cascadeOnDelete();
            $table->string('locale_code', 5);
            $table->string('name');
            // Keep the MySQL index name under the 64-character limit.
            $table->unique(['attribute_value_id', 'locale_code'], 'avt_value_locale_unique');
            $table->foreign('locale_code')->references('code')->on('locales')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('product_variant_attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('attribute_value_id')->constrained()->cascadeOnDelete();
            $table->unique(['variant_id', 'attribute_value_id'], 'pva_variant_value_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variant_attribute_values');
        Schema::dropIfExists('attribute_value_translations');
        Schema::dropIfExists('attribute_values');
        Schema::dropIfExists('attribute_translations');
        Schema::dropIfExists('attributes');
    }
};
