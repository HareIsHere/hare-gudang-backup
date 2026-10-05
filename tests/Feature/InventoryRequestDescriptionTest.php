<?php

use App\Models\Inventory;
use App\Models\Item;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('an inventory request requires a description and makes it available to admins', function () {
    $user = User::factory()->create(['role' => 'user']);
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();
    $user->warehouses()->attach($warehouse);
    $item = Item::factory()->create();

    Inventory::factory()->create([
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 10,
    ]);

    $this->actingAs($user)->post(route('requests.store'), [
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'qty' => 2,
    ])->assertSessionHasErrors('request_description');

    $this->actingAs($user)->post(route('requests.store'), [
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'request_description' => str_repeat('a', 1001),
        'qty' => 2,
    ])->assertSessionHasErrors('request_description');

    $this->actingAs($user)->post(route('requests.store'), [
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'request_description' => 'Needed to replace the damaged pump seal.',
        'qty' => 2,
    ])->assertRedirect();

    $this->assertDatabaseHas('inventory_requests', [
        'user_id' => $user->id,
        'item_id' => $item->item_id,
        'request_description' => 'Needed to replace the damaged pump seal.',
    ]);

    $this->actingAs($admin)->get(route('admin.requests.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/requests/index')
            ->where('requests.0.request_description', 'Needed to replace the damaged pump seal.')
        );
});
