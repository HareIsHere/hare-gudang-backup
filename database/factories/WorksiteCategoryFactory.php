<?php

namespace Database\Factories;

use App\Models\WorksiteCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WorksiteCategory>
 */
class WorksiteCategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'group' => 'Worksite Group A',
            'name' => $this->faker->words(2, true),
            'description' => $this->faker->sentence(),
            'stage' => 'Ready',
        ];
    }
}
