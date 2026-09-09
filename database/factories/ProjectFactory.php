<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    public function definition(): array
    {
        return [
            'group' => 'Project Group A',
            'name' => $this->faker->words(3, true),
            'progress' => $this->faker->numberBetween(0, 100),
            'description' => $this->faker->sentence(),
        ];
    }
}
