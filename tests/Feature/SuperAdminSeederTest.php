<?php

use App\Models\User;
use Database\Seeders\SuperAdminSeeder;

test('it creates a super admin user', function () {
    $this->seed(SuperAdminSeeder::class);

    $this->assertDatabaseHas('users', [
        'email' => 'superadmin@example.com',
        'role' => 'super_admin',
    ]);
});

test('it is idempotent and does not duplicate users', function () {
    $this->seed(SuperAdminSeeder::class);
    $this->seed(SuperAdminSeeder::class);

    expect(User::where('email', 'superadmin@example.com')->count())->toBe(1);
});
