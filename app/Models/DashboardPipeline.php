<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DashboardPipeline extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'activity_id',
        'status',
        'custom_messages',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'custom_messages' => 'array',
        ];
    }
}
