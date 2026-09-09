<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Price;
use App\Models\Product;
use App\Models\ProductSpecification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PriceController extends Controller
{
    /**
     * Display a listing of prices.
     */
    public function index(): Response
    {
        $prices = Price::with([
            'product:id,name',
            'specification:id,name,part_number,measurement_unit',
            'creator:id,name',
            'updater:id,name',
        ])
            ->latest()
            ->get();

        $products = Product::with(['specifications:id,product_id,name,part_number,measurement_unit'])
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('master/prices/index', [
            'prices' => $prices,
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created price in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_specification_id' => ['required', 'exists:product_specifications,id'],
            'group' => ['required', 'string', 'max:255'],
            'vendor' => ['required', 'string', 'max:255'],
            'currency' => ['required', 'string', 'max:10'],
            'price' => ['required', 'numeric', 'min:0'],
            'last_price' => ['nullable', 'numeric', 'min:0'],
            'stage' => ['required', 'string', 'in:Revision,Ready'],
        ]);

        $specification = ProductSpecification::findOrFail($validated['product_specification_id']);
        $validated['product_id'] = $specification->product_id;

        $price = Price::create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Price for '{$specification->name}' ({$price->vendor}) created successfully.",
        ]);

        return back()->with('success', 'Price created successfully.');
    }

    /**
     * Update the specified price in storage.
     */
    public function update(Request $request, Price $price): RedirectResponse
    {
        $validated = $request->validate([
            'product_specification_id' => ['required', 'exists:product_specifications,id'],
            'group' => ['required', 'string', 'max:255'],
            'vendor' => ['required', 'string', 'max:255'],
            'currency' => ['required', 'string', 'max:10'],
            'price' => ['required', 'numeric', 'min:0'],
            'last_price' => ['nullable', 'numeric', 'min:0'],
            'stage' => ['required', 'string', 'in:Revision,Ready'],
        ]);

        $specification = ProductSpecification::findOrFail($validated['product_specification_id']);
        $validated['product_id'] = $specification->product_id;

        $price->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Price updated successfully.',
        ]);

        return back()->with('success', 'Price updated successfully.');
    }

    /**
     * Remove the specified price from storage.
     */
    public function destroy(Price $price): RedirectResponse
    {
        $price->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Price record deleted successfully.',
        ]);

        return back()->with('success', 'Price record deleted successfully.');
    }
}
