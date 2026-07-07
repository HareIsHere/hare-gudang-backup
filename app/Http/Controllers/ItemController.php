<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\Item;
use App\Models\Warehouse;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function __construct(protected InventoryService $inventoryService)
    {
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $user = auth()->user();
        
        // If regular user, only show items and stock for their assigned warehouses
        if (!$user->isAdmin()) {
            $warehouseIds = $user->warehouses->pluck('id');
            $items = Item::whereHas('warehouses', function ($query) use ($warehouseIds) {
                $query->whereIn('warehouses.id', $warehouseIds);
            })->with(['inventories' => function ($query) use ($warehouseIds) {
                $query->whereIn('warehouse_id', $warehouseIds);
            }, 'inventories.warehouse'])->get();
        } else {
            $items = Item::with('inventories.warehouse')->get();
        }

        return Inertia::render('inventory/index', [
            'items' => $items,
            'warehouses' => $user->isAdmin() ? Warehouse::with('users')->get() : $user->warehouses,
            'users' => $user->isAdmin() ? User::where('role', 'user')->get() : [],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreItemRequest $request)
    {
        $item = Item::create([
            'item_name' => $request->item_name,
        ]);

        if ($request->warehouse_id && $request->initial_quantity > 0) {
            $warehouse = Warehouse::findOrFail($request->warehouse_id);
            $this->inventoryService->recordMutation(
                item: $item,
                quantity: $request->initial_quantity,
                type: 'IN',
                user: auth()->user(),
                toWarehouse: $warehouse,
                referenceType: 'Initial Stock'
            );
        }

        return back()->with('success', 'Item created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateItemRequest $request, Item $item)
    {
        $item->update([
            'item_name' => $request->item_name,
        ]);

        if ($request->warehouse_id && $request->quantity_adjustment != 0) {
            $warehouse = Warehouse::findOrFail($request->warehouse_id);
            $adjustment = (int) $request->quantity_adjustment;
            $type = $adjustment > 0 ? 'IN' : 'OUT';
            $quantity = abs($adjustment);

            try {
                $this->inventoryService->recordMutation(
                    item: $item,
                    quantity: $quantity,
                    type: $type,
                    user: auth()->user(),
                    fromWarehouse: $type === 'OUT' ? $warehouse : null,
                    toWarehouse: $type === 'IN' ? $warehouse : null,
                    referenceType: 'Manual Adjustment'
                );
            } catch (\Exception $e) {
                return back()->withErrors(['quantity_adjustment' => $e->getMessage()]);
            }
        }

        return back()->with('success', 'Item updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Item $item)
    {
        $item->delete();

        return back()->with('success', 'Item deleted successfully.');
    }
}
