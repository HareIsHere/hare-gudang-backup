<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['group', 'name', 'progress', 'description', 'created_by', 'updated_by'])]
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasAuditFields, HasFactory;

    protected function casts(): array
    {
        return [
            'progress' => 'integer',
        ];
    }

    public function inventoryRequests(): HasMany
    {
        return $this->hasMany(InventoryRequest::class, 'project_id');
    }
}
