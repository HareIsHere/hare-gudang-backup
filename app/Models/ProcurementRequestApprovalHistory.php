<?php

namespace App\Models;

use Database\Factories\ProcurementRequestApprovalHistoryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['procurement_request_id', 'actor_id', 'stage', 'action', 'remarks'])]
class ProcurementRequestApprovalHistory extends Model
{
    /** @use HasFactory<ProcurementRequestApprovalHistoryFactory> */
    use HasFactory;

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function procurementRequest(): BelongsTo
    {
        return $this->belongsTo(ProcurementRequest::class);
    }
}
