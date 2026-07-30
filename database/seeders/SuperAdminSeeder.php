<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Seed the super admin user for production.
     *
     * Safe to run multiple times — uses updateOrCreate to avoid duplicates.
     *
     * Usage: php artisan db:seed --class=SuperAdminSeeder
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => env('SUPER_ADMIN_EMAIL', 'superadmin@example.com')],
            [
                'name' => env('SUPER_ADMIN_NAME', 'Super Admin'),
                'password' => Hash::make(env('SUPER_ADMIN_PASSWORD', 'password')),
                'role' => 'super_admin',
            ],
        );

        $this->command->info('Super admin user seeded successfully.');
    }
}
