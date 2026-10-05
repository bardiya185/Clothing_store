<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('placement', 80);
            $table->string('title_fa')->nullable();
            $table->string('title_en')->nullable();
            $table->text('subtitle_fa')->nullable();
            $table->text('subtitle_en')->nullable();
            $table->string('image')->nullable();
            $table->string('mobile_image')->nullable();
            $table->string('href')->nullable();
            $table->string('cta_fa', 80)->nullable();
            $table->string('cta_en', 80)->nullable();
            $table->string('accent_color', 20)->default('#e65d2f');
            $table->string('text_color', 20)->default('#ffffff');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['placement', 'is_active', 'sort_order']);
            $table->index(['starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
