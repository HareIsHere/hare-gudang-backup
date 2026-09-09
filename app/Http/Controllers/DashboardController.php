<?php

namespace App\Http\Controllers;

use App\Models\DashboardPipeline;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard page.
     */
    public function index(): Response
    {
        $pipelines = DashboardPipeline::all()->keyBy('activity_id');

        return Inertia::render('dashboard', [
            'pipelines' => $pipelines,
        ]);
    }

    /**
     * Update the status of a dashboard pipeline.
     */
    public function updateStatus(Request $request): RedirectResponse
    {
        if (! $request->user()?->isAdmin()) {
            abort(403, 'Unauthorized. Only admins and superadmins can update pipeline status.');
        }

        $request->validate([
            'activity_id' => ['required', 'integer'],
            'status' => ['required', 'string', 'in:Idle,Working'],
        ]);

        DashboardPipeline::updateOrCreate(
            ['activity_id' => $request->activity_id],
            ['status' => $request->status]
        );

        return redirect()->back();
    }

    /**
     * Update the custom message of a dashboard pipeline.
     */
    public function updateMessage(Request $request): RedirectResponse
    {
        if (! $request->user()?->isSuperAdmin()) {
            abort(403, 'Unauthorized. Only superadmins can edit status descriptions.');
        }

        $request->validate([
            'activity_id' => ['required', 'integer'],
            'status' => ['required', 'string', 'in:Idle,Working'],
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $pipeline = DashboardPipeline::firstOrCreate(
            ['activity_id' => $request->activity_id],
            ['status' => $request->status, 'custom_messages' => []]
        );

        $messages = $pipeline->custom_messages ?? [];
        $messages[$request->status] = $request->message;

        $pipeline->update([
            'custom_messages' => $messages,
        ]);

        return redirect()->back();
    }

    /**
     * Reset all custom messages back to system defaults.
     */
    public function resetMessages(Request $request): RedirectResponse
    {
        if (! $request->user()?->isSuperAdmin()) {
            abort(403, 'Unauthorized.');
        }

        DashboardPipeline::query()->update(['custom_messages' => []]);

        return redirect()->back();
    }
}
