<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('procurement_requests', function (Blueprint $table) {
            $table->foreignId('examiner_id')->nullable()->after('requester_id')->constrained('users')->nullOnDelete();
            $table->foreignId('acknowledger_one_id')->nullable()->after('examiner_id')->constrained('users')->nullOnDelete();
            $table->foreignId('acknowledger_two_id')->nullable()->after('acknowledger_one_id')->constrained('users')->nullOnDelete();
            $table->foreignId('final_approver_id')->nullable()->after('acknowledger_two_id')->constrained('users')->nullOnDelete();
        });

        Schema::create('procurement_request_approval_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('procurement_request_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('stage');
            $table->string('action');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        DB::table('procurement_requests')->where('status', 'pending_approval')->update(['status' => 'awaiting_final_approval']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('procurement_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('examiner_id');
            $table->dropConstrainedForeignId('acknowledger_one_id');
            $table->dropConstrainedForeignId('acknowledger_two_id');
            $table->dropConstrainedForeignId('final_approver_id');
        });
        Schema::dropIfExists('procurement_request_approval_histories');
    }
};
