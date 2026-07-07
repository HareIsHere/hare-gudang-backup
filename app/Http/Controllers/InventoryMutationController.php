<?php

namespace App\Http\Controllers;

use App\Models\InventoryMutation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryMutationController extends Controller
{
    /**
     * Display a listing of inventory mutations (Admin only).
     */
    public function index(): Response
    {
        return Inertia::render('admin/mutations/index', [
            'mutations' => InventoryMutation::with(['item', 'fromWarehouse', 'toWarehouse', 'user'])
                ->latest()
                ->get(),
        ]);
    }
}
