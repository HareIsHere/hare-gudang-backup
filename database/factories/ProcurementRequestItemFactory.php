<?php

namespace Database\Factories;

use App\Models\Item;
use App\Models\ProcurementRequest;
use App\Models\ProcurementRequestItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProcurementRequestItem>
 */
class ProcurementRequestItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'procurement_request_id' => ProcurementRequest::factory(),
            'item_id' => Item::factory(),
            'item_name' => fake()->words(3, true),
            'item_code' => fake()->bothify('ITEM-###'),
            'requested_quantity' => fake()->numberBetween(1, 50),
        ];
    }
}
