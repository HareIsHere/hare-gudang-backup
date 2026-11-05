<?php

namespace App\Models;

use Database\Factories\ProcurementReceivingExceptionAuditFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['procurement_receiving_exception_id', 'procurement_request_id', 'warehouse_id', 'actor_id', 'event', 'reason', 'quantities', 'receiving_reference'])]
class ProcurementReceivingExceptionAudit extends Model
{
    /** @use HasFactory<ProcurementReceivingExceptionAuditFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'quantities' => 'array',
        ];
    }

    public function receivingException(): BelongsTo
    {
        return $this->belongsTo(ProcurementReceivingException::class, 'procurement_receiving_exception_id');
    }

    public function procurementRequest(): BelongsTo
    {
        return $this->belongsTo(ProcurementRequest::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
