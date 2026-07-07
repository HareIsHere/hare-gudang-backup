<?php

namespace Database\Factories;

use App\Models\InventoryRequest;
use App\Models\Item;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryRequest>
 */
class InventoryRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'item_id' => Item::factory(),
            'warehouse_id' => Warehouse::factory(),
            'qty' => $this->faker->numberBetween(1, 50),
            'status' => 'requested',
            'type' => 'OUT',
        ];
    }
}
