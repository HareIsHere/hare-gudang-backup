<?php

namespace Database\Factories;

use App\Models\Price;
use App\Models\Product;
use App\Models\ProductSpecification;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Price>
 */
class PriceFactory extends Factory
{
    public function definition(): array
    {
        $product = Product::factory()->create();
        $spec = ProductSpecification::factory()->create(['product_id' => $product->id]);

        return [
            'product_id' => $product->id,
            'product_specification_id' => $spec->id,
            'group' => 'Price Group A',
            'vendor' => $this->faker->company(),
            'currency' => 'IDR',
            'price' => $this->faker->randomFloat(2, 10000, 500000),
            'last_price' => $this->faker->randomFloat(2, 9000, 480000),
            'stage' => 'Ready',
        ];
    }
}
