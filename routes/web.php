<?php

use App\Http\Controllers\InventoryMutationController;
use App\Http\Controllers\InventoryRequestController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Inventory listing for everyone
    Route::get('/inventory', [ItemController::class, 'index'])->name('inventory.index');
    Route::patch('/items/{item}/category', [ItemController::class, 'updateCategory'])->name('items.update-category');

    // User request routes
    Route::get('/requests', [InventoryRequestController::class, 'index'])->name('requests.index');
    Route::post('/requests', [InventoryRequestController::class, 'store'])->name('requests.store');
    Route::patch('/requests/{inventoryRequest}/cancel', [InventoryRequestController::class, 'cancel'])->name('requests.cancel');
    Route::delete('/requests/{id}', [InventoryRequestController::class, 'destroy'])->name('requests.destroy');

    // Admin routes
    Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::post('/items', [ItemController::class, 'store'])->name('items.store');
        Route::patch('/items/{item}', [ItemController::class, 'update'])->name('items.update');
        Route::delete('/items/{item}', [ItemController::class, 'destroy'])->name('items.destroy');

        Route::get('/requests', [InventoryRequestController::class, 'adminIndex'])->name('requests.index');
        Route::patch('/requests/{inventoryRequest}/status', [InventoryRequestController::class, 'updateStatus'])->name('requests.update-status');
        Route::delete('/requests/{id}', [InventoryRequestController::class, 'destroy'])->name('requests.destroy');

        Route::get('/mutations', [InventoryMutationController::class, 'index'])->name('mutations.index');

        Route::post('/warehouses/assign', [WarehouseController::class, 'assignUser'])->name('warehouses.assign');
        Route::post('/warehouses/remove-user', [WarehouseController::class, 'removeUser'])->name('warehouses.remove-user');
        Route::post('/warehouses', [WarehouseController::class, 'store'])->name('warehouses.store');
        Route::delete('/warehouses/{warehouse}', [WarehouseController::class, 'destroy'])->name('warehouses.destroy');
    });
});

require __DIR__.'/settings.php';
