<?php

namespace App\Http\Requests;

use App\Models\Product;
use App\Models\ProductSpecification;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        if ($this->filled('product_id') && $this->user()?->role === 'admin' && ! Product::accessibleTo($this->user())->whereKey($this->input('product_id'))->exists()) {
            return false;
        }
        if ($this->filled('product_specification_id') && $this->user()?->role === 'admin' && ! ProductSpecification::whereKey($this->input('product_specification_id'))->whereHas('product', fn ($query) => $query->accessibleTo($this->user()))->exists()) {
            return false;
        }

        return ($this->user()?->isAdmin() ?? false) && (! $this->filled('warehouse_id') || $this->user()->canAccessWarehouse($this->input('warehouse_id')));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'item_name' => ['required_without:product_id', 'nullable', 'string', 'max:255'],
            'product_id' => ['nullable', 'exists:products,id'],
            'product_specification_id' => ['nullable', 'exists:product_specifications,id'],
            'category' => ['nullable', 'string', 'max:255'],
            'warehouse_id' => [Rule::requiredIf(fn () => $this->integer('initial_quantity') > 0), 'nullable', 'exists:warehouses,id'],
            'initial_quantity' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
