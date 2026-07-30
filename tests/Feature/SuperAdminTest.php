<?php

use App\Models\User;
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
