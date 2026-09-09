<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\WorksiteCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorksiteCategoryController extends Controller
{
    /**
     * Display a listing of worksite categories.
     */
    public function index(): Response
    {
        $categories = WorksiteCategory::with(['creator:id,name', 'updater:id,name'])
            ->latest()
            ->get();

        return Inertia::render('master/worksites/categories/index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created worksite category in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'group' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'stage' => ['required', 'string', 'in:Revision,Ready'],
        ]);

        $category = WorksiteCategory::create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Worksite category '{$category->name}' created successfully.",
        ]);

        return back()->with('success', "Worksite category '{$category->name}' created successfully.");
    }

    /**
     * Update the specified worksite category in storage.
     */
    public function update(Request $request, WorksiteCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'group' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'stage' => ['required', 'string', 'in:Revision,Ready'],
        ]);

        $category->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Worksite category '{$category->name}' updated successfully.",
        ]);

        return back()->with('success', "Worksite category '{$category->name}' updated successfully.");
    }

    /**
     * Remove the specified worksite category from storage.
     */
    public function destroy(WorksiteCategory $category): RedirectResponse
    {
        if ($category->worksites()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "Cannot delete worksite category '{$category->name}' because worksites are assigned to it.",
            ]);

            return back()->withErrors(['error' => "Cannot delete worksite category '{$category->name}' because worksites are assigned to it."]);
        }

        $name = $category->name;
        $category->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Worksite category '{$name}' deleted successfully.",
        ]);

        return back()->with('success', "Worksite category '{$name}' deleted successfully.");
    }
}
