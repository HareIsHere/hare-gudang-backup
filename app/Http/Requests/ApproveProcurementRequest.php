<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ApproveProcurementRequest extends FormRequest
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
            'decision' => ['required', 'in:approved,rejected'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            'items' => ['required_if:decision,approved', 'array', 'min:1'],
            'items.*.id' => ['required_with:items', 'integer'],
            'items.*.approved_quantity' => ['required_with:items', 'integer', 'min:1'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($this->input('decision') !== 'approved' || $validator->errors()->isNotEmpty()) {
                return;
            }

            $requestItems = $this->route('procurementRequest')?->items()->get()->keyBy('id');

            foreach ($this->input('items', []) as $item) {
                $requestItem = $requestItems?->get($item['id'] ?? null);

                if (! $requestItem || $item['approved_quantity'] > $requestItem->requested_quantity) {
                    $validator->errors()->add('items', 'Approved quantities must belong to this request and cannot exceed the requested quantity.');
                    break;
                }
            }
        }];
    }
}
