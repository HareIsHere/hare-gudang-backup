<?php

namespace App\Http\Requests;

use App\Models\Item;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreProcurementRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'items' => collect($this->input('items', []))
                ->map(function (mixed $item): mixed {
                    if (! is_array($item)) {
                        return $item;
                    }

                    $item['measurement_unit'] = isset($item['measurement_unit'])
                        ? trim((string) $item['measurement_unit'])
                        : null;

                    return $item;
                })
                ->all(),
        ]);
    }

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
            'request_date' => ['required', 'date'],
            'worksite_id' => ['required', 'exists:worksites,id'],
            'description' => ['nullable', 'string', 'max:2000'],
            'status' => ['required', 'in:draft,submitted,pending_approval'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'integer', 'distinct', 'exists:items,item_id'],
            'items.*.requested_quantity' => ['required', 'integer', 'min:1'],
            'items.*.manufacturer_code' => ['nullable', 'string', 'max:255'],
            'items.*.measurement_unit' => ['required', 'string', 'max:100'],
            'items.*.description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $lines = collect($this->input('items', []));
            $items = Item::query()
                ->whereIn(
                    'item_id',
                    $lines
                        ->pluck('item_id')
                        ->filter(fn (mixed $itemId): bool => is_numeric($itemId)),
                )
                ->get(['item_id', 'product_id'])
                ->keyBy('item_id');
            $selectedProducts = [];

            foreach ($lines as $index => $line) {
                $item = $items->get($line['item_id'] ?? null);

                if (! $item) {
                    continue;
                }

                $productKey = $item->product_id
                    ? "product-{$item->product_id}"
                    : "item-{$item->item_id}";

                if (isset($selectedProducts[$productKey])) {
                    $validator->errors()->add(
                        "items.{$index}.item_id",
                        'Produk ini sudah ditambahkan ke SPB.',
                    );

                    return;
                }

                $selectedProducts[$productKey] = true;
            }
        }];
    }
}
