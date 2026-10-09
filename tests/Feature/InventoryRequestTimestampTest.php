<?php

use App\Models\InventoryRequest;
use App\Models\Item;
use App\Models\User;
use App\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('admin requests include the request creation timestamp', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $requestedAt = Carbon::parse('2026-10-09 10:30:00');
    $request = InventoryRequest::factory()->create([
        'item_id' => Item::factory(),
        'warehouse_id' => Warehouse::factory(),
        'created_at' => $requestedAt,
        'updated_at' => $requestedAt,
    ]);

    $this->actingAs($admin)->get(route('admin.requests.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/requests/index')
            ->where('requests.0.id', $request->id)
            ->where('requests.0.created_at', $requestedAt->toJSON())
        );
});

test('canceling a request records a timestamp and exposes the complete cancellation note', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $request = InventoryRequest::factory()->create([
        'item_id' => Item::factory(),
        'warehouse_id' => Warehouse::factory(),
        'status' => 'requested',
    ]);
    $canceledAt = Carbon::parse('2026-10-09 11:00:00');
    $reason = "Item unavailable.\n".str_repeat('Please submit a new request next week. ', 10);
    $storedReason = trim($reason);

    $this->travelTo($canceledAt);

    $this->actingAs($admin)->patch(route('admin.requests.update-status', $request), [
        'status' => 'canceled',
        'reason' => $storedReason,
    ])->assertRedirect();

    $this->assertDatabaseHas('inventory_requests', [
        'id' => $request->id,
        'status' => 'canceled',
        'reason' => $storedReason,
        'canceled_at' => $canceledAt->format('Y-m-d H:i:s'),
    ]);

    $this->actingAs($admin)->get(route('admin.requests.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('requests.0.reason', $storedReason)
            ->where('requests.0.canceled_at', $canceledAt->toJSON())
        );
});

test('unrelated status updates do not set a cancellation timestamp', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $request = InventoryRequest::factory()->create([
        'item_id' => Item::factory(),
        'warehouse_id' => Warehouse::factory(),
        'status' => 'requested',
        'canceled_at' => null,
    ]);

    $this->actingAs($admin)->patch(route('admin.requests.update-status', $request), [
        'status' => 'onReview',
    ])->assertRedirect();

    $this->assertDatabaseHas('inventory_requests', [
        'id' => $request->id,
        'status' => 'onReview',
        'canceled_at' => null,
    ]);
});
