<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Display a listing of projects.
     */
    public function index(): Response
    {
        $projects = Project::with(['creator:id,name', 'updater:id,name'])
            ->latest()
            ->get();

        return Inertia::render('master/projects/data/index', [
            'projects' => $projects,
        ]);
    }

    /**
     * Store a newly created project in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'group' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'progress' => ['required', 'integer', 'min:0', 'max:100'],
            'description' => ['nullable', 'string'],
        ]);

        $project = Project::create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Project '{$project->name}' created successfully.",
        ]);

        return back()->with('success', "Project '{$project->name}' created successfully.");
    }

    /**
     * Update the specified project in storage.
     */
    public function update(Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'group' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'progress' => ['required', 'integer', 'min:0', 'max:100'],
            'description' => ['nullable', 'string'],
        ]);

        $project->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Project '{$project->name}' updated successfully.",
        ]);

        return back()->with('success', "Project '{$project->name}' updated successfully.");
    }

    /**
     * Remove the specified project from storage.
     */
    public function destroy(Project $project): RedirectResponse
    {
        if ($project->inventoryRequests()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "Cannot delete project '{$project->name}' because inventory requests are linked to it.",
            ]);

            return back()->withErrors(['error' => "Cannot delete project '{$project->name}' because inventory requests are linked to it."]);
        }

        $name = $project->name;
        $project->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Project '{$name}' deleted successfully.",
        ]);

        return back()->with('success', "Project '{$name}' deleted successfully.");
    }
}
