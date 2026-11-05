<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('procurement_receiving_overrides', function (Blueprint $table) {
            $table->id();
            $table->uuid('submission_id')->unique();
            $table->foreignId('procurement_request_id')->constrained()->restrictOnDelete();
            $table->foreignId('warehouse_id')->constrained()->restrictOnDelete();
            $table->foreignId('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('event')->default('RECEIVING_OVERRIDE');
            $table->text('reason');
            $table->json('quantities');
            $table->json('mutation_ids');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('procurement_receiving_overrides');
    }
};
