<?php

use App\Models\DashboardPipeline;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('regular authenticated users can visit the dashboard', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('regular users cannot update dashboard status', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user);

    $response = $this->patch(route('dashboard.update-status'), [
        'activity_id' => 1,
        'status' => 'Working',
    ]);

    $response->assertForbidden();
    $this->assertDatabaseMissing('dashboard_pipelines', [
        'activity_id' => 1,
        'status' => 'Working',
    ]);
});

test('admins can update status from idle to working and back', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $this->actingAs($admin);

    DashboardPipeline::truncate();

    $response = $this->patch(route('dashboard.update-status'), [
        'activity_id' => 1,
        'status' => 'Working',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('dashboard_pipelines', [
        'activity_id' => 1,
        'status' => 'Working',
    ]);

    $response2 = $this->patch(route('dashboard.update-status'), [
        'activity_id' => 1,
        'status' => 'Idle',
    ]);

    $response2->assertRedirect();
    $this->assertDatabaseHas('dashboard_pipelines', [
        'activity_id' => 1,
        'status' => 'Idle',
    ]);
});

test('super admins can update status from idle to working', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $this->actingAs($superAdmin);

    DashboardPipeline::truncate();

    $response = $this->patch(route('dashboard.update-status'), [
        'activity_id' => 2,
        'status' => 'Working',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('dashboard_pipelines', [
        'activity_id' => 2,
        'status' => 'Working',
    ]);
});

test('regular users cannot update or reset custom messages', function () {
    $user = User::factory()->create(['role' => 'user']);
    $this->actingAs($user);

    $response = $this->post(route('dashboard.update-message'), [
        'activity_id' => 1,
        'status' => 'Working',
        'message' => 'Hacked message',
    ]);
    $response->assertForbidden();

    $resetResponse = $this->post(route('dashboard.reset-messages'));
    $resetResponse->assertForbidden();
});

test('super admins can update and reset custom messages', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $this->actingAs($superAdmin);

    $response = $this->post(route('dashboard.update-message'), [
        'activity_id' => 1,
        'status' => 'Working',
        'message' => 'Super admin updated message',
    ]);
    $response->assertRedirect();

    $pipeline = DashboardPipeline::where('activity_id', 1)->first();
    expect($pipeline)->not->toBeNull();
    expect($pipeline->custom_messages['Working'])->toBe('Super admin updated message');

    $resetResponse = $this->post(route('dashboard.reset-messages'));
    $resetResponse->assertRedirect();

    $pipeline->refresh();
    expect($pipeline->custom_messages)->toBe([]);
});
