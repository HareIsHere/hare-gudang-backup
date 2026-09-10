<?php

use App\Models\Price;
use App\Models\Product;
use App\Models\ProductSpecification;
use App\Models\Project;
use App\Models\User;
use App\Models\Worksite;
use App\Models\WorksiteCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guest cannot access master routes', function () {
    $this->get(route('master.worksites.categories.index'))->assertRedirect(route('login'));
    $this->get(route('master.worksites.data.index'))->assertRedirect(route('login'));
    $this->get(route('master.projects.data.index'))->assertRedirect(route('login'));
    $this->get(route('master.products.data.index'))->assertRedirect(route('login'));
    $this->get(route('master.products.specifications.index'))->assertRedirect(route('login'));
    $this->get(route('master.prices.index'))->assertRedirect(route('login'));
});

test('user cannot access master routes', function () {
    $user = User::factory()->create(['role' => 'user']);

    $this->actingAs($user)->get(route('master.worksites.categories.index'))->assertForbidden();
    $this->actingAs($user)->get(route('master.worksites.data.index'))->assertForbidden();
    $this->actingAs($user)->get(route('master.projects.data.index'))->assertForbidden();
    $this->actingAs($user)->get(route('master.products.data.index'))->assertForbidden();
    $this->actingAs($user)->get(route('master.products.specifications.index'))->assertForbidden();
    $this->actingAs($user)->get(route('master.prices.index'))->assertForbidden();
    $this->actingAs($user)->get('/master')->assertForbidden();
});

test('admin can access master routes', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->get(route('master.worksites.categories.index'))->assertOk();
    $this->actingAs($admin)->get(route('master.worksites.data.index'))->assertOk();
    $this->actingAs($admin)->get(route('master.projects.data.index'))->assertOk();
    $this->actingAs($admin)->get(route('master.products.data.index'))->assertOk();
    $this->actingAs($admin)->get(route('master.products.specifications.index'))->assertOk();
    $this->actingAs($admin)->get(route('master.prices.index'))->assertOk();
});

test('super_admin can access master routes', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);

    $this->actingAs($superAdmin)->get(route('master.worksites.categories.index'))->assertOk();
    $this->actingAs($superAdmin)->get(route('master.worksites.data.index'))->assertOk();
    $this->actingAs($superAdmin)->get(route('master.projects.data.index'))->assertOk();
    $this->actingAs($superAdmin)->get(route('master.products.data.index'))->assertOk();
    $this->actingAs($superAdmin)->get(route('master.products.specifications.index'))->assertOk();
    $this->actingAs($superAdmin)->get(route('master.prices.index'))->assertOk();
});

test('redirect routes work as expected', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $this->actingAs($user)->get('/master')->assertRedirect('/master/worksites/categories');
    $this->actingAs($user)->get('/master/worksites')->assertRedirect('/master/worksites/categories');
    $this->actingAs($user)->get('/master/projects')->assertRedirect('/master/projects/data');
    $this->actingAs($user)->get('/master/products')->assertRedirect('/master/products/data');
});

test('user can view worksite categories and perform crud with audit fields', function () {
    $user = User::factory()->create(['role' => 'admin', 'name' => 'John Creator']);
    $user2 = User::factory()->create(['role' => 'admin', 'name' => 'Jane Updater']);

    // Index
    $response = $this->actingAs($user)->get(route('master.worksites.categories.index'));
    $response->assertOk();

    // Store
    $storeResponse = $this->actingAs($user)->post(route('master.worksites.categories.store'), [
        'group' => 'Offshore Group',
        'name' => 'Rig Operations',
        'description' => 'Offshore oil rigs',
        'stage' => 'Ready',
    ]);
    $storeResponse->assertRedirect();

    $category = WorksiteCategory::first();
    expect($category)->not->toBeNull()
        ->and($category->group)->toBe('Offshore Group')
        ->and($category->name)->toBe('Rig Operations')
        ->and($category->stage)->toBe('Ready')
        ->and($category->created_by)->toBe($user->id)
        ->and($category->creator->name)->toBe('John Creator');

    // Update
    $updateResponse = $this->actingAs($user2)->put(route('master.worksites.categories.update', $category), [
        'group' => 'Offshore Group Updated',
        'name' => 'Rig Operations Updated',
        'description' => 'Updated desc',
        'stage' => 'Revision',
    ]);
    $updateResponse->assertRedirect();

    $category->refresh();
    expect($category->name)->toBe('Rig Operations Updated')
        ->and($category->stage)->toBe('Revision')
        ->and($category->created_by)->toBe($user->id)
        ->and($category->updated_by)->toBe($user2->id)
        ->and($category->updater->name)->toBe('Jane Updater');

    // Destroy
    $deleteResponse = $this->actingAs($user2)->delete(route('master.worksites.categories.destroy', $category));
    $deleteResponse->assertRedirect();
    $this->assertDatabaseMissing('worksite_categories', ['id' => $category->id]);
});

test('user can view worksite data and perform crud with category relationship', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $category = WorksiteCategory::factory()->create(['name' => 'Mining Site']);

    // Index
    $response = $this->actingAs($user)->get(route('master.worksites.data.index'));
    $response->assertOk();

    // Store
    $storeResponse = $this->actingAs($user)->post(route('master.worksites.data.store'), [
        'worksite_category_id' => $category->id,
        'group' => 'East Region',
        'name' => 'Coal Pit 4',
        'address' => 'South Kalimantan',
        'description' => 'Active open-pit mine',
        'stage' => 'Ready',
    ]);
    $storeResponse->assertRedirect();

    $worksite = Worksite::first();
    expect($worksite)->not->toBeNull()
        ->and($worksite->category->id)->toBe($category->id)
        ->and($worksite->created_by)->toBe($user->id);

    // Update
    $updateResponse = $this->actingAs($user)->put(route('master.worksites.data.update', $worksite), [
        'worksite_category_id' => $category->id,
        'group' => 'East Region Updated',
        'name' => 'Coal Pit 4 Revised',
        'address' => 'South Kalimantan',
        'description' => 'Revised details',
        'stage' => 'Revision',
    ]);
    $updateResponse->assertRedirect();

    $worksite->refresh();
    expect($worksite->name)->toBe('Coal Pit 4 Revised')
        ->and($worksite->stage)->toBe('Revision');

    // Destroy
    $deleteResponse = $this->actingAs($user)->delete(route('master.worksites.data.destroy', $worksite));
    $deleteResponse->assertRedirect();
    $this->assertDatabaseMissing('worksites', ['id' => $worksite->id]);
});

test('user can view projects and perform crud', function () {
    $user = User::factory()->create(['role' => 'admin']);

    // Index
    $response = $this->actingAs($user)->get(route('master.projects.data.index'));
    $response->assertOk();

    // Store
    $storeResponse = $this->actingAs($user)->post(route('master.projects.data.store'), [
        'group' => 'Civil Works',
        'name' => 'Haul Road Paving',
        'progress' => 45,
        'description' => 'Km 0 to Km 20 paving',
    ]);
    $storeResponse->assertRedirect();

    $project = Project::where('name', 'Haul Road Paving')->first();
    expect($project)->not->toBeNull()
        ->and($project->progress)->toBe(45)
        ->and($project->created_by)->toBe($user->id);

    // Update
    $updateResponse = $this->actingAs($user)->put(route('master.projects.data.update', $project), [
        'group' => 'Civil Works',
        'name' => 'Haul Road Paving',
        'progress' => 80,
        'description' => 'Km 0 to Km 20 paving nearly done',
    ]);
    $updateResponse->assertRedirect();

    $project->refresh();
    expect($project->progress)->toBe(80);

    // Destroy
    $deleteResponse = $this->actingAs($user)->delete(route('master.projects.data.destroy', $project));
    $deleteResponse->assertRedirect();
    $this->assertDatabaseMissing('projects', ['id' => $project->id]);
});

test('user can view products, specifications and prices with counts and relationships', function () {
    $user = User::factory()->create(['role' => 'admin']);

    // 1. Create Product
    $storeProd = $this->actingAs($user)->post(route('master.products.data.store'), [
        'group' => 'Machinery',
        'category' => 'Excavator',
        'name' => 'CAT 320D',
        'description' => 'Hydraulic Excavator',
        'stage' => 'Ready',
    ]);
    $storeProd->assertRedirect();

    $product = Product::first();
    expect($product)->not->toBeNull()
        ->and($product->name)->toBe('CAT 320D');

    // Index products
    $prodIndex = $this->actingAs($user)->get(route('master.products.data.index'));
    $prodIndex->assertOk();

    // 2. Create Product Specification
    $storeSpec = $this->actingAs($user)->post(route('master.products.specifications.store'), [
        'product_id' => $product->id,
        'group' => 'Bucket Specs',
        'name' => 'Heavy Duty 1.2 m3 Bucket',
        'part_number' => 'CAT-HD-120',
        'measurement_unit' => 'UNIT',
        'description' => 'Reinforced steel bucket',
        'stage' => 'Ready',
    ]);
    $storeSpec->assertRedirect();

    $spec = ProductSpecification::first();
    expect($spec)->not->toBeNull()
        ->and($spec->product_id)->toBe($product->id)
        ->and($spec->part_number)->toBe('CAT-HD-120');

    // Verify Specification Count on product
    $productWithCount = Product::withCount('specifications')->find($product->id);
    expect($productWithCount->specifications_count)->toBe(1);

    // 3. Create Price
    $storePrice = $this->actingAs($user)->post(route('master.prices.store'), [
        'product_specification_id' => $spec->id,
        'group' => 'Heavy Parts',
        'vendor' => 'Trakindo Utama',
        'currency' => 'IDR',
        'price' => 75000000.00,
        'last_price' => 72000000.00,
        'stage' => 'Ready',
    ]);
    $storePrice->assertRedirect();

    $price = Price::first();
    expect($price)->not->toBeNull()
        ->and((float) $price->price)->toEqual(75000000.00)
        ->and($price->product_id)->toBe($product->id)
        ->and($price->product_specification_id)->toBe($spec->id)
        ->and($price->specification->name)->toBe('Heavy Duty 1.2 m3 Bucket')
        ->and($price->product->name)->toBe('CAT 320D');

    // Verify Price Count on specification
    $specWithCount = ProductSpecification::withCount('prices')->find($spec->id);
    expect($specWithCount->prices_count)->toBe(1);

    // Index prices
    $priceIndex = $this->actingAs($user)->get(route('master.prices.index'));
    $priceIndex->assertOk();

    // Update Price
    $updatePrice = $this->actingAs($user)->put(route('master.prices.update', $price), [
        'product_specification_id' => $spec->id,
        'group' => 'Heavy Parts Updated',
        'vendor' => 'Trakindo Utama',
        'currency' => 'IDR',
        'price' => 78000000.00,
        'last_price' => 75000000.00,
        'stage' => 'Revision',
    ]);
    $updatePrice->assertRedirect();

    $price->refresh();
    expect((float) $price->price)->toEqual(78000000.00)
        ->and($price->stage)->toBe('Revision');

    // Destroy Price
    $delPrice = $this->actingAs($user)->delete(route('master.prices.destroy', $price));
    $delPrice->assertRedirect();
    $this->assertDatabaseMissing('prices', ['id' => $price->id]);
});
