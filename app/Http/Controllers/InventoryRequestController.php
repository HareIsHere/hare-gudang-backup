<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInventoryRequest;
use App\Http\Requests\UpdateInventoryRequestStatus;
use App\Models\InventoryRequest;
use App\Models\Item;
use App\Models\Warehouse;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryRequestController extends Controller
{
    public function __construct(protected InventoryService $inventoryService)
    {
    }

    /**
     * Display a listing of the requests for the authenticated user.
     */
    public function index(): Response
    {
        $user = auth()->user();
        
        // Users can only see requests for warehouses they have access to
        $warehouseIds = $user->isAdmin() 
            ? Warehouse::pluck('id') 
            : $user->warehouses->pluck('id');

        // Filter items: Only show items that have stock/exist (quantity > 0) in the user's warehouses
        $items = Item::whereHas('inventories', function ($query) use ($warehouseIds) {
            $query->whereIn('warehouse_id', $warehouseIds)
                  ->where('quantity', '>', 0);
        })->with(['inventories' => function ($query) use ($warehouseIds) {
            $query->whereIn('warehouse_id', $warehouseIds)
                  ->where('quantity', '>', 0);
        }, 'inventories.warehouse'])->get();

        return Inertia::render('requests/index', [
            'requests' => InventoryRequest::with(['item', 'warehouse'])
                ->where('user_id', $user->id)
                ->whereIn('warehouse_id', $warehouseIds)
                ->latest()
                ->get(),
            'items' => $items,
            'warehouses' => $user->isAdmin() ? Warehouse::all() : $user->warehouses,
        ]);
    }

    /**
     * Display a listing of all requests for Admin.
     */
    public function adminIndex(): Response
    {
        return Inertia::render('admin/requests/index', [
            'requests' => InventoryRequest::with(['item', 'user', 'warehouse'])
                ->latest()
                ->get(),
        ]);
    }

    /**
     * Store a newly created request in storage.
     */
    public function store(StoreInventoryRequest $request)
    {
        InventoryRequest::create([
            'user_id' => auth()->id(),
            'item_id' => $request->item_id,
            'warehouse_id' => $request->warehouse_id,
            'qty' => $request->qty,
            'status' => 'requested',
            'type' => 'OUT',
        ]);

        return back()->with('success', 'Request submitted successfully.');
    }

    /**
     * Update the status of the request (Admin only).
     */
    public function updateStatus(UpdateInventoryRequestStatus $request, InventoryRequest $inventoryRequest)
    {
        $oldStatus = $inventoryRequest->status;
        $newStatus = $request->status;

        if ($oldStatus === 'canceled') {
             return back()->withErrors(['status' => 'Cannot change status of a canceled request.']);
        }

        if ($oldStatus === 'finished' && !in_array($newStatus, ['onReview', 'canceled'])) {
             return back()->withErrors(['status' => 'Finished requests can only be transitioned to onReview or canceled.']);
        }

        if ($newStatus === 'finished') {
            try {
                $this->inventoryService->recordMutation(
                    item: $inventoryRequest->item,
                    quantity: $inventoryRequest->qty,
                    type: 'REQUEST',
                    user: $inventoryRequest->user, // Log the requester, not the admin
                    fromWarehouse: $inventoryRequest->type === 'OUT' ? $inventoryRequest->warehouse : null,
                    toWarehouse: $inventoryRequest->type === 'IN' ? $inventoryRequest->warehouse : null,
                    referenceType: 'InventoryRequest',
                    referenceId: $inventoryRequest->id
                );
            } catch (\Exception $e) {
                return back()->withErrors(['status' => $e->getMessage()]);
            }
        }

        if ($oldStatus === 'finished' && ($newStatus === 'onReview' || $newStatus === 'canceled')) {
            try {
                // If it was OUT (stock was decremented), revert it with IN to add stock back
                // If it was IN (stock was incremented), revert it with OUT to remove stock
                $revertType = $inventoryRequest->type === 'OUT' ? 'IN' : 'OUT';
                $referenceType = $newStatus === 'canceled' ? 'Request Cancellation' : 'Request Reversion';

                $this->inventoryService->recordMutation(
                    item: $inventoryRequest->item,
                    quantity: $inventoryRequest->qty,
                    type: $revertType,
                    user: auth()->user(), // Admin doing the cancellation/reversion
                    fromWarehouse: $revertType === 'OUT' ? $inventoryRequest->warehouse : null,
                    toWarehouse: $revertType === 'IN' ? $inventoryRequest->warehouse : null,
                    referenceType: $referenceType,
                    referenceId: $inventoryRequest->id
                );
            } catch (\Exception $e) {
                return back()->withErrors(['status' => 'Failed to revert stock: ' . $e->getMessage()]);
            }
        }

        $inventoryRequest->update([
            'status' => $newStatus,
            'reason' => $newStatus === 'canceled' ? $request->reason : null,
        ]);

        return back()->with('success', 'Request status updated.');
    }

    /**
     * Cancel a request (User only).
     */
    public function cancel(InventoryRequest $inventoryRequest)
    {
        if ($inventoryRequest->user_id !== auth()->id()) {
            abort(403);
        }

        if ($inventoryRequest->status !== 'requested' && $inventoryRequest->status !== 'onReview') {
            return back()->withErrors(['status' => 'You can only cancel requests that are not finished or already canceled.']);
        }

        $inventoryRequest->update(['status' => 'canceled']);

        return back()->with('success', 'Request canceled successfully.');
    }

    /**
     * Delete a request record permanently.
     */
    public function destroy(Request $request, $id)
    {
        $inventoryRequest = InventoryRequest::findOrFail($id);
        $user = auth()->user();

        // Security check: Only Admin or the owner can delete
        if (!$user->isAdmin() && $inventoryRequest->user_id !== $user->id) {
            abort(403, 'Unauthorized to delete this record.');
        }

        // Only canceled requests can be deleted
        if ($inventoryRequest->status !== 'canceled') {
            abort(400, 'Only canceled requests can be deleted.');
        }

        $inventoryRequest->delete();

        \Inertia\Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Request history deleted successfully.',
        ]);

        return back()->with('success', 'Request record deleted permanently from database.');
    }
}
