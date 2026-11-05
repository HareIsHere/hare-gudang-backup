<?php

namespace Database\Factories;

use App\Models\ProcurementReceivingException;
use App\Models\ProcurementReceivingExceptionAudit;
use App\Models\ProcurementRequest;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProcurementReceivingExceptionAudit>
 */
class ProcurementReceivingExceptionAuditFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'procurement_receiving_exception_id' => ProcurementReceivingException::factory(),
            'procurement_request_id' => ProcurementRequest::factory(),
            'warehouse_id' => Warehouse::factory(),
            'actor_id' => User::factory(),
            'event' => 'requested',
            'reason' => fake()->sentence(),
            'quantities' => ['1' => 1],
        ];
    }
}
