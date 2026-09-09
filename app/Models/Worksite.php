<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Database\Factories\WorksiteFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['worksite_category_id', 'group', 'name', 'address', 'description', 'stage', 'created_by', 'updated_by'])]
class Worksite extends Model
{
    /** @use HasFactory<WorksiteFactory> */
    use HasAuditFields, HasFactory;

    public function category(): BelongsTo
    {
        return $this->belongsTo(WorksiteCategory::class, 'worksite_category_id');
    }

    public function warehouses(): HasMany
    {
        return $this->hasMany(Warehouse::class, 'worksite_id');
    }

    public function inventoryRequests(): HasMany
    {
        return $this->hasMany(InventoryRequest::class, 'worksite_id');
    }
}
