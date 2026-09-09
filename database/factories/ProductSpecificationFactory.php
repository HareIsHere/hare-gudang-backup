<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductSpecification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductSpecification>
 */
class ProductSpecificationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'group' => 'Spec Group A',
            'name' => $this->faker->words(2, true),
            'part_number' => 'PN-'.$this->faker->numerify('####'),
            'measurement_unit' => 'PCS',
            'description' => $this->faker->sentence(),
            'stage' => 'Ready',
        ];
    }
}
