<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
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
     * Promote a user to admin.
     */
    public function promote(User $user): RedirectResponse
    {
        if ($user->role === 'user') {
            $user->update(['role' => 'admin']);
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => "Successfully promoted {$user->name} to Admin.",
            ]);
        }

        return back();
    }

    /**
     * Demote an admin to a regular user.
     */
    public function demote(User $user): RedirectResponse
    {
        if ($user->role === 'admin') {
            $user->update(['role' => 'user']);
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => "Successfully demoted {$user->name} to User.",
            ]);
        }

        return back();
    }
}
