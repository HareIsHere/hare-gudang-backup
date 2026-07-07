<?php

namespace Database\Seeders;

use App\Models\Item;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\Inventory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Warehouses
        $mainWarehouse = Warehouse::create([
            'name' => 'Head Office',
            'location' => 'Downtown Logistics Hub',
        ]);

        $starWarehouse = Warehouse::create([
            'name' => 'Rimau Star',
            'location' => 'Star',
        ]);

        $pacificWarehouse = Warehouse::create([
            'name' => 'Rimau Pacific',
            'location' => 'Pacific',
        ]);

        $oceanWarehouse = Warehouse::create([
            'name' => 'Rimau Ocean',
            'location' => 'Ocean',
        ]);

        // 2. Create Users
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $user = User::factory()->create([
            'name' => 'Regular User',
            'email' => 'user@example.com',
            'password' => Hash::make('password'),
            'role' => 'user',
        ]);

        // 3. Assign User to specific warehouses (RBAC)
        $user->warehouses()->attach([$starWarehouse->id, $oceanWarehouse->id]);

        // 4. Create Items
        $filterAngin = Item::create(['item_name' => 'Filter Angin']);
        $fuelFilter = Item::create(['item_name' => 'Fuel Filter']);
        $chamberAngin = Item::create(['item_name' => 'Chamber Angin']);
        $injector = Item::create(['item_name' => 'Injector']);

        // 5. Seed Initial Inventory
        Inventory::create([
            'item_id' => $filterAngin->item_id,
            'warehouse_id' => $mainWarehouse->id,
            'quantity' => 25,
        ]);

        Inventory::create([
            'item_id' => $filterAngin->item_id,
            'warehouse_id' => $starWarehouse->id,
            'quantity' => 10,
        ]);

        Inventory::create([
            'item_id' => $fuelFilter->item_id,
            'warehouse_id' => $mainWarehouse->id,
            'quantity' => 100,
        ]);

        Inventory::create([
            'item_id' => $chamberAngin->item_id,
            'warehouse_id' => $oceanWarehouse->id,
            'quantity' => 45,
        ]);
        
        Inventory::create([
            'item_id' => $injector->item_id,
            'warehouse_id' => $pacificWarehouse->id,
            'quantity' => 15,
        ]);
    }
}
