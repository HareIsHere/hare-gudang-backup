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
        Schema::create('procurement_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number')->unique();
            $table->date('request_date');
            $table->foreignId('worksite_id')->nullable()->constrained('worksites')->nullOnDelete();
            $table->foreignId('requester_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('draft')->index();
            $table->text('description')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_remarks')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_remarks')->nullable();
            $table->timestamp('canceled_at')->nullable();
            $table->text('cancellation_remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('procurement_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('procurement_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->nullable()->constrained('items', 'item_id')->nullOnDelete();
            $table->string('item_name');
            $table->string('item_code')->nullable();
            $table->string('part_number')->nullable();
            $table->string('manufacturer_code')->nullable();
            $table->string('measurement_unit')->nullable();
            $table->unsignedInteger('current_stock')->default(0);
            $table->unsignedInteger('requested_quantity');
            $table->unsignedInteger('approved_quantity')->nullable();
            $table->unsignedInteger('received_quantity')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('procurement_request_items');
        Schema::dropIfExists('procurement_requests');
    }
};
