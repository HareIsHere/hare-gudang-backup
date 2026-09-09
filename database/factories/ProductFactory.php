<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'group' => 'Product Group A',
            'category' => $this->faker->word(),
            'name' => $this->faker->words(2, true),
            'description' => $this->faker->sentence(),
            'stage' => 'Ready',
        ];
    }
}
