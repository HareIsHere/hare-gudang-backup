<?php

namespace App\Models;

use Database\Factories\WarehouseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'location', 'worksite_id'])]
class Warehouse extends Model
{
    /** @use HasFactory<WarehouseFactory> */
    use HasFactory;

    public function worksite(): BelongsTo
    {
        return $this->belongsTo(Worksite::class, 'worksite_id');
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'warehouse_user');
    }

    public function inventories(): HasMany
    {
        return $this->hasMany(Inventory::class);
    }

    public function items(): BelongsToMany
    {
        return $this->belongsToMany(Item::class, 'inventories', 'warehouse_id', 'item_id')
            ->withPivot('quantity')
            ->withTimestamps();
    }
}
