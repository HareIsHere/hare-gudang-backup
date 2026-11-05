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
            $table->foreignId('procurement_receiving_exception_id')->constrained(indexName: 'spb_exception_audit_exception_fk')->cascadeOnDelete();
            $table->foreignId('procurement_request_id')->constrained(indexName: 'spb_exception_audit_request_fk')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained(indexName: 'spb_exception_audit_warehouse_fk')->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users', indexName: 'spb_exception_audit_actor_fk')->nullOnDelete();
            $table->string('event');
            $table->text('reason');
            $table->json('quantities');
            $table->string('receiving_reference')->nullable();
            $table->timestamps();

            $table->index(['procurement_receiving_exception_id', 'event'], 'spb_exception_audit_event_idx');
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
