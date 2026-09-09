<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductSpecification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductSpecificationController extends Controller
{
    /**
     * Display a listing of product specifications.
     */
    public function index(): Response
    {
        $specifications = ProductSpecification::with(['product:id,name', 'creator:id,name', 'updater:id,name'])
            ->withCount('prices')
            ->latest()
            ->get();

        $products = Product::orderBy('name')->get(['id', 'name', 'group']);

        return Inertia::render('master/products/specifications/index', [
            'specifications' => $specifications,
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created product specification in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'group' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'part_number' => ['nullable', 'string', 'max:255'],
            'measurement_unit' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'stage' => ['required', 'string', 'in:Revision,Ready'],
        ]);

        $specification = ProductSpecification::create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Specification '{$specification->name}' created successfully.",
        ]);

        return back()->with('success', "Specification '{$specification->name}' created successfully.");
    }

    /**
     * Update the specified product specification in storage.
     */
    public function update(Request $request, ProductSpecification $specification): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'group' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'part_number' => ['nullable', 'string', 'max:255'],
            'measurement_unit' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'stage' => ['required', 'string', 'in:Revision,Ready'],
        ]);

        $specification->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Specification '{$specification->name}' updated successfully.",
        ]);

        return back()->with('success', "Specification '{$specification->name}' updated successfully.");
    }

    /**
     * Remove the specified product specification from storage.
     */
    public function destroy(ProductSpecification $specification): RedirectResponse
    {
        if ($specification->items()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "Cannot delete specification '{$specification->name}' because it is linked to inventory items.",
            ]);

            return back()->withErrors(['error' => "Cannot delete specification '{$specification->name}' because it is linked to inventory items."]);
        }

        $name = $specification->name;
        $specification->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Specification '{$name}' deleted successfully.",
        ]);

        return back()->with('success', "Specification '{$name}' deleted successfully.");
    }
}
