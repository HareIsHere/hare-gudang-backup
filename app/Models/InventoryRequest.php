<?php

namespace App\Models;

use Database\Factories\InventoryRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'item_id', 'warehouse_id', 'project_id', 'worksite_id', 'qty', 'status', 'type', 'reason'])]
class InventoryRequest extends Model
{
    /** @use HasFactory<InventoryRequestFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id', 'item_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function worksite(): BelongsTo
    {
        return $this->belongsTo(Worksite::class);
    }
}
