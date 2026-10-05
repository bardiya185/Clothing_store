<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaign_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event_type', 30);
            $table->string('variant', 80)->nullable();
            $table->string('session_id', 100)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['campaign_id', 'event_type', 'created_at']);
            $table->index(['campaign_id', 'variant']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_events');
    }
};
