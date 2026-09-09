<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Database\Factories\WorksiteCategoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['group', 'name', 'description', 'stage', 'created_by', 'updated_by'])]
class WorksiteCategory extends Model
{
    /** @use HasFactory<WorksiteCategoryFactory> */
    use HasAuditFields, HasFactory;

    public function worksites(): HasMany
    {
        return $this->hasMany(Worksite::class, 'worksite_category_id');
    }
}
