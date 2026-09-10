<?php

use App\Models\Item;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin can set category when creating a new item', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post(route('admin.items.store'), [
        'item_name' => 'Test Laptop',
        'category' => 'Electronics',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('items', [
        'item_name' => 'Test Laptop',
        'category' => 'Electronics',
    ]);
});

test('admin can update item name and category', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $item = Item::factory()->create(['category' => 'Old Category']);

    $response = $this->actingAs($admin)->patch(route('admin.items.update', $item), [
        'item_name' => 'Updated Laptop',
        'category' => 'Electronics',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('items', [
        'item_id' => $item->item_id,
        'item_name' => 'Updated Laptop',
        'category' => 'Electronics',
    ]);
});

test('admin can update category of an item', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $item = Item::factory()->create(['category' => 'Initial Category']);

    $response = $this->actingAs($admin)->patch(route('admin.items.update-category', $item), [
        'category' => 'Admin Updated Category',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('items', [
        'item_id' => $item->item_id,
        'category' => 'Admin Updated Category',
    ]);
});

test('super admin can update category of an item', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $item = Item::factory()->create(['category' => 'Initial Category']);

    $response = $this->actingAs($superAdmin)->patch(route('admin.items.update-category', $item), [
        'category' => 'SuperAdmin Updated Category',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('items', [
        'item_id' => $item->item_id,
        'category' => 'SuperAdmin Updated Category',
    ]);
});

test('regular user cannot update category of an item', function () {
    $user = User::factory()->create(['role' => 'user']);
    $item = Item::factory()->create(['category' => 'Initial Category']);

    $response = $this->actingAs($user)->patch(route('admin.items.update-category', $item), [
        'category' => 'User Updated Category',
    ]);

    $response->assertForbidden();
    $this->assertDatabaseHas('items', [
        'item_id' => $item->item_id,
        'category' => 'Initial Category',
    ]);
});

test('unauthenticated users cannot update category of an item', function () {
    $item = Item::factory()->create(['category' => 'Initial Category']);

    $response = $this->patch(route('admin.items.update-category', $item), [
        'category' => 'Guest Updated Category',
    ]);

    $response->assertRedirect(route('login'));
});

test('admin can create item from master product without custom name or category', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $product = Product::factory()->create([
        'name' => 'Master Drill',
        'category' => 'Tools',
    ]);

    $response = $this->actingAs($admin)->post(route('admin.items.store'), [
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'initial_quantity' => 5,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('items', [
        'product_id' => $product->id,
        'item_name' => 'Master Drill',
        'category' => 'Tools',
    ]);
});

test('admin creating custom item requires product name when not selecting master product', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post(route('admin.items.store'), [
        'item_name' => '',
        'category' => 'Tools',
    ]);

    $response->assertSessionHasErrors(['item_name']);
});
