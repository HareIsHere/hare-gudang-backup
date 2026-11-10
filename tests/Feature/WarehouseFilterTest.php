<?php

use App\Models\Inventory;
use App\Models\InventoryMutation;
use App\Models\InventoryRequest;
use App\Models\Item;
use App\Models\ProcurementRequest;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\Worksite;
use Inertia\Testing\AssertableInertia as Assert;

test('inventory warehouse filter limits rows and stock quantities and can be cleared', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $firstWarehouse = Warehouse::factory()->create();
    $secondWarehouse = Warehouse::factory()->create();
    $hiddenWarehouse = Warehouse::factory()->create();
    $admin->warehouses()->attach([$firstWarehouse->id, $secondWarehouse->id]);
    $sharedItem = Item::factory()->create();
    $secondItem = Item::factory()->create();
    Inventory::factory()->create(['item_id' => $sharedItem->item_id, 'warehouse_id' => $firstWarehouse->id, 'quantity' => 5]);
    Inventory::factory()->create(['item_id' => $sharedItem->item_id, 'warehouse_id' => $secondWarehouse->id, 'quantity' => 9]);
    Inventory::factory()->create(['item_id' => $sharedItem->item_id, 'warehouse_id' => $hiddenWarehouse->id, 'quantity' => 77]);
    Inventory::factory()->create(['item_id' => $secondItem->item_id, 'warehouse_id' => $secondWarehouse->id, 'quantity' => 0]);

    $this->actingAs($admin)->get(route('inventory.index', ['warehouse_id' => $firstWarehouse->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('filters.warehouse_id', $firstWarehouse->id)
            ->has('warehouses', 2)->has('items', 1)
            ->where('items.0.item_id', $sharedItem->item_id)
            ->has('items.0.inventories', 1)
            ->where('items.0.inventories.0.quantity', 5));

    $this->get(route('inventory.index'))->assertInertia(fn (Assert $page) => $page
        ->where('filters.warehouse_id', null)->has('items', 2)
        ->has('items.0.inventories', 2));
});

test('superadmin can filter inventory without warehouse membership', function () {
    $superadmin = User::factory()->create(['role' => 'super_admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    Item::factory()->create();
    Inventory::factory()->create(['item_id' => $item->item_id, 'warehouse_id' => $warehouse->id, 'quantity' => 3]);

    $this->actingAs($superadmin)->get(route('inventory.index', ['warehouse_id' => $warehouse->id]))
        ->assertInertia(fn (Assert $page) => $page->has('items', 1)->where('items.0.item_id', $item->item_id)->where('items.0.inventories.0.quantity', 3));
    $this->get(route('inventory.index'))->assertInertia(fn (Assert $page) => $page->has('items', 2));
});

test('my requests warehouse filter preserves request ownership and form warehouses', function () {
    $user = User::factory()->create(['role' => 'user']);
    $firstWarehouse = Warehouse::factory()->create();
    $secondWarehouse = Warehouse::factory()->create();
    $user->warehouses()->attach([$firstWarehouse->id, $secondWarehouse->id]);
    $request = InventoryRequest::factory()->create(['user_id' => $user->id, 'warehouse_id' => $firstWarehouse->id]);
    InventoryRequest::factory()->create(['user_id' => $user->id, 'warehouse_id' => $secondWarehouse->id]);
    InventoryRequest::factory()->create(['warehouse_id' => $firstWarehouse->id]);

    $this->actingAs($user)->get(route('requests.index', ['warehouse_id' => $firstWarehouse->id]))
        ->assertInertia(fn (Assert $page) => $page->has('requests', 1)->where('requests.0.id', $request->id)->has('warehouses', 2)->where('filters.warehouse_id', $firstWarehouse->id));
    $this->get(route('requests.index'))->assertInertia(fn (Assert $page) => $page->has('requests', 2));
});

test('manage requests can filter any warehouse for superadmin including empty warehouses', function () {
    $superadmin = User::factory()->create(['role' => 'super_admin']);
    $warehouse = Warehouse::factory()->create();
    $otherWarehouse = Warehouse::factory()->create();
    $emptyWarehouse = Warehouse::factory()->create();
    $request = InventoryRequest::factory()->create(['warehouse_id' => $warehouse->id]);
    InventoryRequest::factory()->create(['warehouse_id' => $otherWarehouse->id]);

    $this->actingAs($superadmin)->get(route('admin.requests.index', ['warehouse_id' => $warehouse->id]))
        ->assertInertia(fn (Assert $page) => $page->has('requests', 1)->where('requests.0.id', $request->id)->has('warehouses', 3)->where('filters.warehouse_id', $warehouse->id));
    $this->get(route('admin.requests.index', ['warehouse_id' => $emptyWarehouse->id]))
        ->assertInertia(fn (Assert $page) => $page->has('requests', 0)->has('warehouses', 3));
    $this->get(route('admin.requests.index'))->assertInertia(fn (Assert $page) => $page->has('requests', 2));
});

test('mutation warehouse filter matches either end of a transfer', function () {
    $superadmin = User::factory()->create(['role' => 'super_admin']);
    $firstWarehouse = Warehouse::factory()->create();
    $secondWarehouse = Warehouse::factory()->create();
    $thirdWarehouse = Warehouse::factory()->create();
    $mutationFactory = InventoryMutation::factory()->state(['item_id' => Item::factory()->create()->item_id, 'user_id' => $superadmin->id, 'quantity' => 2, 'type' => 'TRANSFER']);
    $outgoing = $mutationFactory->create(['from_warehouse_id' => $firstWarehouse->id, 'to_warehouse_id' => $secondWarehouse->id]);
    $incoming = $mutationFactory->create(['from_warehouse_id' => $thirdWarehouse->id, 'to_warehouse_id' => $firstWarehouse->id]);
    $mutationFactory->create(['from_warehouse_id' => $secondWarehouse->id, 'to_warehouse_id' => $thirdWarehouse->id]);

    $this->actingAs($superadmin)->get(route('admin.mutations.index', ['warehouse_id' => $firstWarehouse->id]))
        ->assertInertia(fn (Assert $page) => $page->has('mutations', 2)->where('mutations', fn ($mutations) => collect($mutations)->pluck('id')->sort()->values()->all() === [$outgoing->id, $incoming->id])->has('warehouses', 3));
    $this->get(route('admin.mutations.index'))->assertInertia(fn (Assert $page) => $page->has('mutations', 3));
});

test('SPB warehouse filter follows the linked worksite and preserves assigned user visibility', function () {
    $user = User::factory()->create(['role' => 'user']);
    $firstWorksite = Worksite::factory()->create();
    $secondWorksite = Worksite::factory()->create();
    $warehouse = Warehouse::factory()->create(['worksite_id' => $firstWorksite->id]);
    $otherWarehouse = Warehouse::factory()->create(['worksite_id' => $secondWorksite->id]);
    $unlinkedWarehouse = Warehouse::factory()->create(['worksite_id' => null]);
    $user->warehouses()->attach([$warehouse->id, $otherWarehouse->id, $unlinkedWarehouse->id]);
    ProcurementRequest::factory()->create(['requester_id' => $user->id, 'worksite_id' => $firstWorksite->id]);
    $otherRequest = ProcurementRequest::factory()->create(['requester_id' => $user->id, 'worksite_id' => $secondWorksite->id]);
    ProcurementRequest::factory()->create(['examiner_id' => $user->id, 'worksite_id' => $firstWorksite->id]);
    ProcurementRequest::factory()->create(['worksite_id' => $firstWorksite->id]);
    ProcurementRequest::factory()->create(['requester_id' => $user->id, 'worksite_id' => null]);

    $this->actingAs($user)->get(route('procurement.index', ['warehouse_id' => $warehouse->id]))
        ->assertInertia(fn (Assert $page) => $page->has('requests', 2)->has('warehouses', 3)->where('filters.warehouse_id', $warehouse->id));
    $this->get(route('procurement.index', ['warehouse_id' => $otherWarehouse->id]))
        ->assertInertia(fn (Assert $page) => $page->has('requests', 1)->where('requests.0.id', $otherRequest->id));
    $this->get(route('procurement.index', ['warehouse_id' => $unlinkedWarehouse->id]))
        ->assertInertia(fn (Assert $page) => $page->has('requests', 0));
    $this->get(route('procurement.index'))->assertInertia(fn (Assert $page) => $page->has('requests', 3));
});

test('SPB history always stays within assigned warehouses for non-superadmin users', function (string $role) {
    $user = User::factory()->create(['role' => $role]);
    $assignedWorksite = Worksite::factory()->create();
    $otherWorksite = Worksite::factory()->create();
    $warehouse = Warehouse::factory()->create(['worksite_id' => $assignedWorksite->id]);
    Warehouse::factory()->create(['worksite_id' => $otherWorksite->id]);
    $user->warehouses()->attach($warehouse);
    $visible = ProcurementRequest::factory()->create(['requester_id' => $user->id, 'worksite_id' => $assignedWorksite->id, 'status' => 'received']);
    ProcurementRequest::factory()->create(['examiner_id' => $user->id, 'worksite_id' => $otherWorksite->id, 'status' => 'received']);
    ProcurementRequest::factory()->create(['requester_id' => $user->id, 'worksite_id' => $otherWorksite->id, 'status' => 'draft']);
    ProcurementRequest::factory()->create(['requester_id' => $user->id, 'worksite_id' => null]);

    $this->actingAs($user)->get(route('procurement.index'))
        ->assertInertia(fn (Assert $page) => $page->has('requests', 1)->where('requests.0.id', $visible->id));
    $this->get(route('procurement.index', ['warehouse_id' => $warehouse->id]))
        ->assertInertia(fn (Assert $page) => $page->has('requests', 1)->where('requests.0.id', $visible->id));

    $user->warehouses()->detach($warehouse);

    $this->get(route('procurement.index'))->assertInertia(fn (Assert $page) => $page->has('requests', 0));
})->with(['user', 'warehouse_manager', 'admin']);

test('superadmin can view SPB history across warehouses without membership', function () {
    $superadmin = User::factory()->create(['role' => 'super_admin']);
    ProcurementRequest::factory()->create(['worksite_id' => Worksite::factory()]);
    ProcurementRequest::factory()->create(['worksite_id' => Worksite::factory()]);
    ProcurementRequest::factory()->create(['worksite_id' => null]);

    $this->actingAs($superadmin)->get(route('procurement.index'))
        ->assertInertia(fn (Assert $page) => $page->has('requests', 3));
});

test('warehouse filters reject unassigned warehouses', function (string $routeName) {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $hiddenWarehouse = Warehouse::factory()->create();
    $admin->warehouses()->attach($warehouse);

    $this->actingAs($admin)->getJson(route($routeName, ['warehouse_id' => $hiddenWarehouse->id]))
        ->assertUnprocessable()->assertJsonValidationErrors('warehouse_id');
})->with(['inventory.index', 'requests.index', 'procurement.index']);

test('warehouse filters reject missing warehouse records', function (string $routeName) {
    $superadmin = User::factory()->create(['role' => 'super_admin']);

    $this->actingAs($superadmin)->getJson(route($routeName, ['warehouse_id' => 999]))
        ->assertUnprocessable()->assertJsonValidationErrors('warehouse_id');
})->with(['inventory.index', 'requests.index', 'procurement.index', 'admin.requests.index', 'admin.mutations.index']);

test('warehouse filtering does not grant admin access to management pages', function (string $routeName) {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $admin->warehouses()->attach($warehouse);

    $this->actingAs($admin)->get(route($routeName, ['warehouse_id' => $warehouse->id]))->assertForbidden();
})->with(['admin.requests.index', 'admin.mutations.index']);
