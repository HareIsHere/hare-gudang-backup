<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Worksite;
use App\Models\WorksiteCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorksiteController extends Controller
{
    /**
     * Display a listing of worksites.
     */
    public function index(): Response
    {
        $worksites = Worksite::with(['category:id,name', 'creator:id,name', 'updater:id,name'])
            ->latest()
            ->get();

        $categories = WorksiteCategory::orderBy('name')->get(['id', 'name', 'group']);

        return Inertia::render('master/worksites/data/index', [
            'worksites' => $worksites,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created worksite in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'worksite_category_id' => ['nullable', 'exists:worksite_categories,id'],
            'group' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'stage' => ['required', 'string', 'in:Revision,Ready'],
        ]);

        $worksite = Worksite::create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Worksite '{$worksite->name}' created successfully.",
        ]);

        return back()->with('success', "Worksite '{$worksite->name}' created successfully.");
    }

    /**
     * Update the specified worksite in storage.
     */
    public function update(Request $request, Worksite $worksite): RedirectResponse
    {
        $validated = $request->validate([
            'worksite_category_id' => ['nullable', 'exists:worksite_categories,id'],
            'group' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'stage' => ['required', 'string', 'in:Revision,Ready'],
        ]);

        $worksite->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Worksite '{$worksite->name}' updated successfully.",
        ]);

        return back()->with('success', "Worksite '{$worksite->name}' updated successfully.");
    }

    /**
     * Remove the specified worksite from storage.
     */
    public function destroy(Worksite $worksite): RedirectResponse
    {
        if ($worksite->warehouses()->exists() || $worksite->inventoryRequests()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "Cannot delete worksite '{$worksite->name}' because it is linked to warehouses or inventory requests.",
            ]);

            return back()->withErrors(['error' => "Cannot delete worksite '{$worksite->name}' because it is linked to warehouses or inventory requests."]);
        }

        $name = $worksite->name;
        $worksite->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Worksite '{$name}' deleted successfully.",
        ]);

        return back()->with('success', "Worksite '{$name}' deleted successfully.");
    }
}
