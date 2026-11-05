<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;

class OverrideProcurementReceivingRequest extends ReceiveProcurementRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isSuperAdmin() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [...parent::rules(),
            'reason' => ['required', 'string', 'min:10', 'max:2000', 'regex:/[\p{L}\p{N}]/u'],
            'confirmed' => ['required', 'accepted'],
            'submission_id' => ['required', 'uuid'],
        ];
    }
}
