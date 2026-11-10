<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterWarehouseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'warehouse_id' => [
                'nullable',
                'integer',
                Rule::exists('warehouses', 'id')->where(fn ($query) => $query->when(
                    ! $this->user()->isSuperAdmin(),
                    fn ($query) => $query->whereIn('id', $this->user()->warehouses()->select('warehouses.id')),
                )),
            ],
        ];
    }

    public function warehouseId(): ?int
    {
        return $this->filled('warehouse_id') ? $this->integer('warehouse_id') : null;
    }
}
