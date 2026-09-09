<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Database\Factories\ProductSpecificationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['product_id', 'group', 'name', 'part_number', 'measurement_unit', 'description', 'stage', 'created_by', 'updated_by'])]
class ProductSpecification extends Model
{
    /** @use HasFactory<ProductSpecificationFactory> */
    use HasAuditFields, HasFactory;

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function prices(): HasMany
    {
        return $this->hasMany(Price::class, 'product_specification_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'product_specification_id', 'id');
    }
}
