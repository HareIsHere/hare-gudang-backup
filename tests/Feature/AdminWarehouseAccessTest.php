<?php

use App\Models\Inventory;
use App\Models\InventoryMutation;
use App\Models\InventoryRequest;
use App\Models\Item;
use App\Models\User;
use App\Models\Warehouse;
use Inertia\Testing\AssertableInertia as Assert;

test('admin inventory exposes only assigned warehouse stock', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $assigned = Warehouse::factory()->create();
    $hidden = Warehouse::factory()->create();
    $admin->warehouses()->attach($assigned);
    $sharedItem = Item::factory()->create();
    $privateItem = Item::factory()->create();
    Inventory::factory()->create(['item_id' => $sharedItem->item_id, 'warehouse_id' => $assigned->id, 'quantity' => 10]);
    Inventory::factory()->create(['item_id' => $sharedItem->item_id, 'warehouse_id' => $hidden->id, 'quantity' => 99]);
    Inventory::factory()->create(['item_id' => $privateItem->item_id, 'warehouse_id' => $hidden->id, 'quantity' => 7]);

    $this->actingAs($admin)->get(route('inventory.index'))->assertInertia(fn (Assert $page) => $page->has('warehouses', 1)->where('warehouses.0.id', $assigned->id)->has('items', 1)->where('items.0.item_id', $sharedItem->item_id)->has('items.0.inventories', 1)->where('items.0.inventories.0.quantity', 10)->has('users', 0));
    $this->actingAs($admin)->get(route('procurement.items.search'))->assertJsonMissing(['quantity' => 99]);
});

test('admin can create products and adjust stock in assigned warehouses only', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $assigned = Warehouse::factory()->create();
    $hidden = Warehouse::factory()->create();
    $admin->warehouses()->attach($assigned);
    $this->actingAs($admin)->post(route('admin.items.store'), ['item_name' => 'New warehouse product', 'warehouse_id' => $assigned->id, 'initial_quantity' => 5])->assertSessionHasNoErrors();
    $item = Item::where('item_name', 'New warehouse product')->firstOrFail();
    $this->actingAs($admin)->patch(route('admin.items.update', $item), ['warehouse_id' => $assigned->id, 'quantity_adjustment' => -2])->assertSessionHasNoErrors();
    $this->assertDatabaseHas('inventories', ['item_id' => $item->item_id, 'warehouse_id' => $assigned->id, 'quantity' => 3]);
    $this->actingAs($admin)->patch(route('admin.items.update', $item), ['warehouse_id' => $hidden->id, 'quantity_adjustment' => 10, 'item_name' => 'Unauthorized rename'])->assertForbidden();
    $this->actingAs($admin)->post(route('admin.items.store'), ['item_name' => 'Forbidden product', 'warehouse_id' => $hidden->id, 'initial_quantity' => 10])->assertForbidden();
    $this->assertDatabaseMissing('items', ['item_name' => 'Forbidden product']);
    expect($item->fresh()->item_name)->toBe('New warehouse product');
    expect(InventoryMutation::count())->toBe(2);
});

test('admin without warehouses can still create a product without stock', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $this->actingAs($admin)->post(route('admin.items.store'), ['item_name' => 'Unstocked product'])->assertSessionHasNoErrors();
    $this->actingAs($admin)->get(route('inventory.index'))->assertInertia(fn (Assert $page) => $page->has('warehouses', 0)->has('items', 1));
    expect(Inventory::count())->toBe(0);
});

test('admin cannot bypass warehouse scope through requests, deletion or membership assignment', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    Inventory::factory()->create(['item_id' => $item->item_id, 'warehouse_id' => $warehouse->id, 'quantity' => 10]);
    $request = InventoryRequest::factory()->create(['item_id' => $item->item_id, 'warehouse_id' => $warehouse->id]);
    $this->actingAs($admin)->patch(route('admin.requests.update-status', $request), ['status' => 'finished'])->assertForbidden();
    $this->actingAs($admin)->delete(route('admin.items.destroy', $item))->assertForbidden();
    $this->actingAs($admin)->post(route('admin.warehouses.assign'), ['user_id' => $admin->id, 'warehouse_id' => $warehouse->id])->assertForbidden();
    $this->actingAs($admin)->delete(route('admin.warehouses.destroy', $warehouse))->assertForbidden();
    $this->actingAs($admin)->get(route('admin.requests.index'))->assertInertia(fn (Assert $page) => $page->has('requests', 0));
    expect(InventoryMutation::count())->toBe(0);
});

test('mutation history hides transfers involving unassigned warehouses', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $assigned = Warehouse::factory()->create();
    $hidden = Warehouse::factory()->create();
    $admin->warehouses()->attach($assigned);
    $item = Item::factory()->create();
    InventoryMutation::factory()->create(['item_id' => $item->item_id, 'from_warehouse_id' => null, 'to_warehouse_id' => $assigned->id, 'quantity' => 1, 'type' => 'IN', 'user_id' => $admin->id]);
    InventoryMutation::factory()->create(['item_id' => $item->item_id, 'from_warehouse_id' => $assigned->id, 'to_warehouse_id' => $hidden->id, 'quantity' => 1, 'type' => 'TRANSFER', 'user_id' => $admin->id]);
    $this->actingAs($admin)->get(route('admin.mutations.index'))->assertInertia(fn (Assert $page) => $page->has('mutations', 1)->where('mutations.0.to_warehouse_id', $assigned->id));
});

test('superadmin retains access to all warehouses', function () {
    $admin = User::factory()->create(['role' => 'super_admin']);
    $warehouse = Warehouse::factory()->create();
    $this->actingAs($admin)->post(route('admin.items.store'), ['item_name' => 'Superadmin product', 'warehouse_id' => $warehouse->id, 'initial_quantity' => 2])->assertSessionHasNoErrors();
    $this->actingAs($admin)->get(route('inventory.index'))->assertInertia(fn (Assert $page) => $page->has('warehouses', 1));
});
