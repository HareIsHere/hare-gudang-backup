<?php

namespace App\Models;

use Database\Factories\ProcurementRequestItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['procurement_request_id', 'item_id', 'item_name', 'item_code', 'part_number', 'manufacturer_code', 'measurement_unit', 'current_stock', 'requested_quantity', 'approved_quantity', 'received_quantity', 'description'])]
class ProcurementRequestItem extends Model
{
    /** @use HasFactory<ProcurementRequestItemFactory> */
    use HasFactory;

    public function procurementRequest(): BelongsTo
    {
        return $this->belongsTo(ProcurementRequest::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id', 'item_id');
    }
}
