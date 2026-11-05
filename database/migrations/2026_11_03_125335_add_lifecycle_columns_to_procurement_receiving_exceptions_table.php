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
        Schema::table('procurement_receiving_exceptions', function (Blueprint $table) {
            $table->text('decision_remarks')->nullable()->after('reason');
            $table->timestamp('expires_at')->nullable()->after('authorized_at');
            $table->foreignId('revoked_by')->nullable()->after('authorized_by')->constrained('users')->nullOnDelete();
            $table->timestamp('revoked_at')->nullable()->after('expires_at');
            $table->text('revocation_reason')->nullable()->after('revoked_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('procurement_receiving_exceptions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('revoked_by');
            $table->dropColumn(['decision_remarks', 'expires_at', 'revoked_at', 'revocation_reason']);
        });
    }
};
