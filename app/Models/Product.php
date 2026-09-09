<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['group', 'category', 'name', 'description', 'stage', 'created_by', 'updated_by'])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasAuditFields, HasFactory;

    public function specifications(): HasMany
    {
        return $this->hasMany(ProductSpecification::class, 'product_id');
    }

    public function prices(): HasMany
    {
        return $this->hasMany(Price::class, 'product_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'product_id', 'id');
    }
}
