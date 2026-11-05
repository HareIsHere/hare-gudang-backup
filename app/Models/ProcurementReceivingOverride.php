<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use LogicException;

#[Fillable(['submission_id', 'procurement_request_id', 'warehouse_id', 'actor_id', 'event', 'reason', 'quantities', 'mutation_ids'])]
class ProcurementReceivingOverride extends Model
{
    protected function casts(): array
    {
        return ['quantities' => 'array', 'mutation_ids' => 'array'];
    }

    protected static function booted(): void
    {
        static::updating(function (): never {
            throw new LogicException('Receiving override audit records are immutable.');
        });
        static::deleting(function (): never {
            throw new LogicException('Receiving override audit records are immutable.');
        });
    }
}
