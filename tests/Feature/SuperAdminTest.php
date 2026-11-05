<?php

use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('super admin can access the user management page', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);

    $response = $this->actingAs($superAdmin)->get(route('super-admin.users.index'));

    $response->assertStatus(200);
});

test('super admin can promote a user to admin', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $user = User::factory()->create(['role' => 'user']);

    $response = $this->actingAs($superAdmin)->patch(route('super-admin.users.promote', $user));

    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'role' => 'admin',
    ]);
});

test('super admin can demote an admin to user', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($superAdmin)->patch(route('super-admin.users.demote', $admin));

    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'id' => $admin->id,
        'role' => 'user',
    ]);
});

test('normal admin cannot access the user management page', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get(route('super-admin.users.index'));

    $response->assertStatus(403);
});

test('regular user cannot access the user management page', function () {
    $user = User::factory()->create(['role' => 'user']);

    $response = $this->actingAs($user)->get(route('super-admin.users.index'));

    $response->assertStatus(403);
});

test('superadmin can select a promotion role while preserving warehouse membership', function (string $role) {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $user = User::factory()->create(['role' => 'user']);
    $warehouse = Warehouse::factory()->create();
    $user->warehouses()->attach($warehouse);
    $this->actingAs($superAdmin)->patch(route('super-admin.users.promote', $user), ['role' => $role])->assertSessionHasNoErrors();
    expect($user->fresh()->role)->toBe($role);
    expect($user->warehouses()->whereKey($warehouse->id)->exists())->toBeTrue();
})->with(['admin', 'warehouse_manager']);

test('superadmin can demote a warehouse manager', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $user = User::factory()->create(['role' => 'warehouse_manager']);
    $this->actingAs($superAdmin)->patch(route('super-admin.users.demote', $user))->assertRedirect();
    expect($user->fresh()->role)->toBe('user');
});

test('invalid promotion roles are refused', function (string $role) {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $user = User::factory()->create();
    $this->actingAs($superAdmin)->patch(route('super-admin.users.promote', $user), ['role' => $role])->assertSessionHasErrors('role');
    expect($user->fresh()->role)->toBe('user');
})->with(['super_admin', 'user', 'unknown', '']);

test('non-superadmins cannot mutate roles', function (string $role) {
    $actor = User::factory()->create(['role' => $role]);
    $user = User::factory()->create();
    $this->actingAs($actor)->patch(route('super-admin.users.promote', $user), ['role' => 'warehouse_manager'])->assertForbidden();
    $this->actingAs($actor)->patch(route('super-admin.users.demote', $user))->assertForbidden();
    expect($user->fresh()->role)->toBe('user');
})->with(['admin', 'warehouse_manager', 'user']);

test('superadmin roles and self modification are protected', function () {
    $actor = User::factory()->create(['role' => 'super_admin']);
    $other = User::factory()->create(['role' => 'super_admin']);
    $this->actingAs($actor)->patch(route('super-admin.users.promote', $actor), ['role' => 'admin'])->assertForbidden();
    $this->actingAs($actor)->patch(route('super-admin.users.demote', $other))->assertForbidden();
    expect($actor->fresh()->role)->toBe('super_admin');
    expect($other->fresh()->role)->toBe('super_admin');
});
