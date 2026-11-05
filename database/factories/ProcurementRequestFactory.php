<?php

namespace Database\Factories;

use App\Models\ProcurementRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProcurementRequest>
 */
class ProcurementRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'request_number' => 'SPB-'.fake()->unique()->numerify('########-######'),
            'request_date' => fake()->date(),
            'requester_id' => User::factory(),
            'status' => 'draft',
        ];
    }
}
