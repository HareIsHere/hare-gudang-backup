<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        if ($user->isAdmin()) {
            return true;
        }

        return $user->warehouses()->where('warehouses.id', $this->warehouse_id)->exists();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'item_id' => ['required', 'exists:items,item_id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'qty' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $itemId = $this->input('item_id');
            $warehouseId = $this->input('warehouse_id');
            $qty = $this->input('qty');

            if ($itemId && $warehouseId) {
                $inventory = \App\Models\Inventory::where('item_id', $itemId)
                    ->where('warehouse_id', $warehouseId)
                    ->first();

                if (!$inventory || $inventory->quantity <= 0) {
                    $validator->errors()->add('item_id', 'This product is not available in the selected warehouse.');
                } elseif ($qty && $qty > $inventory->quantity) {
                    $validator->errors()->add('qty', "Requested quantity exceeds available stock ({$inventory->quantity} available).");
                }
            }
        });
    }
}
