<?php

namespace Database\Seeders;

use App\Models\DashboardPipeline;
use Illuminate\Database\Seeder;

class DashboardPipelineSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DashboardPipeline::updateOrCreate(
            ['activity_id' => 1],
            ['status' => 'Working', 'custom_messages' => []]
        );
        DashboardPipeline::updateOrCreate(
            ['activity_id' => 2],
            ['status' => 'Idle', 'custom_messages' => []]
        );
        DashboardPipeline::updateOrCreate(
            ['activity_id' => 3],
            ['status' => 'Idle', 'custom_messages' => []]
        );
    }
}
