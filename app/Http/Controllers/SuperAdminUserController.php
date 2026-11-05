<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SuperAdminUserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(): Response
    {
        $users = User::where('id', '!=', auth()->id())
            ->orderBy('name')
            ->get();

        return Inertia::render('super-admin/users/index', [
            'users' => $users,
        ]);
    }

    /**
     * Promote a regular user to an operational role.
     */
    public function promote(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()?->isSuperAdmin() && $request->user()->id !== $user->id && ! $user->isSuperAdmin(), 403);
        $validated = $request->validate(['role' => ['sometimes', 'required', 'in:admin,warehouse_manager']]);
        $role = $validated['role'] ?? 'admin';
        if ($user->role === 'user') {
            $user->update(['role' => $role]);
            $roleName = $role === 'admin' ? 'Admin' : 'Warehouse Manager';
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => "Successfully promoted {$user->name} to {$roleName}.",
            ]);
        }

        return back();
    }

    /**
     * Demote an admin to a regular user.
     */
    public function demote(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->user()?->isSuperAdmin() && $request->user()->id !== $user->id && ! $user->isSuperAdmin(), 403);
        if (in_array($user->role, ['admin', 'warehouse_manager'], true)) {
            $user->update(['role' => 'user']);
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => "Successfully demoted {$user->name} to User.",
            ]);
        }

        return back();
    }
}
