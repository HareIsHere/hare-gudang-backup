<?php

use App\Models\ProcurementRequest;
use Illuminate\Database\MySqlConnection;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

test('the workflow migration resumes after a partially created history table without losing data', function () {
    $spb = ProcurementRequest::factory()->create(['status' => 'approved']);
    $historyId = DB::table('procurement_request_approval_histories')->insertGetId([
        'procurement_request_id' => $spb->id,
        'stage' => 'final_approval',
        'action' => 'confirm',
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    Schema::table('procurement_request_approval_histories', function (Blueprint $table): void {
        $table->dropForeign(['procurement_request_id']);
        $table->dropForeign(['actor_id']);
    });

    $migration = require database_path('migrations/2026_11_03_105042_add_workflow_columns_to_procurement_requests_table.php');
    $migration->up();
    $migration->up();

    expect(Schema::getForeignKeys('procurement_request_approval_histories'))->toHaveCount(2);
    $this->assertDatabaseHas('procurement_request_approval_histories', ['id' => $historyId, 'procurement_request_id' => $spb->id]);
    expect($spb->fresh()->status)->toBe('approved');
    foreach (['examiner_id', 'acknowledger_one_id', 'acknowledger_two_id', 'final_approver_id'] as $column) {
        expect(Schema::hasColumn('procurement_requests', $column))->toBeTrue();
    }
});

test('procurement audit migration generates MySQL identifiers within its 64 character limit', function () {
    $originalSchema = Schema::getFacadeRoot();
    $mysql = new MySqlConnection(DB::connection()->getPdo(), 'migration_test', '', ['driver' => 'mysql', 'version' => '8.0.36']);
    $mysql->useDefaultSchemaGrammar();
    Schema::swap($mysql->getSchemaBuilder());
    try {
        $queries = $mysql->pretend(function (): void {
            $migration = require database_path('migrations/2026_11_03_124611_create_procurement_receiving_exception_audits_table.php');
            $migration->up();
        });
    } finally {
        Schema::swap($originalSchema);
    }

    $sql = implode("\n", array_column($queries, 'query'));
    preg_match_all('/(?:constraint|index) `([^`]+)`/i', $sql, $identifiers);
    expect($identifiers[1])->toHaveCount(5);
    foreach ($identifiers[1] as $identifier) {
        expect(strlen($identifier))->toBeLessThanOrEqual(64);
    }
    expect($sql)->toContain('spb_exception_audit_exception_fk')
        ->toContain('spb_exception_audit_event_idx');
});
