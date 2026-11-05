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
        Schema::create('procurement_receiving_exception_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('procurement_receiving_exception_id')->constrained()->cascadeOnDelete();
            $table->foreignId('procurement_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event');
            $table->text('reason');
            $table->json('quantities');
            $table->string('receiving_reference')->nullable();
            $table->timestamps();

            $table->index(['procurement_receiving_exception_id', 'event']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('procurement_receiving_exception_audits');
    }
};
