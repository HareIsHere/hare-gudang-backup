<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AssignProcurementApproversRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'examiner_id' => ['required', 'integer', 'exists:users,id'],
            'acknowledger_one_id' => ['required', 'integer', 'exists:users,id', 'different:examiner_id'],
            'acknowledger_two_id' => ['required', 'integer', 'exists:users,id', 'different:examiner_id', 'different:acknowledger_one_id'],
            'final_approver_id' => ['required', 'integer', 'exists:users,id', 'different:examiner_id', 'different:acknowledger_one_id', 'different:acknowledger_two_id'],
        ];
    }
}
