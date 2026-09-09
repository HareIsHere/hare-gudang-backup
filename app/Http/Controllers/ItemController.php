<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\Item;
use App\Models\Product;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\Worksite;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function __construct(protected InventoryService $inventoryService) {}

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $user = auth()->user();

        // If regular user, only show items and stock for their assigned warehouses
        if (! $user->isAdmin()) {
            $warehouseIds = $user->warehouses->pluck('id');
            $items = Item::whereHas('warehouses', function ($query) use ($warehouseIds) {
                $query->whereIn('warehouses.id', $warehouseIds);
            })->with(['product', 'specification', 'inventories' => function ($query) use ($warehouseIds) {
                $query->whereIn('warehouse_id', $warehouseIds);
            }, 'inventories.warehouse.worksite'])->get();
        } else {
            $items = Item::with(['product', 'specification', 'inventories.warehouse.worksite'])->get();
        }

        $categories = Product::whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->pluck('category')
            ->merge(
                Item::whereNotNull('category')
                    ->where('category', '!=', '')
                    ->distinct()
                    ->pluck('category')
            )
            ->unique()
            ->sort()
            ->values();

        return Inertia::render('inventory/index', [
            'items' => $items,
            'warehouses' => $user->isAdmin() ? Warehouse::with(['users', 'worksite'])->get() : $user->warehouses()->with('worksite')->get(),
            'users' => $user->isAdmin() ? User::where('role', 'user')->get() : [],
            'categories' => $categories,
            'masterProducts' => Product::with('specifications')->where('stage', '!=', 'Drop')->orderBy('name')->get(),
            'masterWorksites' => Worksite::where('stage', '!=', 'Drop')->orderBy('name')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreItemRequest $request)
    {
        $productId = $request->product_id;
        $specificationId = $request->product_specification_id;
        $itemName = $request->item_name;
        $category = $request->category;

        if ($productId) {
            $product = Product::findOrFail($productId);
            $itemName = $itemName ?: $product->name;
            $category = $category ?: $product->category;
        } elseif ($itemName) {
            $product = Product::firstOrCreate(
                ['name' => $itemName],
                [
                    'group' => 'Inventory',
                    'category' => $category ?: 'General',
                    'stage' => 'Ready',
                ]
            );
            $productId = $product->id;
            $category = $category ?: $product->category;
        }

        $item = Item::create([
            'product_id' => $productId,
            'product_specification_id' => $specificationId,
            'item_name' => $itemName,
            'category' => $category,
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
        $productId = $request->has('product_id') ? $request->product_id : $item->product_id;
        $specificationId = $request->has('product_specification_id') ? $request->product_specification_id : $item->product_specification_id;
        $itemName = $request->item_name ?: $item->item_name;
        $category = $request->category ?: $item->category;

        if ($request->filled('product_id')) {
            $product = Product::find($request->product_id);
            if ($product) {
                $itemName = $request->item_name ?: $product->name;
                $category = $request->category ?: $product->category;
            }
        }

        $item->update([
            'product_id' => $productId,
            'product_specification_id' => $specificationId,
            'item_name' => $itemName,
            'category' => $category,
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
     * Update only the category of an item.
     */
    public function updateCategory(Request $request, Item $item)
    {
        $request->validate([
            'category' => ['nullable', 'string', 'max:255'],
        ]);

        $item->update([
            'category' => $request->category,
        ]);

        return back()->with('success', 'Item category updated successfully.');
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
