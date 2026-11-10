<?php

namespace App\Http\Controllers;

use App\Http\Requests\FilterWarehouseRequest;
use App\Models\InventoryMutation;
use App\Models\Warehouse;
use Inertia\Inertia;
use Inertia\Response;

class InventoryMutationController extends Controller
{
    /**
     * Display a listing of inventory mutations (Admin only).
     */
    public function index(FilterWarehouseRequest $request): Response
    {
        return Inertia::render('admin/mutations/index', [
            'mutations' => InventoryMutation::with(['item', 'fromWarehouse', 'toWarehouse', 'user'])
                ->when($request->warehouseId() !== null, fn ($query) => $query->where(fn ($query) => $query
                    ->where('from_warehouse_id', $request->warehouseId())
                    ->orWhere('to_warehouse_id', $request->warehouseId())))
                ->when(! auth()->user()->isSuperAdmin(), fn ($query) => $query
                    ->where(fn ($warehouses) => $warehouses->whereNull('from_warehouse_id')->orWhereIn('from_warehouse_id', auth()->user()->warehouses()->select('warehouses.id')))
                    ->where(fn ($warehouses) => $warehouses->whereNull('to_warehouse_id')->orWhereIn('to_warehouse_id', auth()->user()->warehouses()->select('warehouses.id')))
                    ->where(fn ($warehouses) => $warehouses->whereNotNull('from_warehouse_id')->orWhereNotNull('to_warehouse_id')))
                ->latest()
                ->get(),
            'warehouses' => Warehouse::orderBy('name')->get(),
            'filters' => ['warehouse_id' => $request->warehouseId()],
        ]);
    }
}
