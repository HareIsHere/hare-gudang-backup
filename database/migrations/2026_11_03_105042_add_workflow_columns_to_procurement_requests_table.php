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
        foreach (['examiner_id', 'acknowledger_one_id', 'acknowledger_two_id', 'final_approver_id'] as $column) {
            if (! Schema::hasColumn('procurement_requests', $column)) {
                Schema::table('procurement_requests', function (Blueprint $table) use ($column): void {
                    $table->foreignId($column)->nullable();
                });
            }
            if (! collect(Schema::getForeignKeys('procurement_requests'))->contains(fn (array $key): bool => $key['columns'] === [$column])) {
                Schema::table('procurement_requests', function (Blueprint $table) use ($column): void {
                    $table->foreign($column)->references('id')->on('users')->nullOnDelete();
                });
            }
        }

        if (! Schema::hasTable('procurement_request_approval_histories')) {
            Schema::create('procurement_request_approval_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('procurement_request_id');
                $table->foreignId('actor_id')->nullable();
                $table->string('stage');
                $table->string('action');
                $table->text('remarks')->nullable();
                $table->timestamps();
            });
        }
        foreach (['procurement_request_id' => ['procurement_requests', 'spb_history_request_fk'], 'actor_id' => ['users', 'spb_history_actor_fk']] as $column => [$references, $name]) {
            if (! collect(Schema::getForeignKeys('procurement_request_approval_histories'))->contains(fn (array $key): bool => $key['columns'] === [$column])) {
                Schema::table('procurement_request_approval_histories', function (Blueprint $table) use ($column, $references, $name): void {
                    $foreign = $table->foreign($column, $name)->references('id')->on($references);
                    $column === 'actor_id' ? $foreign->nullOnDelete() : $foreign->cascadeOnDelete();
                });
            }
        }

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
