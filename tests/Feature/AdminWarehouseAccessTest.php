<?php

use App\Models\Inventory;
use App\Models\InventoryMutation;
use App\Models\InventoryRequest;
use App\Models\Item;
use App\Models\ProcurementRequest;
use App\Models\Product;
use App\Models\ProductSpecification;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\Worksite;
use Inertia\Testing\AssertableInertia as Assert;

test('admin inventory exposes only assigned warehouse stock', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $assigned = Warehouse::factory()->create();
    $hidden = Warehouse::factory()->create();
    $admin->warehouses()->attach($assigned);
    $sharedItem = Item::factory()->create();
    $privateItem = Item::factory()->create();
    Item::factory()->create(['item_name' => 'Unassigned product']);
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
    $this->actingAs($admin)->get(route('inventory.index'))->assertInertia(fn (Assert $page) => $page->has('warehouses', 0)->has('items', 0)->has('masterProducts', 0)->has('categories', 0));
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
    $this->actingAs($admin)->get(route('admin.requests.index'))->assertForbidden();
    expect(InventoryMutation::count())->toBe(0);
});

test('admin cannot access mutation history even for an assigned warehouse', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $assigned = Warehouse::factory()->create();
    $hidden = Warehouse::factory()->create();
    $admin->warehouses()->attach($assigned);
    $item = Item::factory()->create();
    InventoryMutation::factory()->create(['item_id' => $item->item_id, 'from_warehouse_id' => null, 'to_warehouse_id' => $assigned->id, 'quantity' => 1, 'type' => 'IN', 'user_id' => $admin->id]);
    InventoryMutation::factory()->create(['item_id' => $item->item_id, 'from_warehouse_id' => $assigned->id, 'to_warehouse_id' => $hidden->id, 'quantity' => 1, 'type' => 'TRANSFER', 'user_id' => $admin->id]);
    $this->actingAs($admin)->get(route('admin.mutations.index'))->assertForbidden();
    expect(InventoryMutation::count())->toBe(2);
});

test('superadmin retains access to all warehouses', function () {
    $admin = User::factory()->create(['role' => 'super_admin']);
    $warehouse = Warehouse::factory()->create();
    $this->actingAs($admin)->post(route('admin.items.store'), ['item_name' => 'Superadmin product', 'warehouse_id' => $warehouse->id, 'initial_quantity' => 2])->assertSessionHasNoErrors();
    $this->actingAs($admin)->get(route('inventory.index'))->assertInertia(fn (Assert $page) => $page->has('warehouses', 1));
});

test('admin catalog and SPB search expose only products linked to assigned warehouses including zero stock', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $otherWarehouse = Warehouse::factory()->create();
    $admin->warehouses()->attach($warehouse);
    $visibleProduct = Product::factory()->create(['category' => 'Visible category']);
    $hiddenProduct = Product::factory()->create(['category' => 'Hidden category']);
    Product::factory()->create(['category' => 'Catalog only category']);
    $visibleItem = Item::factory()->create(['product_id' => $visibleProduct->id, 'category' => 'Visible category']);
    $hiddenItem = Item::factory()->create(['product_id' => $hiddenProduct->id, 'category' => 'Hidden category']);
    Item::factory()->create(['product_id' => $hiddenProduct->id]);
    Inventory::factory()->create(['item_id' => $visibleItem->item_id, 'warehouse_id' => $warehouse->id, 'quantity' => 0]);
    Inventory::factory()->create(['item_id' => $hiddenItem->item_id, 'warehouse_id' => $otherWarehouse->id, 'quantity' => 9]);

    $this->actingAs($admin)->get(route('inventory.index'))->assertInertia(fn (Assert $page) => $page
        ->has('items', 1)->where('items.0.item_id', $visibleItem->item_id)
        ->has('masterProducts', 1)->where('masterProducts.0.id', $visibleProduct->id)
        ->where('categories', ['Visible category'])->has('masterWorksites', 0));
    $this->get(route('procurement.items.search'))->assertJsonCount(1)->assertJsonPath('0.item_id', $visibleItem->item_id);
    $this->get(route('procurement.items.search', ['q' => $hiddenItem->item_name]))->assertExactJson([]);
    $this->get(route('requests.index'))->assertInertia(fn (Assert $page) => $page->has('items', 0));
});

test('admin cannot alter hidden products by guessing item or product identifiers', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $admin->warehouses()->attach($warehouse);
    $hiddenProduct = Product::factory()->create();
    $hiddenSpecification = ProductSpecification::factory()->create(['product_id' => $hiddenProduct->id]);
    $hiddenItem = Item::factory()->create(['product_id' => $hiddenProduct->id]);
    $visibleItem = Item::factory()->create();
    Inventory::factory()->create(['item_id' => $visibleItem->item_id, 'warehouse_id' => $warehouse->id, 'quantity' => 5]);

    $this->actingAs($admin)->patch(route('admin.items.update', $hiddenItem), ['warehouse_id' => $warehouse->id, 'quantity_adjustment' => 2])->assertForbidden();
    $this->patch(route('admin.items.update-category', $hiddenItem), ['category' => 'Forbidden'])->assertForbidden();
    $this->delete(route('admin.items.destroy', $hiddenItem))->assertForbidden();
    $this->patch(route('admin.items.update', $visibleItem), ['product_id' => $hiddenProduct->id])->assertForbidden();
    $this->post(route('admin.items.store'), ['product_id' => $hiddenProduct->id, 'warehouse_id' => $warehouse->id, 'initial_quantity' => 2])->assertForbidden();
    $this->patch(route('admin.items.update', $visibleItem), ['product_specification_id' => $hiddenSpecification->id])->assertForbidden();
    $this->post(route('admin.items.store'), ['item_name' => 'Hidden specification', 'product_specification_id' => $hiddenSpecification->id])->assertForbidden();

    expect($hiddenItem->fresh())->not->toBeNull();
    expect($visibleItem->fresh()->product_id)->toBeNull();
    expect(Inventory::where('item_id', $hiddenItem->item_id)->exists())->toBeFalse();
    expect(InventoryMutation::count())->toBe(0);
});

test('admin cannot submit hidden items in SPB drafts or submissions', function (string $status) {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $admin->warehouses()->attach($warehouse);
    $item = Item::factory()->create();
    $worksite = Worksite::factory()->create();

    $this->actingAs($admin)->post(route('procurement.store'), [
        'worksite_id' => $worksite->id,
        'request_date' => '2026-11-10',
        'status' => $status,
        'items' => [['item_id' => $item->item_id, 'requested_quantity' => 1, 'measurement_unit' => 'pcs']],
    ])->assertSessionHasErrors('items.0.item_id');

    expect(ProcurementRequest::count())->toBe(0);
})->with(['draft', 'submitted']);

test('admin cannot manage another users requests through admin or personal routes', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $admin->warehouses()->attach($warehouse);
    $request = InventoryRequest::factory()->create(['warehouse_id' => $warehouse->id, 'status' => 'canceled']);

    $this->actingAs($admin)->get(route('admin.requests.index'))->assertForbidden();
    $this->patch(route('admin.requests.update-status', $request), ['status' => 'finished'])->assertForbidden();
    $this->delete(route('admin.requests.destroy', $request->id))->assertForbidden();
    $this->delete(route('requests.destroy', $request->id))->assertForbidden();

    expect($request->fresh()->status)->toBe('canceled');
    expect(InventoryMutation::count())->toBe(0);
});

test('admin cannot modify Feature Master through direct requests', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $product = Product::factory()->create();

    $this->actingAs($admin)->post(route('master.products.data.store'), ['name' => 'Forbidden product'])->assertForbidden();
    $this->put(route('master.products.data.update', $product), ['name' => 'Forbidden rename'])->assertForbidden();
    $this->delete(route('master.products.data.destroy', $product))->assertForbidden();

    expect($product->fresh()->name)->toBe($product->name);
    expect(Product::count())->toBe(1);
});
