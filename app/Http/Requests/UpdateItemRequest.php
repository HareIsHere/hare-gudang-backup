<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if (! $this->user()?->isAdmin()) {
            return false;
        }
        if ($this->filled('warehouse_id') && ! $this->user()->canAccessWarehouse($this->input('warehouse_id'))) {
            return false;
        }
        $item = $this->route('item');

        return $this->user()->isSuperAdmin() || ! $item->inventories()->exists() || $item->inventories()->whereIn('warehouse_id', $this->user()->warehouses()->select('warehouses.id'))->exists();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'item_name' => ['nullable', 'string', 'max:255'],
            'product_id' => ['nullable', 'exists:products,id'],
            'product_specification_id' => ['nullable', 'exists:product_specifications,id'],
            'category' => ['nullable', 'string', 'max:255'],
            'warehouse_id' => [Rule::requiredIf(fn () => $this->integer('quantity_adjustment') !== 0), 'nullable', 'exists:warehouses,id'],
            'quantity_adjustment' => ['nullable', 'integer', 'not_in:0'],
        ];
    }
}
