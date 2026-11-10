<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryMutationController;
use App\Http\Controllers\InventoryRequestController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\Master\PriceController;
use App\Http\Controllers\Master\ProductController;
use App\Http\Controllers\Master\ProductSpecificationController;
use App\Http\Controllers\Master\ProjectController;
use App\Http\Controllers\Master\WorksiteCategoryController;
use App\Http\Controllers\Master\WorksiteController;
use App\Http\Controllers\ProcurementRequestController;
use App\Http\Controllers\SuperAdminUserController;
use App\Http\Controllers\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::patch('dashboard/status', [DashboardController::class, 'updateStatus'])->middleware('admin')->name('dashboard.update-status');
    Route::post('dashboard/message', [DashboardController::class, 'updateMessage'])->middleware('super_admin')->name('dashboard.update-message');
    Route::post('dashboard/reset', [DashboardController::class, 'resetMessages'])->middleware('super_admin')->name('dashboard.reset-messages');

    // Inventory listing for everyone
    Route::get('/inventory', [ItemController::class, 'index'])->name('inventory.index');

    // User request routes
    Route::get('/requests', [InventoryRequestController::class, 'index'])->name('requests.index');
    Route::post('/requests', [InventoryRequestController::class, 'store'])->name('requests.store');
    Route::patch('/requests/{inventoryRequest}/cancel', [InventoryRequestController::class, 'cancel'])->name('requests.cancel');
    Route::delete('/requests/{id}', [InventoryRequestController::class, 'destroy'])->name('requests.destroy');

    Route::get('/procurement-requests', [ProcurementRequestController::class, 'index'])->name('procurement.index');
    Route::get('/procurement-requests/items/search', [ProcurementRequestController::class, 'searchItems'])->name('procurement.items.search');
    Route::post('/procurement-requests', [ProcurementRequestController::class, 'store'])->name('procurement.store');
    Route::patch('/procurement-requests/{procurementRequest}/cancel', [ProcurementRequestController::class, 'cancel'])->name('procurement.cancel');
    Route::post('/procurement-requests/{procurementRequest}/approval-action', [ProcurementRequestController::class, 'actOnApproval'])->name('procurement.approval-action');
    Route::post('/procurement-requests/{procurementRequest}/receiving-exceptions', [ProcurementRequestController::class, 'requestReceivingException'])->name('procurement.receiving-exceptions.store');
    Route::post('/admin/procurement-requests/{procurementRequest}/receive', [ProcurementRequestController::class, 'receive'])->name('admin.procurement.receive');

    // Admin routes
    Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::put('/procurement-requests/{procurementRequest}/approvers', [ProcurementRequestController::class, 'assignApprovers'])->name('procurement.approvers');
        Route::patch('/procurement-requests/{procurementRequest}/approval', [ProcurementRequestController::class, 'approve'])->name('procurement.approve');
        Route::post('/items', [ItemController::class, 'store'])->name('items.store');
        Route::patch('/items/{item}', [ItemController::class, 'update'])->name('items.update');
        Route::patch('/items/{item}/category', [ItemController::class, 'updateCategory'])->name('items.update-category');
        Route::delete('/items/{item}', [ItemController::class, 'destroy'])->name('items.destroy');

        Route::middleware('super_admin')->group(function () {
            Route::get('/requests', [InventoryRequestController::class, 'adminIndex'])->name('requests.index');
            Route::patch('/requests/{inventoryRequest}/status', [InventoryRequestController::class, 'updateStatus'])->name('requests.update-status');
            Route::delete('/requests/{id}', [InventoryRequestController::class, 'destroy'])->name('requests.destroy');
            Route::get('/mutations', [InventoryMutationController::class, 'index'])->name('mutations.index');
        });

        Route::post('/warehouses/assign', [WarehouseController::class, 'assignUser'])->name('warehouses.assign');
        Route::post('/warehouses/remove-user', [WarehouseController::class, 'removeUser'])->name('warehouses.remove-user');
        Route::post('/warehouses', [WarehouseController::class, 'store'])->name('warehouses.store');
        Route::delete('/warehouses/{warehouse}', [WarehouseController::class, 'destroy'])->name('warehouses.destroy');
    });

    // Super Admin routes
    Route::middleware(['super_admin'])->prefix('super-admin')->name('super-admin.')->group(function () {
        Route::post('/procurement-requests/{procurementRequest}/receiving-override', [ProcurementRequestController::class, 'overrideReceiving'])->name('procurement.receiving-override');
        Route::patch('/procurement-receiving-exceptions/{receivingException}', [ProcurementRequestController::class, 'decideReceivingException'])->name('procurement.receiving-exceptions.decide');
        Route::get('/users', [SuperAdminUserController::class, 'index'])->name('users.index');
        Route::patch('/users/{user}/promote', [SuperAdminUserController::class, 'promote'])->name('users.promote');
        Route::patch('/users/{user}/demote', [SuperAdminUserController::class, 'demote'])->name('users.demote');
    });

    // Feature Master routes
    Route::middleware(['verified', 'super_admin'])->prefix('master')->name('master.')->group(function () {
        Route::redirect('/', '/master/worksites/categories')->name('index');
        Route::redirect('worksites', '/master/worksites/categories')->name('worksites.index');
        Route::redirect('projects', '/master/projects/data')->name('projects.index');
        Route::redirect('products', '/master/products/data')->name('products.index');

        // Worksite
        Route::resource('worksites/categories', WorksiteCategoryController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->names('worksites.categories')
            ->parameters(['categories' => 'category']);

        Route::resource('worksites/data', WorksiteController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->names('worksites.data')
            ->parameters(['data' => 'worksite']);

        // Projects
        Route::resource('projects/data', ProjectController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->names('projects.data')
            ->parameters(['data' => 'project']);

        // Products
        Route::resource('products/data', ProductController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->names('products.data')
            ->parameters(['data' => 'product']);

        Route::resource('products/specifications', ProductSpecificationController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->names('products.specifications')
            ->parameters(['specifications' => 'specification']);

        // Prices
        Route::resource('prices', PriceController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->names('prices')
            ->parameters(['prices' => 'price']);
    });
});

require __DIR__.'/settings.php';
