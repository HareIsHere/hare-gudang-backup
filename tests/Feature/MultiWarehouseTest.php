<?php

use App\Models\Inventory;
use App\Models\InventoryMutation;
use App\Models\InventoryRequest;
use App\Models\Item;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can fulfill an inventory request and it logs mutation', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();
    
    // Seed initial inventory
    Inventory::factory()->create([
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 100,
    ]);

    $request = InventoryRequest::factory()->create([
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'qty' => 10,
        'status' => 'requested',
        'type' => 'OUT',
    ]);

    $response = $this->actingAs($admin)->patch(route('admin.requests.update-status', $request), [
        'status' => 'finished',
    ]);

    $response->assertRedirect();
    
    // Verify stock decremented
    $this->assertDatabaseHas('inventories', [
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 90,
    ]);

    // Verify mutation logged with REQUEST type
    $this->assertDatabaseHas('inventory_mutations', [
        'item_id' => $item->item_id,
        'from_warehouse_id' => $warehouse->id,
        'quantity' => 10,
        'type' => 'REQUEST',
        'user_id' => $request->user_id,
        'reference_id' => $request->id,
    ]);
});

test('user cannot request from warehouse they do not have access to', function () {
    $user = User::factory()->create(['role' => 'user']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();

    $response = $this->actingAs($user)->post(route('requests.store'), [
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'qty' => 5,
    ]);

    $response->assertStatus(403);
});

test('user can request from assigned warehouse', function () {
    $user = User::factory()->create(['role' => 'user']);
    $warehouse = Warehouse::factory()->create();
    $user->warehouses()->attach($warehouse);
    $item = Item::factory()->create();

    $response = $this->actingAs($user)->post(route('requests.store'), [
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'qty' => 5,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('inventory_requests', [
        'user_id' => $user->id,
        'warehouse_id' => $warehouse->id,
        'qty' => 5,
    ]);
});

test('admin can create a warehouse', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post(route('admin.warehouses.store'), [
        'name' => 'New Test Warehouse',
        'location' => 'Test Location',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('warehouses', [
        'name' => 'New Test Warehouse',
        'location' => 'Test Location',
    ]);
});

test('regular user cannot create a warehouse', function () {
    $user = User::factory()->create(['role' => 'user']);

    $response = $this->actingAs($user)->post(route('admin.warehouses.store'), [
        'name' => 'New Test Warehouse 2',
        'location' => 'Test Location 2',
    ]);

    $response->assertStatus(403);
    $this->assertDatabaseMissing('warehouses', [
        'name' => 'New Test Warehouse 2',
    ]);
});

test('admin can delete a warehouse', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();

    $response = $this->actingAs($admin)->delete(route('admin.warehouses.destroy', $warehouse));

    $response->assertRedirect();
    $this->assertDatabaseMissing('warehouses', [
        'id' => $warehouse->id,
    ]);
});

test('regular user cannot delete a warehouse', function () {
    $user = User::factory()->create(['role' => 'user']);
    $warehouse = Warehouse::factory()->create();

    $response = $this->actingAs($user)->delete(route('admin.warehouses.destroy', $warehouse));

    $response->assertStatus(403);
    $this->assertDatabaseHas('warehouses', [
        'id' => $warehouse->id,
    ]);
});

test('only canceled requests can be deleted', function () {
    $user = User::factory()->create(['role' => 'user']);
    $warehouse = Warehouse::factory()->create();
    $user->warehouses()->attach($warehouse);
    $item = Item::factory()->create();

    $request = InventoryRequest::factory()->create([
        'user_id' => $user->id,
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'qty' => 5,
        'status' => 'requested',
    ]);

    // Attempting to delete when status is requested should fail
    $response = $this->actingAs($user)->delete(route('requests.destroy', $request->id));
    $response->assertStatus(400);
    $this->assertDatabaseHas('inventory_requests', [
        'id' => $request->id,
    ]);

    // Change status to canceled
    $request->update(['status' => 'canceled']);

    // Attempting to delete when status is canceled should succeed
    $response = $this->actingAs($user)->delete(route('requests.destroy', $request->id));
    $response->assertRedirect();
    $this->assertDatabaseMissing('inventory_requests', [
        'id' => $request->id,
    ]);
});

test('admin can adjust stock by negative amount to decrease inventory', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();

    // Seed initial inventory
    Inventory::factory()->create([
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 50,
    ]);

    $response = $this->actingAs($admin)->patch(route('admin.items.update', $item), [
        'item_name' => $item->item_name,
        'warehouse_id' => $warehouse->id,
        'quantity_adjustment' => -10,
    ]);

    $response->assertRedirect();

    // Verify stock decremented
    $this->assertDatabaseHas('inventories', [
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 40,
    ]);

    // Verify mutation logged with OUT type
    $this->assertDatabaseHas('inventory_mutations', [
        'item_id' => $item->item_id,
        'from_warehouse_id' => $warehouse->id,
        'to_warehouse_id' => null,
        'quantity' => 10,
        'type' => 'OUT',
        'reference_type' => 'Manual Adjustment',
    ]);
});

test('admin can cancel a finished inventory request, which reverts stock and logs cancellation', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();

    // Seed initial inventory
    Inventory::factory()->create([
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 90, // Fulfill reduced it from 100 to 90
    ]);

    $request = InventoryRequest::factory()->create([
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'qty' => 10,
        'status' => 'finished', // Pre-marked as finished
        'type' => 'OUT',
    ]);

    // Admin transitions from finished to canceled
    $response = $this->actingAs($admin)->patch(route('admin.requests.update-status', $request), [
        'status' => 'canceled',
        'reason' => 'Accidentally finished',
    ]);

    $response->assertRedirect();

    // Verify stock reverted back to 100 (90 + 10)
    $this->assertDatabaseHas('inventories', [
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 100,
    ]);

    // Verify cancellation mutation logged (since original was OUT, revert is IN)
    $this->assertDatabaseHas('inventory_mutations', [
        'item_id' => $item->item_id,
        'from_warehouse_id' => null,
        'to_warehouse_id' => $warehouse->id,
        'quantity' => 10,
        'type' => 'IN',
        'reference_type' => 'Request Cancellation',
        'reference_id' => $request->id,
    ]);

    // Verify request status is canceled
    $this->assertDatabaseHas('inventory_requests', [
        'id' => $request->id,
        'status' => 'canceled',
        'reason' => 'Accidentally finished',
    ]);
});

test('admin can revert a finished inventory request back to review, which reverts stock and logs reversion', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $item = Item::factory()->create();

    // Seed initial inventory
    Inventory::factory()->create([
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 90, // Fulfill reduced it from 100 to 90
    ]);

    $request = InventoryRequest::factory()->create([
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'qty' => 10,
        'status' => 'finished',
        'type' => 'OUT',
    ]);

    // Admin transitions from finished back to onReview
    $response = $this->actingAs($admin)->patch(route('admin.requests.update-status', $request), [
        'status' => 'onReview',
    ]);

    $response->assertRedirect();

    // Verify stock reverted back to 100 (90 + 10)
    $this->assertDatabaseHas('inventories', [
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 100,
    ]);

    // Verify reversion mutation logged (since original was OUT, revert is IN)
    $this->assertDatabaseHas('inventory_mutations', [
        'item_id' => $item->item_id,
        'from_warehouse_id' => null,
        'to_warehouse_id' => $warehouse->id,
        'quantity' => 10,
        'type' => 'IN',
        'reference_type' => 'Request Reversion',
        'reference_id' => $request->id,
    ]);

    // Verify request status is back to onReview
    $this->assertDatabaseHas('inventory_requests', [
        'id' => $request->id,
        'status' => 'onReview',
        'reason' => null,
    ]);
});
