<?php

use App\Models\Item;
use App\Models\Product;
use App\Models\Project;
use App\Models\Warehouse;
use App\Models\Worksite;
use App\Models\WorksiteCategory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table) {
            $table->foreignId('product_id')->nullable()->after('item_name')->constrained('products')->nullOnDelete();
            $table->foreignId('product_specification_id')->nullable()->after('product_id')->constrained('product_specifications')->nullOnDelete();
        });

        Schema::table('warehouses', function (Blueprint $table) {
            $table->foreignId('worksite_id')->nullable()->after('location')->constrained('worksites')->nullOnDelete();
        });

        Schema::table('inventory_requests', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->after('warehouse_id')->constrained('projects')->nullOnDelete();
            $table->foreignId('worksite_id')->nullable()->after('project_id')->constrained('worksites')->nullOnDelete();
        });

        // Migrate existing data so Feature Master becomes the reference source
        $this->migrateExistingData();
    }

    /**
     * Migrate existing items and warehouses into Feature Master data.
     */
    protected function migrateExistingData(): void
    {
        // 1. Existing items -> Master Products
        $items = Item::all();
        foreach ($items as $item) {
            $product = Product::firstOrCreate(
                ['name' => $item->item_name],
                [
                    'group' => 'Inventory',
                    'category' => $item->category ?: 'General',
                    'description' => 'Migrated from existing inventory item',
                    'stage' => 'Ready',
                ]
            );

            $item->product_id = $product->id;
            $item->save();
        }

        // 2. Existing warehouses -> Master Worksites
        $warehouses = Warehouse::all();
        if ($warehouses->isNotEmpty()) {
            $category = WorksiteCategory::firstOrCreate(
                ['name' => 'Facilities & Vessels'],
                [
                    'group' => 'Operations',
                    'description' => 'Operating facilities, warehouses, and vessels',
                    'stage' => 'Ready',
                ]
            );

            foreach ($warehouses as $warehouse) {
                $worksite = Worksite::firstOrCreate(
                    ['name' => $warehouse->name],
                    [
                        'worksite_category_id' => $category->id,
                        'group' => 'Operations',
                        'address' => $warehouse->location,
                        'description' => 'Migrated from existing warehouse facility',
                        'stage' => 'Ready',
                    ]
                );

                $warehouse->worksite_id = $worksite->id;
                $warehouse->save();
            }
        }

        // 3. Ensure a default Project exists for reference
        if (Project::count() === 0) {
            Project::create([
                'group' => 'Operations',
                'name' => 'Operational Fleet 2026',
                'progress' => 0,
                'description' => 'Default master reference project for inventory operations',
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_requests', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropForeign(['worksite_id']);
            $table->dropColumn(['project_id', 'worksite_id']);
        });

        Schema::table('warehouses', function (Blueprint $table) {
            $table->dropForeign(['worksite_id']);
            $table->dropColumn(['worksite_id']);
        });

        Schema::table('items', function (Blueprint $table) {
            $table->dropForeign(['product_id']);
            $table->dropForeign(['product_specification_id']);
            $table->dropColumn(['product_id', 'product_specification_id']);
        });
    }
};
