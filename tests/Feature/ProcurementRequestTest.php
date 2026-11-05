<?php

use App\Models\Inventory;
use App\Models\InventoryMutation;
use App\Models\Item;
use App\Models\ProcurementReceivingException;
use App\Models\ProcurementReceivingExceptionAudit;
use App\Models\ProcurementRequest;
use App\Models\Product;
use App\Models\ProductSpecification;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\Worksite;
use App\Services\InventoryService;
use Inertia\Testing\AssertableInertia as Assert;

test('a regular user can render the procurement page', function () {
    $user = User::factory()->create(['role' => 'user']);

    $this->actingAs($user)
        ->get(route('procurement.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('procurement/index')
            ->has('requests', 0)
            ->has('worksites')
            ->has('warehouses', 0),
        );
});

test('warehouse managers are available for existing warehouse membership assignment', function () {
    $admin = User::factory()->create(['role' => 'super_admin']);
    $manager = User::factory()->create(['role' => 'warehouse_manager']);
    $warehouse = Warehouse::factory()->create();
    $this->actingAs($admin)->get(route('inventory.index'))->assertInertia(fn (Assert $page) => $page->has('users', 1)->where('users.0.id', $manager->id));
    $this->actingAs($admin)->post(route('admin.warehouses.assign'), ['user_id' => $manager->id, 'warehouse_id' => $warehouse->id])->assertSessionHasNoErrors();
    expect($manager->warehouses()->whereKey($warehouse->id)->exists())->toBeTrue();
});

test('over receiving returns an inline validation error and preserves stock', function () {
    $manager = User::factory()->create(['role' => 'warehouse_manager']);
    $warehouse = Warehouse::factory()->create();
    $manager->warehouses()->attach($warehouse);
    $spb = ProcurementRequest::factory()->create(['status' => 'approved']);
    $item = Item::factory()->create();
    $line = $spb->items()->create(['item_id' => $item->item_id, 'item_name' => $item->item_name, 'requested_quantity' => 2, 'approved_quantity' => 2, 'received_quantity' => 1]);
    $this->actingAs($manager)->post(route('admin.procurement.receive', $spb), ['warehouse_id' => $warehouse->id, 'items' => [['id' => $line->id, 'received_quantity' => 2]]])->assertSessionHasErrors(['items' => 'Received quantity cannot exceed the approved quantity.']);
    expect($line->fresh()->received_quantity)->toBe(1);
    expect(InventoryMutation::count())->toBe(0);
    expect(Inventory::count())->toBe(0);
});

test('a regular user can submit a procurement request without changing stock', function () {
    $user = User::factory()->create(['role' => 'user']);
    $worksite = Worksite::factory()->create();
    $item = Item::factory()->create();

    $response = $this->actingAs($user)->post(route('procurement.store'), [
        'request_date' => '2026-10-27',
        'worksite_id' => $worksite->id,
        'status' => 'pending_approval',
        'items' => [[
            'item_id' => $item->item_id,
            'requested_quantity' => 8,
            'manufacturer_code' => 'MFG-01',
            'measurement_unit' => '  Roll  ',
        ]],
    ]);

    $response->assertRedirect(route('procurement.index'));
    $this->assertDatabaseHas('procurement_requests', [
        'requester_id' => $user->id,
        'worksite_id' => $worksite->id,
        'status' => 'pending_approval',
    ]);

    $this->assertDatabaseHas('procurement_request_items', [
        'item_id' => $item->item_id,
        'requested_quantity' => 8,
        'manufacturer_code' => 'MFG-01',
        'measurement_unit' => 'Roll',
    ]);
    expect(Inventory::count())->toBe(0)
        ->and(InventoryMutation::count())->toBe(0);
});

test('an SPB search returns matching Feature Master products without selecting them', function () {
    $user = User::factory()->create(['role' => 'user']);
    $product = Product::factory()->create(['name' => 'Marine Fuel Filter']);
    $specification = ProductSpecification::factory()->create([
        'product_id' => $product->id,
        'name' => 'OEM',
        'part_number' => 'MFF-001',
        'measurement_unit' => 'Pcs',
    ]);
    $item = Item::factory()->create([
        'item_name' => 'Marine Fuel Filter',
        'product_id' => $product->id,
        'product_specification_id' => $specification->id,
    ]);

    $this->actingAs($user)
        ->getJson(route('procurement.items.search', ['q' => 'fuel']))
        ->assertOk()
        ->assertJsonPath('0.item_id', $item->item_id)
        ->assertJsonPath('0.product.id', $product->id)
        ->assertJsonPath('0.specification.part_number', 'MFF-001');

    expect(ProcurementRequest::count())->toBe(0)
        ->and(Item::count())->toBe(1)
        ->and(Product::count())->toBe(1);
});

test('an SPB search returns an empty result when no Feature Master product matches', function () {
    $user = User::factory()->create(['role' => 'user']);

    $this->actingAs($user)
        ->getJson(route('procurement.items.search', ['q' => 'not-a-product']))
        ->assertOk()
        ->assertExactJson([]);
});

test('an SPB search limits long result lists', function () {
    $user = User::factory()->create(['role' => 'user']);
    Item::factory()->count(21)->create(['item_name' => 'Fuel Filter']);

    $this->actingAs($user)
        ->getJson(route('procurement.items.search', ['q' => 'fuel']))
        ->assertOk()
        ->assertJsonCount(20);
});

test('a procurement request requires a non-blank manual unit for every item', function () {
    $user = User::factory()->create(['role' => 'user']);
    $worksite = Worksite::factory()->create();
    $item = Item::factory()->create();

    $this->actingAs($user)
        ->post(route('procurement.store'), [
            'request_date' => '2026-10-27',
            'worksite_id' => $worksite->id,
            'status' => 'draft',
            'items' => [[
                'item_id' => $item->item_id,
                'requested_quantity' => 1,
                'measurement_unit' => '   ',
            ]],
        ])
        ->assertSessionHasErrors('items.0.measurement_unit');
});

test('a procurement request rejects duplicate Feature Master products across rows for drafts and submissions', function (string $status) {
    $user = User::factory()->create(['role' => 'user']);
    $worksite = Worksite::factory()->create();
    $product = Product::factory()->create();
    $firstItem = Item::factory()->create(['product_id' => $product->id]);
    $secondItem = Item::factory()->create(['product_id' => $product->id]);

    $this->actingAs($user)
        ->post(route('procurement.store'), [
            'request_date' => '2026-10-27',
            'worksite_id' => $worksite->id,
            'status' => $status,
            'items' => [
                [
                    'item_id' => $firstItem->item_id,
                    'requested_quantity' => 1,
                    'measurement_unit' => 'Pcs',
                ],
                [
                    'item_id' => $secondItem->item_id,
                    'requested_quantity' => 1,
                    'measurement_unit' => 'Pcs',
                ],
            ],
        ])
        ->assertSessionHasErrors([
            'items.1.item_id' => 'Produk ini sudah ditambahkan ke SPB.',
        ]);

    expect(ProcurementRequest::count())->toBe(0);
})->with([
    'draft' => 'draft',
    'pending approval' => 'pending_approval',
]);

test('a procurement request saves distinct products from multiple rows', function () {
    $user = User::factory()->create(['role' => 'user']);
    $worksite = Worksite::factory()->create();
    $firstItem = Item::factory()->create();
    $secondItem = Item::factory()->create();

    $this->actingAs($user)
        ->post(route('procurement.store'), [
            'request_date' => '2026-10-27',
            'worksite_id' => $worksite->id,
            'status' => 'draft',
            'items' => [
                [
                    'item_id' => $firstItem->item_id,
                    'requested_quantity' => 1,
                    'measurement_unit' => 'Pcs',
                ],
                [
                    'item_id' => $secondItem->item_id,
                    'requested_quantity' => 2,
                    'measurement_unit' => 'Roll',
                ],
            ],
        ])
        ->assertRedirect(route('procurement.index'));

    $this->assertDatabaseHas('procurement_request_items', [
        'item_id' => $firstItem->item_id,
        'requested_quantity' => 1,
        'measurement_unit' => 'Pcs',
    ]);
    $this->assertDatabaseHas('procurement_request_items', [
        'item_id' => $secondItem->item_id,
        'requested_quantity' => 2,
        'measurement_unit' => 'Roll',
    ]);
});

test('a draft saves the replacement product instead of a previous row selection', function () {
    $user = User::factory()->create(['role' => 'user']);
    $worksite = Worksite::factory()->create();
    $replacementProduct = Product::factory()->create();
    $replacementItem = Item::factory()->create([
        'product_id' => $replacementProduct->id,
    ]);

    $this->actingAs($user)
        ->post(route('procurement.store'), [
            'request_date' => '2026-10-27',
            'worksite_id' => $worksite->id,
            'status' => 'draft',
            'items' => [[
                'item_id' => $replacementItem->item_id,
                'requested_quantity' => 2,
                'measurement_unit' => 'Meter',
            ]],
        ])
        ->assertRedirect(route('procurement.index'));

    $this->assertDatabaseHas('procurement_request_items', [
        'item_id' => $replacementItem->item_id,
        'measurement_unit' => 'Meter',
    ]);
});

test('a regular user cannot approve a procurement request', function () {
    $user = User::factory()->create(['role' => 'user']);
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'pending_approval']);

    $this->actingAs($user)
        ->patch(route('admin.procurement.approve', $procurementRequest), ['decision' => 'rejected'])
        ->assertForbidden();
});

test('an admin approval records the approver without changing stock', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $item = Item::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'pending_approval']);
    $requestItem = $procurementRequest->items()->create([
        'item_id' => $item->item_id,
        'item_name' => $item->item_name,
        'requested_quantity' => 10,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.procurement.approve', $procurementRequest), [
            'decision' => 'approved',
            'remarks' => 'Approved for scheduled maintenance.',
            'items' => [['id' => $requestItem->id, 'approved_quantity' => 7]],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('procurement_requests', [
        'id' => $procurementRequest->id,
        'status' => 'approved',
        'approved_by' => $admin->id,
        'approval_remarks' => 'Approved for scheduled maintenance.',
    ]);
    $this->assertDatabaseHas('procurement_request_items', [
        'id' => $requestItem->id,
        'approved_quantity' => 7,
        'received_quantity' => 0,
    ]);
    expect(Inventory::count())->toBe(0)
        ->and(InventoryMutation::count())->toBe(0);
});

test('assigned approvers advance an SPB sequentially and record history', function () {
    $creator = User::factory()->create(['role' => 'user']);
    $administrator = User::factory()->create(['role' => 'admin']);
    $examiner = User::factory()->create(['role' => 'user']);
    $firstAcknowledger = User::factory()->create(['role' => 'user']);
    $secondAcknowledger = User::factory()->create(['role' => 'user']);
    $procurementRequest = ProcurementRequest::factory()->create([
        'requester_id' => $creator->id,
        'status' => 'submitted',
    ]);
    $item = Item::factory()->create();
    $line = $procurementRequest->items()->create(['item_id' => $item->item_id, 'item_name' => $item->item_name, 'requested_quantity' => 5]);

    $this->actingAs($administrator)
        ->put(route('admin.procurement.approvers', $procurementRequest), [
            'examiner_id' => $examiner->id,
            'acknowledger_one_id' => $firstAcknowledger->id,
            'acknowledger_two_id' => $secondAcknowledger->id,
            'final_approver_id' => $administrator->id,
        ])
        ->assertRedirect();

    $this->actingAs($examiner)
        ->post(route('procurement.approval-action', $procurementRequest), ['action' => 'confirm'])
        ->assertRedirect();
    $this->actingAs($firstAcknowledger)
        ->post(route('procurement.approval-action', $procurementRequest), ['action' => 'confirm'])
        ->assertRedirect();
    $this->actingAs($secondAcknowledger)
        ->post(route('procurement.approval-action', $procurementRequest), ['action' => 'confirm'])
        ->assertRedirect();
    $this->actingAs($administrator)
        ->post(route('procurement.approval-action', $procurementRequest), ['action' => 'confirm', 'items' => [['id' => $line->id, 'approved_quantity' => 4]]])
        ->assertRedirect();

    $this->assertDatabaseHas('procurement_request_items', ['id' => $line->id, 'approved_quantity' => 4]);
    $this->assertDatabaseHas('procurement_requests', ['id' => $procurementRequest->id, 'status' => 'approved']);
    $this->assertDatabaseHas('procurement_request_approval_histories', ['procurement_request_id' => $procurementRequest->id, 'stage' => 'final_approval', 'action' => 'confirm', 'actor_id' => $administrator->id]);
});

test('a regular user cannot assign SPB approvers', function () {
    $user = User::factory()->create(['role' => 'user']);
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'submitted']);

    $this->actingAs($user)
        ->put(route('admin.procurement.approvers', $procurementRequest), [
            'examiner_id' => User::factory()->create()->id,
            'acknowledger_one_id' => User::factory()->create()->id,
            'acknowledger_two_id' => User::factory()->create()->id,
            'final_approver_id' => User::factory()->create(['role' => 'admin'])->id,
        ])
        ->assertForbidden();
});

test('final approval requires explicit valid line quantities', function (array $items) {
    $admin = User::factory()->create(['role' => 'admin']);
    $spb = ProcurementRequest::factory()->create(['status' => 'awaiting_final_approval', 'final_approver_id' => $admin->id]);
    $item = Item::factory()->create();
    $line = $spb->items()->create(['item_id' => $item->item_id, 'item_name' => $item->item_name, 'requested_quantity' => 5]);
    $this->actingAs($admin)->post(route('procurement.approval-action', $spb), ['action' => 'confirm', 'items' => $items])->assertSessionHasErrors();
    expect($spb->fresh()->status)->toBe('awaiting_final_approval');
    expect($line->fresh()->approved_quantity)->toBeNull();
})->with(['missing' => [[]], 'foreign line' => [[['id' => 999999, 'approved_quantity' => 1]]]]);

test('final approval accepts empty optional remarks', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $spb = ProcurementRequest::factory()->create(['status' => 'awaiting_final_approval', 'final_approver_id' => $admin->id]);
    $item = Item::factory()->create();
    $line = $spb->items()->create(['item_id' => $item->item_id, 'item_name' => $item->item_name, 'requested_quantity' => 5]);
    $this->actingAs($admin)->post(route('procurement.approval-action', $spb), ['action' => 'confirm', 'remarks' => '', 'items' => [['id' => $line->id, 'approved_quantity' => 4]]])->assertSessionHasNoErrors();
    $this->assertDatabaseHas('procurement_requests', ['id' => $spb->id, 'status' => 'approved', 'approval_remarks' => null]);
    expect($line->fresh()->approved_quantity)->toBe(4);
});

test('the creator can cancel an SPB before final approval with an audit reason', function (string $status) {
    $creator = User::factory()->create();
    $spb = ProcurementRequest::factory()->create(['requester_id' => $creator->id, 'status' => $status]);
    $this->actingAs($creator)->patch(route('procurement.cancel', $spb), ['remarks' => 'Maintenance schedule changed.'])->assertSessionHasNoErrors();
    $this->assertDatabaseHas('procurement_requests', ['id' => $spb->id, 'status' => 'canceled', 'cancellation_remarks' => 'Maintenance schedule changed.']);
    $this->assertDatabaseHas('procurement_request_approval_histories', ['procurement_request_id' => $spb->id, 'actor_id' => $creator->id, 'action' => 'canceled']);
    expect(InventoryMutation::count())->toBe(0);
})->with(['draft', 'submitted', 'pending_approval', 'awaiting_review', 'awaiting_acknowledgement', 'awaiting_final_approval']);

test('cancellation refuses completed or terminal stages', function (string $status) {
    $admin = User::factory()->create(['role' => 'admin']);
    $spb = ProcurementRequest::factory()->create(['status' => $status]);
    $this->actingAs($admin)->patch(route('procurement.cancel', $spb), ['remarks' => 'Schedule changed.'])->assertSessionHasErrors('status');
    expect($spb->fresh()->status)->toBe($status);
    expect($spb->approvalHistory()->count())->toBe(0);
})->with(['approved', 'received', 'rejected', 'canceled']);

test('cancellation requires a reason and denies unassigned regular users', function () {
    $creator = User::factory()->create();
    $other = User::factory()->create();
    $admin = User::factory()->create(['role' => 'admin']);
    $spb = ProcurementRequest::factory()->create(['requester_id' => $creator->id, 'status' => 'submitted']);
    $this->actingAs($other)->patch(route('procurement.cancel', $spb), ['remarks' => 'Schedule changed.'])->assertForbidden();
    $this->actingAs($creator)->patch(route('procurement.cancel', $spb), ['remarks' => ''])->assertSessionHasErrors('remarks');
    $this->actingAs($admin)->patch(route('procurement.cancel', $spb), ['remarks' => 'Schedule changed.'])->assertSessionHasNoErrors();
    expect($spb->fresh()->status)->toBe('canceled');
});

test('only the assigned final approver can audit missing quantity correction before any receipts', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $other = User::factory()->create(['role' => 'super_admin']);
    $approvedAt = now()->subDay()->startOfSecond();
    $spb = ProcurementRequest::factory()->create(['status' => 'approved', 'final_approver_id' => $admin->id, 'approved_by' => $admin->id, 'approved_at' => $approvedAt]);
    $item = Item::factory()->create();
    $line = $spb->items()->create(['item_id' => $item->item_id, 'item_name' => $item->item_name, 'requested_quantity' => 5]);
    $payload = ['action' => 'confirm', 'remarks' => 'Explicitly confirm missing approved quantities.', 'items' => [['id' => $line->id, 'approved_quantity' => 4]]];
    $this->actingAs($other)->post(route('procurement.approval-action', $spb), $payload)->assertForbidden();
    $this->actingAs($admin)->post(route('procurement.approval-action', $spb), [...$payload, 'remarks' => ''])->assertSessionHasErrors('items');
    $this->actingAs($admin)->post(route('procurement.approval-action', $spb), [...$payload, 'items' => [['id' => $line->id, 'approved_quantity' => 6]]])->assertSessionHasErrors('items');
    $this->actingAs($admin)->post(route('procurement.approval-action', $spb), $payload)->assertSessionHasNoErrors();
    expect($line->fresh()->approved_quantity)->toBe(4);
    expect($spb->fresh()->approved_at->equalTo($approvedAt))->toBeTrue();
    $this->assertDatabaseHas('procurement_request_approval_histories', ['procurement_request_id' => $spb->id, 'actor_id' => $admin->id, 'stage' => 'quantity_correction']);
    expect(InventoryMutation::count())->toBe(0);
    $this->actingAs($admin)->post(route('procurement.approval-action', $spb), $payload)->assertForbidden();
});

test('all assigned SPB approvers can view the request while unrelated users cannot', function () {
    $creator = User::factory()->create(['role' => 'user']);
    $examiner = User::factory()->create(['role' => 'user']);
    $firstAcknowledger = User::factory()->create(['role' => 'user']);
    $secondAcknowledger = User::factory()->create(['role' => 'user']);
    $finalApprover = User::factory()->create(['role' => 'admin']);
    $unrelatedUser = User::factory()->create(['role' => 'user']);
    $procurementRequest = ProcurementRequest::factory()->create([
        'requester_id' => $creator->id,
        'status' => 'awaiting_review',
        'examiner_id' => $examiner->id,
        'acknowledger_one_id' => $firstAcknowledger->id,
        'acknowledger_two_id' => $secondAcknowledger->id,
        'final_approver_id' => $finalApprover->id,
    ]);

    foreach ([$creator, $examiner, $firstAcknowledger, $secondAcknowledger, $finalApprover] as $viewer) {
        $this->actingAs($viewer)
            ->get(route('procurement.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->has('requests', 1)
                ->where('requests.0.id', $procurementRequest->id),
            );
    }

    $this->actingAs($unrelatedUser)
        ->get(route('procurement.index'))
        ->assertInertia(fn (Assert $page) => $page->has('requests', 0));
});

test('an admin can approve and partially receive a procurement request before completing it later', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'pending_approval']);
    $requestItem = $procurementRequest->items()->create([
        'item_id' => $item->item_id,
        'item_name' => $item->item_name,
        'requested_quantity' => 10,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.procurement.approve', $procurementRequest), [
            'decision' => 'approved',
            'items' => [['id' => $requestItem->id, 'approved_quantity' => 10]],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('procurement_requests', [
        'id' => $procurementRequest->id,
        'status' => 'approved',
        'approved_by' => $admin->id,
    ]);

    $exception = ProcurementReceivingException::create([
        'procurement_request_id' => $procurementRequest->id,
        'warehouse_id' => $warehouse->id,
        'requested_by' => $admin->id,
        'authorized_by' => User::factory()->create(['role' => 'super_admin'])->id,
        'authorized_at' => now(),
        'status' => 'approved',
        'reason' => 'Operational exception.',
        'quantities' => [(string) $requestItem->id => 10],
    ]);

    $this->actingAs($admin)
        ->post(route('admin.procurement.receive', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'receiving_exception_id' => $exception->id,
            'items' => [['id' => $requestItem->id, 'received_quantity' => 4]],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('inventories', [
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 4,
    ]);
    $this->assertDatabaseHas('inventory_mutations', [
        'item_id' => $item->item_id,
        'to_warehouse_id' => $warehouse->id,
        'quantity' => 4,
        'type' => 'IN',
        'user_id' => $admin->id,
        'reference_type' => 'ProcurementRequest',
        'reference_id' => $procurementRequest->id,
    ]);
    $this->assertDatabaseHas('procurement_requests', ['id' => $procurementRequest->id, 'status' => 'approved']);

    $this->actingAs($admin)
        ->post(route('admin.procurement.receive', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'receiving_exception_id' => $exception->id,
            'items' => [['id' => $requestItem->id, 'received_quantity' => 6]],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('inventories', [
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 10,
    ]);
    $this->assertDatabaseHas('procurement_requests', ['id' => $procurementRequest->id, 'status' => 'received']);
    expect(InventoryMutation::where('reference_id', $procurementRequest->id)->count())->toBe(2);
});

test('an assigned warehouse manager can partially receive an approved SPB and records inventory mutations', function () {
    $manager = User::factory()->create(['role' => 'warehouse_manager']);
    $warehouse = Warehouse::factory()->create();
    $manager->warehouses()->attach($warehouse);
    $item = Item::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'approved']);
    $requestItem = $procurementRequest->items()->create([
        'item_id' => $item->item_id,
        'item_name' => $item->item_name,
        'requested_quantity' => 5,
        'approved_quantity' => 5,
    ]);

    $this->actingAs($manager)
        ->post(route('admin.procurement.receive', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'items' => [['id' => $requestItem->id, 'received_quantity' => 3]],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('inventories', ['item_id' => $item->item_id, 'warehouse_id' => $warehouse->id, 'quantity' => 3]);
    $this->assertDatabaseHas('inventory_mutations', ['item_id' => $item->item_id, 'to_warehouse_id' => $warehouse->id, 'quantity' => 3, 'user_id' => $manager->id, 'reference_type' => 'ProcurementRequest', 'reference_id' => $procurementRequest->id]);
    $this->assertDatabaseHas('procurement_requests', ['id' => $procurementRequest->id, 'status' => 'approved']);
});

test('a warehouse manager cannot receive into an unassigned warehouse', function () {
    $manager = User::factory()->create(['role' => 'warehouse_manager']);
    $assignedWarehouse = Warehouse::factory()->create();
    $unassignedWarehouse = Warehouse::factory()->create();
    $manager->warehouses()->attach($assignedWarehouse);
    $item = Item::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'approved']);
    $requestItem = $procurementRequest->items()->create(['item_id' => $item->item_id, 'item_name' => $item->item_name, 'requested_quantity' => 1, 'approved_quantity' => 1]);

    $this->actingAs($manager)
        ->post(route('admin.procurement.receive', $procurementRequest), ['warehouse_id' => $unassignedWarehouse->id, 'items' => [['id' => $requestItem->id, 'received_quantity' => 1]]])
        ->assertSessionHasErrors('warehouse_id');

    expect(Inventory::count())->toBe(0)->and(InventoryMutation::count())->toBe(0);
});

test('a regular user cannot receive an SPB', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user)->post(route('admin.procurement.receive', ProcurementRequest::factory()->create(['status' => 'approved'])), [])->assertForbidden();
});

test('an admin cannot receive a procurement request before approval', function (string $status) {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => $status]);
    $requestItem = $procurementRequest->items()->create([
        'item_id' => $item->item_id,
        'item_name' => $item->item_name,
        'requested_quantity' => 1,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.procurement.receive', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'items' => [['id' => $requestItem->id, 'received_quantity' => 1]],
        ])
        ->assertSessionHasErrors([
            'receiving' => 'Only approved procurement requests can be received.',
        ]);

    expect(Inventory::count())->toBe(0)
        ->and(InventoryMutation::count())->toBe(0);
})->with([
    'draft' => 'draft',
    'pending approval' => 'pending_approval',
]);

test('a completed procurement request cannot be received twice', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'approved', 'approved_by' => $admin->id, 'approved_at' => now()]);
    $requestItem = $procurementRequest->items()->create([
        'item_id' => $item->item_id,
        'item_name' => $item->item_name,
        'requested_quantity' => 3,
        'approved_quantity' => 3,
    ]);
    $payload = ['warehouse_id' => $warehouse->id, 'items' => [['id' => $requestItem->id, 'received_quantity' => 3]]];
    $exception = ProcurementReceivingException::create(['procurement_request_id' => $procurementRequest->id, 'warehouse_id' => $warehouse->id, 'requested_by' => $admin->id, 'authorized_by' => User::factory()->create(['role' => 'super_admin'])->id, 'authorized_at' => now(), 'status' => 'approved', 'reason' => 'Operational exception.', 'quantities' => [(string) $requestItem->id => 3]]);
    $payload['receiving_exception_id'] = $exception->id;

    $this->actingAs($admin)->post(route('admin.procurement.receive', $procurementRequest), $payload)->assertRedirect();
    $this->actingAs($admin)
        ->post(route('admin.procurement.receive', $procurementRequest), $payload)
        ->assertSessionHasErrors([
            'receiving' => 'Only approved procurement requests can be received.',
        ]);

    $this->assertDatabaseHas('inventories', ['item_id' => $item->item_id, 'warehouse_id' => $warehouse->id, 'quantity' => 3]);
    expect(InventoryMutation::where('reference_id', $procurementRequest->id)->count())->toBe(1);
});

test('an admin can reject a pending procurement request with remarks', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'pending_approval']);

    $this->actingAs($admin)
        ->patch(route('admin.procurement.approve', $procurementRequest), [
            'decision' => 'rejected',
            'remarks' => 'Budget is not available.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('procurement_requests', [
        'id' => $procurementRequest->id,
        'status' => 'rejected',
        'rejected_by' => $admin->id,
        'rejection_remarks' => 'Budget is not available.',
    ]);
});

test('an Admin can request an exception and a Superadmin can approve it without changing inventory', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'approved']);
    $requestItem = $procurementRequest->items()->create([
        'item_id' => $item->item_id,
        'item_name' => $item->item_name,
        'requested_quantity' => 5,
        'approved_quantity' => 5,
    ]);

    $this->actingAs($admin)
        ->post(route('procurement.receiving-exceptions.store', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'reason' => 'The warehouse manager is unavailable.',
            'items' => [['id' => $requestItem->id, 'received_quantity' => 4]],
        ])
        ->assertRedirect();

    $exception = ProcurementReceivingException::firstOrFail();
    $this->assertDatabaseHas('procurement_receiving_exceptions', [
        'id' => $exception->id,
        'procurement_request_id' => $procurementRequest->id,
        'warehouse_id' => $warehouse->id,
        'requested_by' => $admin->id,
        'status' => 'pending',
    ]);
    $this->assertDatabaseHas('procurement_receiving_exception_audits', [
        'procurement_receiving_exception_id' => $exception->id,
        'event' => 'requested',
        'actor_id' => $admin->id,
    ]);

    $this->actingAs($superAdmin)
        ->patch(route('super-admin.procurement.receiving-exceptions.decide', $exception), [
            'decision' => 'approved',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('procurement_receiving_exceptions', [
        'id' => $exception->id,
        'status' => 'approved',
        'authorized_by' => $superAdmin->id,
    ]);
    $this->assertDatabaseHas('procurement_receiving_exception_audits', [
        'procurement_receiving_exception_id' => $exception->id,
        'event' => 'approved',
        'actor_id' => $superAdmin->id,
    ]);
    expect(Inventory::count())->toBe(0)
        ->and(InventoryMutation::count())->toBe(0);
});

test('only an Admin can request an exception and only a different Superadmin can decide it', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $regularUser = User::factory()->create(['role' => 'user']);
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $warehouse = Warehouse::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'approved']);

    $this->actingAs($regularUser)
        ->post(route('procurement.receiving-exceptions.store', $procurementRequest), [])
        ->assertForbidden();
    $this->actingAs($superAdmin)
        ->post(route('procurement.receiving-exceptions.store', $procurementRequest), [])
        ->assertForbidden();

    $exception = ProcurementReceivingException::create([
        'procurement_request_id' => $procurementRequest->id,
        'warehouse_id' => $warehouse->id,
        'requested_by' => $superAdmin->id,
        'status' => 'pending',
        'reason' => 'Self authorization must be refused.',
        'quantities' => [],
    ]);

    $this->actingAs($regularUser)
        ->patch(route('super-admin.procurement.receiving-exceptions.decide', $exception), ['decision' => 'rejected', 'remarks' => 'Denied.'])
        ->assertForbidden();
    $this->actingAs($admin)
        ->patch(route('super-admin.procurement.receiving-exceptions.decide', $exception), ['decision' => 'rejected', 'remarks' => 'Denied.'])
        ->assertForbidden();
    $this->actingAs($superAdmin)
        ->patch(route('super-admin.procurement.receiving-exceptions.decide', $exception), ['decision' => 'rejected', 'remarks' => 'Denied.'])
        ->assertForbidden();
});

test('an exception request must target approved remaining lines on its SPB', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    $otherItem = Item::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'approved']);
    $requestItem = $procurementRequest->items()->create([
        'item_id' => $item->item_id,
        'item_name' => $item->item_name,
        'requested_quantity' => 2,
        'approved_quantity' => 2,
        'received_quantity' => 1,
    ]);
    $unrelatedItem = ProcurementRequest::factory()->create(['status' => 'approved'])->items()->create([
        'item_id' => $otherItem->item_id,
        'item_name' => $otherItem->item_name,
        'requested_quantity' => 1,
        'approved_quantity' => 1,
    ]);

    $this->actingAs($admin)
        ->post(route('procurement.receiving-exceptions.store', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'reason' => 'Need a controlled exception.',
            'items' => [['id' => $unrelatedItem->id, 'received_quantity' => 1]],
        ])
        ->assertSessionHasErrors('items');
    $this->actingAs($admin)
        ->post(route('procurement.receiving-exceptions.store', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'reason' => 'Need a controlled exception.',
            'items' => [['id' => $requestItem->id, 'received_quantity' => 3]],
        ])
        ->assertSessionHasErrors('items');

    expect(ProcurementReceivingException::count())->toBe(0);
});

test('an exception cannot be requested for an SPB that is not finally approved', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'awaiting_final_approval']);
    $requestItem = $procurementRequest->items()->create(['item_id' => $item->item_id, 'item_name' => $item->item_name, 'requested_quantity' => 1, 'approved_quantity' => 1]);

    $this->actingAs($admin)
        ->post(route('procurement.receiving-exceptions.store', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'reason' => 'Need an exception.',
            'items' => [['id' => $requestItem->id, 'received_quantity' => 1]],
        ])
        ->assertSessionHasErrors('receiving');

    expect(ProcurementReceivingException::count())->toBe(0)
        ->and(Inventory::count())->toBe(0);
});

test('a Superadmin can reject a pending exception and the rejected exception cannot receive goods', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'approved']);
    $requestItem = $procurementRequest->items()->create(['item_id' => $item->item_id, 'item_name' => $item->item_name, 'requested_quantity' => 1, 'approved_quantity' => 1]);
    $exception = ProcurementReceivingException::create([
        'procurement_request_id' => $procurementRequest->id,
        'warehouse_id' => $warehouse->id,
        'requested_by' => $admin->id,
        'status' => 'pending',
        'reason' => 'Request an operational exception.',
        'quantities' => [(string) $requestItem->id => 1],
    ]);

    $this->actingAs($superAdmin)
        ->patch(route('super-admin.procurement.receiving-exceptions.decide', $exception), [
            'decision' => 'rejected',
            'remarks' => 'Warehouse manager coverage is available.',
        ])
        ->assertRedirect();
    $this->actingAs($admin)
        ->post(route('admin.procurement.receive', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'receiving_exception_id' => $exception->id,
            'items' => [['id' => $requestItem->id, 'received_quantity' => 1]],
        ])
        ->assertSessionHasErrors('receiving_exception_id');

    $this->assertDatabaseHas('procurement_receiving_exceptions', ['id' => $exception->id, 'status' => 'rejected', 'authorized_by' => $superAdmin->id]);
    $this->assertDatabaseHas('procurement_receiving_exception_audits', ['procurement_receiving_exception_id' => $exception->id, 'event' => 'rejected', 'actor_id' => $superAdmin->id]);
    expect(Inventory::count())->toBe(0)
        ->and(InventoryMutation::count())->toBe(0);
});

test('an Admin receipt consumes only its approved exception allowance and records an immutable audit event', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'approved']);
    $requestItem = $procurementRequest->items()->create([
        'item_id' => $item->item_id,
        'item_name' => $item->item_name,
        'requested_quantity' => 5,
        'approved_quantity' => 5,
    ]);
    $exception = ProcurementReceivingException::create([
        'procurement_request_id' => $procurementRequest->id,
        'warehouse_id' => $warehouse->id,
        'requested_by' => $admin->id,
        'authorized_by' => $superAdmin->id,
        'authorized_at' => now(),
        'expires_at' => now()->addDay(),
        'status' => 'approved',
        'reason' => 'Manager is unavailable.',
        'quantities' => [(string) $requestItem->id => 4],
    ]);

    $this->actingAs($admin)
        ->post(route('admin.procurement.receive', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'receiving_exception_id' => $exception->id,
            'items' => [['id' => $requestItem->id, 'received_quantity' => 3]],
        ])
        ->assertRedirect();
    $this->actingAs($admin)
        ->post(route('admin.procurement.receive', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'receiving_exception_id' => $exception->id,
            'items' => [['id' => $requestItem->id, 'received_quantity' => 2]],
        ])
        ->assertSessionHasErrors('items');

    $exception->refresh();
    expect($exception->consumed_quantities)->toBe([(string) $requestItem->id => 3]);
    $this->assertDatabaseHas('inventories', ['item_id' => $item->item_id, 'warehouse_id' => $warehouse->id, 'quantity' => 3]);
    expect(InventoryMutation::where('reference_id', $procurementRequest->id)->count())->toBe(1)
        ->and(ProcurementReceivingExceptionAudit::where('procurement_receiving_exception_id', $exception->id)->where('event', 'received')->count())->toBe(1);
});

test('an Admin cannot receive with another Admins, warehouse-mismatched, or expired exception', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $otherAdmin = User::factory()->create(['role' => 'admin']);
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $warehouse = Warehouse::factory()->create();
    $otherWarehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'approved']);
    $requestItem = $procurementRequest->items()->create(['item_id' => $item->item_id, 'item_name' => $item->item_name, 'requested_quantity' => 1, 'approved_quantity' => 1]);
    $exception = ProcurementReceivingException::create([
        'procurement_request_id' => $procurementRequest->id,
        'warehouse_id' => $warehouse->id,
        'requested_by' => $otherAdmin->id,
        'authorized_by' => $superAdmin->id,
        'authorized_at' => now(),
        'status' => 'approved',
        'reason' => 'Other Admin exception.',
        'quantities' => [(string) $requestItem->id => 1],
    ]);

    $this->actingAs($admin)
        ->post(route('admin.procurement.receive', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'receiving_exception_id' => $exception->id,
            'items' => [['id' => $requestItem->id, 'received_quantity' => 1]],
        ])
        ->assertSessionHasErrors('receiving_exception_id');

    $exception->update(['requested_by' => $admin->id]);
    $this->actingAs($admin)
        ->post(route('admin.procurement.receive', $procurementRequest), [
            'warehouse_id' => $otherWarehouse->id,
            'receiving_exception_id' => $exception->id,
            'items' => [['id' => $requestItem->id, 'received_quantity' => 1]],
        ])
        ->assertSessionHasErrors('receiving_exception_id');

    $exception->update(['expires_at' => now()->subSecond()]);
    $this->actingAs($admin)
        ->post(route('admin.procurement.receive', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'receiving_exception_id' => $exception->id,
            'items' => [['id' => $requestItem->id, 'received_quantity' => 1]],
        ])
        ->assertSessionHasErrors('receiving_exception_id');

    $exception->update(['expires_at' => now()->addDay(), 'revoked_at' => now(), 'status' => 'revoked']);
    $this->actingAs($admin)
        ->post(route('admin.procurement.receive', $procurementRequest), [
            'warehouse_id' => $warehouse->id,
            'receiving_exception_id' => $exception->id,
            'items' => [['id' => $requestItem->id, 'received_quantity' => 1]],
        ])
        ->assertSessionHasErrors('receiving_exception_id');

    expect(Inventory::count())->toBe(0)
        ->and(InventoryMutation::count())->toBe(0);
});

test('a failed inventory mutation rolls back Admin exception consumption and its receipt audit', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    $procurementRequest = ProcurementRequest::factory()->create(['status' => 'approved']);
    $requestItem = $procurementRequest->items()->create(['item_id' => $item->item_id, 'item_name' => $item->item_name, 'requested_quantity' => 1, 'approved_quantity' => 1]);
    $exception = ProcurementReceivingException::create([
        'procurement_request_id' => $procurementRequest->id,
        'warehouse_id' => $warehouse->id,
        'requested_by' => $admin->id,
        'authorized_by' => $superAdmin->id,
        'authorized_at' => now(),
        'status' => 'approved',
        'reason' => 'Manager is unavailable.',
        'quantities' => [(string) $requestItem->id => 1],
    ]);
    $this->mock(InventoryService::class, function ($mock): void {
        $mock->shouldReceive('recordMutation')->once()->andThrow(new RuntimeException('Inventory write failed.'));
    });

    $this->withoutExceptionHandling();
    expect(fn () => $this->actingAs($admin)->post(route('admin.procurement.receive', $procurementRequest), [
        'warehouse_id' => $warehouse->id,
        'receiving_exception_id' => $exception->id,
        'items' => [['id' => $requestItem->id, 'received_quantity' => 1]],
    ]))->toThrow(RuntimeException::class);

    $exception->refresh();
    expect($exception->consumed_quantities)->toBeNull()
        ->and(Inventory::count())->toBe(0)
        ->and(InventoryMutation::count())->toBe(0)
        ->and(ProcurementReceivingExceptionAudit::where('procurement_receiving_exception_id', $exception->id)->where('event', 'received')->count())->toBe(0);
});
