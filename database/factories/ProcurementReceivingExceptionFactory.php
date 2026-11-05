<?php

namespace Database\Factories;

use App\Models\ProcurementReceivingException;
use App\Models\ProcurementRequest;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProcurementReceivingException>
 */
class ProcurementReceivingExceptionFactory extends Factory
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
            'warehouse_id' => Warehouse::factory(),
            'requested_by' => User::factory(),
            'status' => 'pending',
            'reason' => fake()->sentence(),
            'quantities' => ['1' => 1],
        ];
    }
}
