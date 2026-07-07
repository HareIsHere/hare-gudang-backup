<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\InventoryMutation;
use App\Models\Item;
use App\Models\Warehouse;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Adjust stock for an item in a warehouse.
     */
    public function adjustStock(
        Item $item,
        Warehouse $warehouse,
        int $quantity,
        string $type,
        User $user,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?Warehouse $fromWarehouse = null,
        ?Warehouse $toWarehouse = null
    ): void {
        DB::transaction(function () use ($item, $warehouse, $quantity, $type, $user, $referenceType, $referenceId, $fromWarehouse, $toWarehouse) {
            $inventory = Inventory::firstOrCreate(
                ['item_id' => $item->item_id, 'warehouse_id' => $warehouse->id],
                ['quantity' => 0]
            );

            if ($type === 'IN') {
                $inventory->increment('quantity', $quantity);
            } elseif ($type === 'OUT') {
                if ($inventory->quantity < $quantity) {
                    throw new \Exception("Insufficient stock in warehouse {$warehouse->name}");
                }
                $inventory->decrement('quantity', $quantity);
            }

            InventoryMutation::create([
                'item_id' => $item->item_id,
                'from_warehouse_id' => $fromWarehouse?->id,
                'to_warehouse_id' => $toWarehouse?->id,
                'quantity' => $quantity,
                'type' => $type,
                'user_id' => $user->id,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
            ]);
        });
    }

    /**
     * Transfer stock between warehouses (Admin only).
     */
    public function transfer(
        Item $item,
        Warehouse $fromWarehouse,
        Warehouse $toWarehouse,
        int $quantity,
        User $user
    ): void {
        if (!$user->isAdmin()) {
            throw new \Exception("Only admins can perform inter-warehouse transfers.");
        }

        DB::transaction(function () use ($item, $fromWarehouse, $toWarehouse, $quantity, $user) {
            // Adjust Source
            $this->adjustStock(
                $item,
                $fromWarehouse,
                $quantity,
                'OUT',
                $user,
                'Transfer',
                null,
                $fromWarehouse,
                $toWarehouse
            );

            // Adjust Destination
            $this->adjustStock(
                $item,
                $toWarehouse,
                $quantity,
                'IN',
                $user,
                'Transfer',
                null,
                $fromWarehouse,
                $toWarehouse
            );
            
            // Note: adjustStock logs individual IN/OUT. 
            // We might want a specific TRANSFER log entry instead of two, 
            // but the current schema supports from/to in a single entry.
            // Let's refine adjustStock to NOT log if it's part of a transfer, 
            // OR log a single TRANSFER entry.
        });
    }
    
    /**
     * Refined adjustStock to handle single mutation log entry.
     */
    public function recordMutation(
        Item $item,
        int $quantity,
        string $type,
        User $user,
        ?Warehouse $fromWarehouse = null,
        ?Warehouse $toWarehouse = null,
        ?string $referenceType = null,
        ?int $referenceId = null
    ): void {
        DB::transaction(function () use ($item, $quantity, $type, $user, $fromWarehouse, $toWarehouse, $referenceType, $referenceId) {
            if ($type === 'IN' && $toWarehouse) {
                $this->updateInventory($item, $toWarehouse, $quantity, 'plus');
            } elseif ($type === 'OUT' && $fromWarehouse) {
                $this->updateInventory($item, $fromWarehouse, $quantity, 'minus');
            } elseif ($type === 'TRANSFER' && $fromWarehouse && $toWarehouse) {
                $this->updateInventory($item, $fromWarehouse, $quantity, 'minus');
                $this->updateInventory($item, $toWarehouse, $quantity, 'plus');
            } elseif ($type === 'REQUEST') {
                if ($fromWarehouse) {
                    $this->updateInventory($item, $fromWarehouse, $quantity, 'minus');
                } elseif ($toWarehouse) {
                    $this->updateInventory($item, $toWarehouse, $quantity, 'plus');
                }
            }

            InventoryMutation::create([
                'item_id' => $item->item_id,
                'from_warehouse_id' => $fromWarehouse?->id,
                'to_warehouse_id' => $toWarehouse?->id,
                'quantity' => $quantity,
                'type' => $type,
                'user_id' => $user->id,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
            ]);
        });
    }

    private function updateInventory(Item $item, Warehouse $warehouse, int $quantity, string $operation): void
    {
        $inventory = Inventory::firstOrCreate(
            ['item_id' => $item->item_id, 'warehouse_id' => $warehouse->id],
            ['quantity' => 0]
        );

        if ($operation === 'plus') {
            $inventory->increment('quantity', $quantity);
        } else {
            if ($inventory->quantity < $quantity) {
                throw new \Exception("Insufficient stock in warehouse {$warehouse->name}");
            }
            $inventory->decrement('quantity', $quantity);
        }
    }
}
