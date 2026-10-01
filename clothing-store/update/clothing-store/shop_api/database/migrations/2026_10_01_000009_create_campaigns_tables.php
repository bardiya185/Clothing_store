<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name_fa');
            $table->string('name_en');
            $table->text('description_fa')->nullable();
            $table->text('description_en')->nullable();
            $table->unsignedTinyInteger('discount_percent')->default(0);
            $table->string('accent_color', 9)->default('#e65d2f');
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['is_active', 'starts_at', 'ends_at']);
        });

        Schema::create('campaign_product', function (Blueprint $table) {
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('discount_percent')->nullable();
            $table->primary(['campaign_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_product');
        Schema::dropIfExists('campaigns');
    }
};
