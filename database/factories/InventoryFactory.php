<?php

namespace Database\Factories;

use App\Models\Inventory;
use App\Models\Item;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Inventory>
 */
class InventoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'item_id' => Item::factory(),
            'warehouse_id' => Warehouse::factory(),
            'quantity' => $this->faker->numberBetween(0, 1000),
        ];
    }
}
