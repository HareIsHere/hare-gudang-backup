<?php

use App\Models\DashboardPipeline;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('authenticated users can update status even if pipeline record does not exist', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

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
});
