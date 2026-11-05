<?php

namespace App\Models;

use Database\Factories\ProcurementReceivingExceptionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['procurement_request_id', 'warehouse_id', 'requested_by', 'authorized_by', 'revoked_by', 'status', 'reason', 'decision_remarks', 'revocation_reason', 'quantities', 'consumed_quantities', 'authorized_at', 'expires_at', 'revoked_at'])]
class ProcurementReceivingException extends Model
{
    /** @use HasFactory<ProcurementReceivingExceptionFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'quantities' => 'array',
            'consumed_quantities' => 'array',
            'authorized_at' => 'datetime',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function procurementRequest(): BelongsTo
    {
        return $this->belongsTo(ProcurementRequest::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function authorizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'authorized_by');
    }

    public function revoker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }

    public function audits(): HasMany
    {
        return $this->hasMany(ProcurementReceivingExceptionAudit::class);
    }
}
