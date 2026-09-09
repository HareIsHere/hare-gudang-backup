<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(): Response
    {
        $products = Product::with(['creator:id,name', 'updater:id,name'])
            ->withCount('specifications')
            ->latest()
            ->get();

        return Inertia::render('master/products/data/index', [
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'group' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'stage' => ['required', 'string', 'in:Revision,Ready'],
        ]);

        $product = Product::create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Product '{$product->name}' created successfully.",
        ]);

        return back()->with('success', "Product '{$product->name}' created successfully.");
    }

    /**
     * Update the specified product in storage.
     */
    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'group' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'stage' => ['required', 'string', 'in:Revision,Ready'],
        ]);

        $product->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Product '{$product->name}' updated successfully.",
        ]);

        return back()->with('success', "Product '{$product->name}' updated successfully.");
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(Product $product): RedirectResponse
    {
        if ($product->items()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "Cannot delete product '{$product->name}' because it is linked to inventory items.",
            ]);

            return back()->withErrors(['error' => "Cannot delete product '{$product->name}' because it is linked to inventory items."]);
        }

        $name = $product->name;
        $product->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Product '{$name}' deleted successfully.",
        ]);

        return back()->with('success', "Product '{$name}' deleted successfully.");
    }
}
