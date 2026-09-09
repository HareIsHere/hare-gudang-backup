<?php

namespace Database\Factories;

use App\Models\Worksite;
use App\Models\WorksiteCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Worksite>
 */
class WorksiteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'worksite_category_id' => WorksiteCategory::factory(),
            'group' => 'Worksite Group A',
            'name' => $this->faker->company(),
            'address' => $this->faker->address(),
            'description' => $this->faker->sentence(),
            'stage' => 'Ready',
        ];
    }
}
