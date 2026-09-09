<?php

use App\Models\Inventory;
use App\Models\InventoryRequest;
use App\Models\Item;
use App\Models\Product;
use App\Models\ProductSpecification;
use App\Models\Project;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\Worksite;
use App\Models\WorksiteCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('master data appears in existing feature forms (inventory, requests, admin requests)', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'user']);

    $category = WorksiteCategory::factory()->create(['name' => 'Vessels']);
    $worksite = Worksite::factory()->create([
        'worksite_category_id' => $category->id,
        'name' => 'Rimau Star',
    ]);
    $warehouse = Warehouse::factory()->create([
        'name' => 'Rimau Star Warehouse',
        'worksite_id' => $worksite->id,
    ]);
    $user->warehouses()->attach($warehouse->id);

    $product = Product::factory()->create(['name' => 'Fuel Filter', 'category' => 'Filter']);
    $spec = ProductSpecification::factory()->create(['product_id' => $product->id, 'name' => 'OEM Standard']);
    $project = Project::factory()->create(['name' => 'Vessel Overhaul 2026']);

    // Inventory page returns masterProducts and masterWorksites
    $invResponse = $this->actingAs($admin)->get(route('inventory.index'));
    $invResponse->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('inventory/index')
            ->has('masterProducts')
            ->has('masterWorksites')
            ->where('masterProducts', fn ($prods) => collect($prods)->contains(fn ($p) => ($p['name'] ?? null) === 'Fuel Filter'))
            ->where('masterWorksites', fn ($sites) => collect($sites)->contains(fn ($w) => ($w['name'] ?? null) === 'Rimau Star'))
        );

    // Requests page returns projects and worksites
    $reqResponse = $this->actingAs($user)->get(route('requests.index'));
    $reqResponse->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('requests/index')
            ->has('projects')
            ->has('worksites')
            ->where('projects', fn ($projects) => collect($projects)->contains(fn ($p) => ($p['name'] ?? null) === 'Vessel Overhaul 2026'))
            ->where('worksites', fn ($worksites) => collect($worksites)->contains(fn ($w) => ($w['name'] ?? null) === 'Rimau Star'))
        );

    // Admin requests page returns projects and worksites
    $adminReqResponse = $this->actingAs($admin)->get(route('admin.requests.index'));
    $adminReqResponse->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/requests/index')
            ->has('projects')
            ->has('worksites')
        );
});

test('existing feature creates inventory item from master product and specification', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $warehouse = Warehouse::factory()->create();

    $product = Product::factory()->create([
        'name' => 'Hydraulic Pump',
        'category' => 'Machinery',
    ]);
    $spec = ProductSpecification::factory()->create([
        'product_id' => $product->id,
        'name' => 'HP-200 Bar',
    ]);

    // Admin creates an item referencing Feature Master
    $response = $this->actingAs($admin)->post(route('admin.items.store'), [
        'product_id' => $product->id,
        'product_specification_id' => $spec->id,
        'warehouse_id' => $warehouse->id,
        'initial_quantity' => 10,
    ]);
    $response->assertRedirect();

    $item = Item::where('product_id', $product->id)->first();
    expect($item)->not->toBeNull()
        ->and($item->item_name)->toBe('Hydraulic Pump')
        ->and($item->category)->toBe('Machinery')
        ->and($item->product_specification_id)->toBe($spec->id)
        ->and($item->product->id)->toBe($product->id)
        ->and($item->specification->id)->toBe($spec->id);

    // Check inventory stock created
    $inv = Inventory::where('item_id', $item->item_id)->where('warehouse_id', $warehouse->id)->first();
    expect($inv)->not->toBeNull()
        ->and($inv->quantity)->toBe(10);
});

test('creating item with name automatically links to or reuses master product without duplicates', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $existingMaster = Product::factory()->create([
        'name' => 'Existing Master Engine',
        'category' => 'Powertrain',
    ]);

    // Store item with matching name
    $this->actingAs($admin)->post(route('admin.items.store'), [
        'item_name' => 'Existing Master Engine',
        'category' => 'Powertrain',
    ]);

    expect(Product::where('name', 'Existing Master Engine')->count())->toBe(1);

    $item = Item::where('item_name', 'Existing Master Engine')->first();
    expect($item->product_id)->toBe($existingMaster->id);
});

test('inventory request can reference project and worksite master data', function () {
    $user = User::factory()->create(['role' => 'user']);
    $warehouse = Warehouse::factory()->create();
    $user->warehouses()->attach($warehouse->id);

    $item = Item::factory()->create(['item_name' => 'Spare Valve']);
    Inventory::factory()->create([
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'quantity' => 50,
    ]);

    $project = Project::factory()->create(['name' => 'Dry Dock 2026']);
    $worksite = Worksite::factory()->create(['name' => 'Shipyard Banjarmasin']);

    $response = $this->actingAs($user)->post(route('requests.store'), [
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'project_id' => $project->id,
        'worksite_id' => $worksite->id,
        'qty' => 5,
    ]);
    $response->assertRedirect();

    $request = InventoryRequest::latest()->first();
    expect($request)->not->toBeNull()
        ->and($request->project_id)->toBe($project->id)
        ->and($request->worksite_id)->toBe($worksite->id)
        ->and($request->project->name)->toBe('Dry Dock 2026')
        ->and($request->worksite->name)->toBe('Shipyard Banjarmasin');
});

test('warehouse can reference master worksite', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $worksite = Worksite::factory()->create([
        'name' => 'Rimau Pioneer Site',
        'address' => 'Banjarmasin Port Pier 3',
    ]);

    $response = $this->actingAs($admin)->post(route('admin.warehouses.store'), [
        'worksite_id' => $worksite->id,
        'name' => 'Pioneer Central Storage',
    ]);
    $response->assertRedirect();

    $warehouse = Warehouse::where('name', 'Pioneer Central Storage')->first();
    expect($warehouse)->not->toBeNull()
        ->and($warehouse->worksite_id)->toBe($worksite->id)
        ->and($warehouse->worksite->name)->toBe('Rimau Pioneer Site');
});

test('referential integrity: cannot delete master records when existing feature dependencies exist', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $category = WorksiteCategory::factory()->create(['name' => 'Mining Facilities']);
    $worksite = Worksite::factory()->create([
        'worksite_category_id' => $category->id,
        'name' => 'Coal Pit 1',
    ]);
    $warehouse = Warehouse::factory()->create([
        'name' => 'Pit 1 Depot',
        'worksite_id' => $worksite->id,
    ]);

    $product = Product::factory()->create(['name' => 'Heavy Belt']);
    $spec = ProductSpecification::factory()->create([
        'product_id' => $product->id,
        'name' => 'Belt 100m',
    ]);
    $item = Item::create([
        'product_id' => $product->id,
        'product_specification_id' => $spec->id,
        'item_name' => 'Heavy Belt',
        'category' => 'Conveyor',
    ]);

    $project = Project::factory()->create(['name' => 'Pit Expansion']);
    InventoryRequest::create([
        'user_id' => $admin->id,
        'item_id' => $item->item_id,
        'warehouse_id' => $warehouse->id,
        'project_id' => $project->id,
        'worksite_id' => $worksite->id,
        'qty' => 1,
        'status' => 'requested',
    ]);

    // 1. Prevent deleting Product when referenced by Item
    $delProd = $this->actingAs($admin)->delete(route('master.products.data.destroy', $product));
    $delProd->assertSessionHasErrors('error');
    expect(Product::where('id', $product->id)->exists())->toBeTrue();

    // 2. Prevent deleting ProductSpecification when referenced by Item
    $delSpec = $this->actingAs($admin)->delete(route('master.products.specifications.destroy', $spec));
    $delSpec->assertSessionHasErrors('error');
    expect(ProductSpecification::where('id', $spec->id)->exists())->toBeTrue();

    // 3. Prevent deleting Worksite when referenced by Warehouse or Request
    $delWorksite = $this->actingAs($admin)->delete(route('master.worksites.data.destroy', $worksite));
    $delWorksite->assertSessionHasErrors('error');
    expect(Worksite::where('id', $worksite->id)->exists())->toBeTrue();

    // 4. Prevent deleting WorksiteCategory when referenced by Worksite
    $delCat = $this->actingAs($admin)->delete(route('master.worksites.categories.destroy', $category));
    $delCat->assertSessionHasErrors('error');
    expect(WorksiteCategory::where('id', $category->id)->exists())->toBeTrue();

    // 5. Prevent deleting Project when referenced by InventoryRequest
    $delProj = $this->actingAs($admin)->delete(route('master.projects.data.destroy', $project));
    $delProj->assertSessionHasErrors('error');
    expect(Project::where('id', $project->id)->exists())->toBeTrue();
});
