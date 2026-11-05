<?php

namespace App\Models;

use Database\Factories\ProcurementRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['request_number', 'request_date', 'worksite_id', 'requester_id', 'examiner_id', 'acknowledger_one_id', 'acknowledger_two_id', 'final_approver_id', 'status', 'description', 'approved_by', 'approved_at', 'approval_remarks', 'rejected_by', 'rejected_at', 'rejection_remarks', 'canceled_at', 'cancellation_remarks'])]
class ProcurementRequest extends Model
{
    /** @use HasFactory<ProcurementRequestFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'request_date' => 'date',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'canceled_at' => 'datetime',
        ];
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function examiner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'examiner_id');
    }

    public function acknowledgerOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledger_one_id');
    }

    public function acknowledgerTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'acknowledger_two_id');
    }

    public function finalApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'final_approver_id');
    }

    public function approvalHistory(): HasMany
    {
        return $this->hasMany(ProcurementRequestApprovalHistory::class);
    }

    public function worksite(): BelongsTo
    {
        return $this->belongsTo(Worksite::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ProcurementRequestItem::class);
    }

    public function receivingExceptions(): HasMany
    {
        return $this->hasMany(ProcurementReceivingException::class);
    }
}
