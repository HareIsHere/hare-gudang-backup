<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarehouseController extends Controller
{
    /**
     * Store a newly created warehouse in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:warehouses,name',
            'location' => 'nullable|string|max:255',
        ]);

        $warehouse = Warehouse::create([
            'name' => $request->name,
            'location' => $request->location,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Warehouse '{$warehouse->name}' created successfully.",
        ]);

        return back()->with('success', "Warehouse {$warehouse->name} created successfully.");
    }

    /**
     * Remove the specified warehouse from storage.
     */
    public function destroy(Warehouse $warehouse)
    {
        $name = $warehouse->name;
        $warehouse->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Warehouse '{$name}' deleted successfully.",
        ]);

        return back()->with('success', "Warehouse {$name} deleted successfully.");
    }

    /**
     * Assign a user to a warehouse.
     */
    public function assignUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'warehouse_id' => 'required|exists:warehouses,id',
        ]);

        $user = User::findOrFail($request->user_id);
        $warehouse = Warehouse::findOrFail($request->warehouse_id);

        $user->warehouses()->syncWithoutDetaching([$warehouse->id]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "User assigned to {$warehouse->name} successfully.",
        ]);

        return back()->with('success', "User assigned to {$warehouse->name} successfully.");
    }

    /**
     * Remove a user from a warehouse.
     */
    public function removeUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'warehouse_id' => 'required|exists:warehouses,id',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->warehouses()->detach($request->warehouse_id);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "User access removed.",
        ]);

        return back()->with('success', "User access removed.");
    }
}
