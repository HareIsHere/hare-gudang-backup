<?php

namespace App\Models;

use App\Concerns\HasAuditFields;
use Database\Factories\PriceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['product_id', 'product_specification_id', 'group', 'vendor', 'currency', 'price', 'last_price', 'stage', 'created_by', 'updated_by'])]
class Price extends Model
{
    /** @use HasFactory<PriceFactory> */
    use HasAuditFields, HasFactory;

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'last_price' => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function specification(): BelongsTo
    {
        return $this->belongsTo(ProductSpecification::class, 'product_specification_id');
    }
}
