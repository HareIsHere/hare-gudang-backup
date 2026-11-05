<?php

use App\Models\Inventory;
use App\Models\InventoryMutation;
use App\Models\Item;
use App\Models\ProcurementReceivingOverride;
use App\Models\ProcurementRequest;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\InventoryService;
use Illuminate\Support\Str;

function overrideReceiptFixture(): array
{
    $user = User::factory()->create(['role' => 'super_admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    $spb = ProcurementRequest::factory()->create(['status' => 'approved']);
    $line = $spb->items()->create(['item_id' => $item->item_id, 'item_name' => $item->item_name, 'requested_quantity' => 10, 'approved_quantity' => 10]);
    $payload = ['warehouse_id' => $warehouse->id, 'items' => [['id' => $line->id, 'received_quantity' => 3]], 'reason' => 'Emergency warehouse receiving coverage.', 'confirmed' => true, 'submission_id' => (string) Str::uuid()];

    return [$user, $warehouse, $item, $spb, $line, $payload];
}

test('a Superadmin override records stock, mutations and immutable audit and refuses retries', function () {
    [$user, $warehouse, $item, $spb, $line, $payload] = overrideReceiptFixture();
    $this->actingAs($user)->post(route('super-admin.procurement.receiving-override', $spb), $payload)->assertRedirect()->assertSessionHasNoErrors();
    $audit = ProcurementReceivingOverride::firstOrFail();
    expect($audit->event)->toBe('RECEIVING_OVERRIDE');
    expect($audit->actor_id)->toBe($user->id);
    expect($audit->warehouse_id)->toBe($warehouse->id);
    expect($audit->quantities)->toBe([(string) $line->id => 3]);
    expect($audit->mutation_ids)->toBe([InventoryMutation::firstOrFail()->id]);
    $this->assertDatabaseHas('inventories', ['item_id' => $item->item_id, 'warehouse_id' => $warehouse->id, 'quantity' => 3]);
    $this->actingAs($user)->post(route('super-admin.procurement.receiving-override', $spb), $payload)->assertSessionHasErrors('submission_id');
    expect(InventoryMutation::count())->toBe(1);
    expect(fn () => $audit->update(['reason' => 'Changed reason']))->toThrow(LogicException::class);
    expect(fn () => $audit->delete())->toThrow(LogicException::class);
});

test('only Superadmin can invoke overrides', function (string $role) {
    $spb = ProcurementRequest::factory()->create();
    $this->actingAs(User::factory()->create(['role' => $role]))->post(route('super-admin.procurement.receiving-override', $spb), [])->assertForbidden();
})->with(['admin', 'warehouse_manager', 'user']);

test('override requires a meaningful reason, explicit confirmation and submission identifier', function () {
    [$user, , , $spb, , $payload] = overrideReceiptFixture();
    $payload['reason'] = '          ';
    $payload['confirmed'] = false;
    unset($payload['submission_id']);
    $this->actingAs($user)->post(route('super-admin.procurement.receiving-override', $spb), $payload)->assertSessionHasErrors(['reason', 'confirmed', 'submission_id']);
    expect(Inventory::count())->toBe(0);
});

test('override refuses an unapproved SPB', function () {
    [$user, , , $spb, , $payload] = overrideReceiptFixture();
    $spb->update(['status' => 'awaiting_final_approval']);
    $this->actingAs($user)->post(route('super-admin.procurement.receiving-override', $spb), $payload)->assertSessionHasErrors('receiving');
    expect(InventoryMutation::count())->toBe(0);
});

test('override refuses quantities beyond the remaining approved line', function () {
    [$user, , , $spb, $line, $payload] = overrideReceiptFixture();
    $line->update(['received_quantity' => 8]);
    $this->actingAs($user)->postJson(route('super-admin.procurement.receiving-override', $spb), $payload)->assertUnprocessable();
    expect(Inventory::count())->toBe(0);
    expect(ProcurementReceivingOverride::count())->toBe(0);
});

test('override validates warehouse and SPB line ownership', function () {
    [$user, , , $spb, , $payload] = overrideReceiptFixture();
    $payload['warehouse_id'] = 999999;
    $this->actingAs($user)->post(route('super-admin.procurement.receiving-override', $spb), $payload)->assertSessionHasErrors('warehouse_id');
    $payload['warehouse_id'] = Warehouse::factory()->create()->id;
    $payload['items'][0]['id'] = 999999;
    $this->actingAs($user)->postJson(route('super-admin.procurement.receiving-override', $spb), $payload)->assertUnprocessable();
    expect(InventoryMutation::count())->toBe(0);
});

test('distinct override submissions cannot exceed the remaining quantity', function () {
    [$user, $warehouse, $item, $spb, , $payload] = overrideReceiptFixture();
    $payload['items'][0]['received_quantity'] = 6;
    $this->actingAs($user)->post(route('super-admin.procurement.receiving-override', $spb), $payload)->assertSessionHasNoErrors();
    $payload['submission_id'] = (string) Str::uuid();
    $this->actingAs($user)->postJson(route('super-admin.procurement.receiving-override', $spb), $payload)->assertUnprocessable();
    $this->assertDatabaseHas('inventories', ['item_id' => $item->item_id, 'warehouse_id' => $warehouse->id, 'quantity' => 6]);
    expect(InventoryMutation::count())->toBe(1);
});

test('inventory failure rolls back the entire override', function () {
    [$user, , , $spb, $line, $payload] = overrideReceiptFixture();
    $this->mock(InventoryService::class, function ($mock): void {
        $mock->shouldReceive('recordMutation')->once()->andThrow(new RuntimeException('Inventory failure.'));
    });
    $this->withoutExceptionHandling();
    expect(fn () => $this->actingAs($user)->post(route('super-admin.procurement.receiving-override', $spb), $payload))->toThrow(RuntimeException::class);
    expect($line->fresh()->received_quantity)->toBe(0);
    expect(InventoryMutation::count())->toBe(0);
    expect(ProcurementReceivingOverride::count())->toBe(0);
});

test('override audit failure rolls back inventory, mutation and line receipt', function () {
    [$user, , , $spb, $line, $payload] = overrideReceiptFixture();
    ProcurementReceivingOverride::creating(function (): never {
        throw new RuntimeException('Audit write failed.');
    });
    $this->withoutExceptionHandling();
    try {
        expect(fn () => $this->actingAs($user)->post(route('super-admin.procurement.receiving-override', $spb), $payload))->toThrow(RuntimeException::class);
    } finally {
        ProcurementReceivingOverride::flushEventListeners();
        ProcurementReceivingOverride::clearBootedModels();
    }
    expect($line->fresh()->received_quantity)->toBe(0);
    expect(Inventory::count())->toBe(0);
    expect(InventoryMutation::count())->toBe(0);
    expect(ProcurementReceivingOverride::count())->toBe(0);
});
