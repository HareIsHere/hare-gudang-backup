import { Head, useForm, router } from '@inertiajs/react';
import * as InventoryRequestController from '@/actions/App/Http/Controllers/InventoryRequestController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index as requestsIndex } from '@/routes/requests';
import { X, Trash2 } from 'lucide-react';
import type { Item, InventoryRequest, Warehouse } from '@/types/inventory';

export default function RequestsIndex({
    requests,
    items,
    warehouses,
}: {
    requests: InventoryRequest[];
    items: Item[];
    warehouses: Warehouse[];
}) {
    const handleDelete = (id: number) => {
        if (
            confirm(
                'Permanently delete this request record from the database and your history?',
            )
        ) {
            router.delete(
                InventoryRequestController.destroy['/requests/{id}']({ id: id })
                    .url,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        // Record is deleted in DB and Inertia reloads the 'requests' prop automatically
                    },
                },
            );
        }
    };

    const handleCancel = (id: number) => {
        if (confirm('Cancel this request?')) {
            router.patch(
                InventoryRequestController.cancel({ inventoryRequest: id }).url,
                { preserveScroll: true },
            );
        }
    };

    return (
        <>
            <Head title="My Requests" />
            <div className="p-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold tracking-tight">
                                My Inventory Requests
                            </h1>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                                Item
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                                Warehouse
                                            </th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                                Qty
                                            </th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                        {requests.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-6 py-8 text-center text-sm text-neutral-500 italic"
                                                >
                                                    No requests found.
                                                </td>
                                            </tr>
                                        )}
                                        {requests.map((request) => (
                                            <tr
                                                key={request.id}
                                                className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                        {
                                                            request.item
                                                                ?.item_name
                                                        }
                                                    </div>
                                                    <div className="text-[10px] text-neutral-500">
                                                        {new Date(
                                                            request.created_at,
                                                        ).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                                                    <div className="flex flex-col">
                                                        <span>
                                                            {
                                                                request
                                                                    .warehouse
                                                                    ?.name
                                                            }
                                                        </span>
                                                        <span className="text-[10px] text-neutral-400">
                                                            {
                                                                request
                                                                    .warehouse
                                                                    ?.location
                                                            }
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm font-semibold whitespace-nowrap text-neutral-900 dark:text-neutral-100">
                                                    {request.qty}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <Badge
                                                            variant={
                                                                request.status ===
                                                                'finished'
                                                                    ? 'default'
                                                                    : request.status ===
                                                                        'onReview'
                                                                      ? 'secondary'
                                                                      : request.status ===
                                                                          'canceled'
                                                                        ? 'destructive'
                                                                        : 'outline'
                                                            }
                                                            className="w-fit capitalize"
                                                        >
                                                            {request.status
                                                                .replace(
                                                                    /([A-Z])/g,
                                                                    ' $1',
                                                                )
                                                                .trim()}
                                                        </Badge>
                                                        {request.reason && (
                                                            <p
                                                                className="max-w-[150px] truncate text-[10px] text-red-500 italic"
                                                                title={
                                                                    request.reason
                                                                }
                                                            >
                                                                Reason:{' '}
                                                                {request.reason}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                                    <div className="flex justify-end gap-2">
                                                        {(request.status ===
                                                            'requested' ||
                                                            request.status ===
                                                                'onReview') && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-neutral-400 hover:text-orange-500"
                                                                title="Cancel Request"
                                                                onClick={() =>
                                                                    handleCancel(
                                                                        request.id,
                                                                    )
                                                                }
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {request.status ===
                                                            'canceled' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-neutral-300 hover:text-red-500"
                                                                title="Delete Record Permanently"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        request.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">
                                Create Request
                            </h2>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Submit a new request for inventory items
                                available in your warehouses.
                            </p>
                        </div>
                        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                            <NewRequestForm
                                items={items}
                                warehouses={warehouses}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function NewRequestForm({
    items,
    warehouses,
}: {
    items: Item[];
    warehouses: Warehouse[];
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        item_id: '',
        warehouse_id: '',
        qty: 1,
    });

    // Find the currently selected product
    const selectedItem = items.find(
        (item) => item.item_id.toString() === data.item_id,
    );

    // Filter warehouses that have the selected product (quantity > 0)
    const availableWarehouses = selectedItem
        ? warehouses.filter((warehouse) =>
              selectedItem.inventories?.some(
                  (inv) =>
                      inv.warehouse_id === warehouse.id && inv.quantity > 0,
              ),
          )
        : [];

    // Get stock quantity for a specific warehouse for the selected product
    const getStockForWarehouse = (warehouseId: number) => {
        if (!selectedItem || !selectedItem.inventories) return 0;
        const inv = selectedItem.inventories.find(
            (i) => i.warehouse_id === warehouseId,
        );
        return inv ? inv.quantity : 0;
    };

    // Find stock for the currently selected warehouse
    const selectedWarehouseStock = data.warehouse_id
        ? getStockForWarehouse(parseInt(data.warehouse_id))
        : 0;

    const handleItemChange = (value: string) => {
        const nextItem = items.find(
            (item) => item.item_id.toString() === value,
        );
        const hasWarehouse = nextItem?.inventories?.some(
            (inv) =>
                inv.warehouse_id.toString() === data.warehouse_id &&
                inv.quantity > 0,
        );

        if (!hasWarehouse) {
            setData({
                ...data,
                item_id: value,
                warehouse_id: '',
                qty: 1,
            });
        } else {
            setData({
                ...data,
                item_id: value,
            });
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(InventoryRequestController.store().url, {
            onSuccess: () => reset(),
        });
    };

    const isSubmitDisabled =
        processing ||
        !data.item_id ||
        !data.warehouse_id ||
        data.qty < 1 ||
        data.qty > selectedWarehouseStock;

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="item_id">Product</Label>
                <Select
                    value={data.item_id.toString()}
                    onValueChange={handleItemChange}
                >
                    <SelectTrigger id="item_id" className="rounded-lg">
                        <SelectValue placeholder="Select a product" />
                    </SelectTrigger>
                    <SelectContent>
                        {items.map((item) => (
                            <SelectItem
                                key={item.item_id}
                                value={item.item_id.toString()}
                            >
                                {item.item_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.item_id && (
                    <p className="text-xs font-medium text-red-500">
                        {errors.item_id}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="warehouse_id">Warehouse Source</Label>
                <Select
                    value={data.warehouse_id.toString()}
                    onValueChange={(value) => setData('warehouse_id', value)}
                    disabled={!data.item_id}
                >
                    <SelectTrigger id="warehouse_id" className="rounded-lg">
                        <SelectValue
                            placeholder={
                                data.item_id
                                    ? 'Select warehouse'
                                    : 'Select a product first'
                            }
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {availableWarehouses.map((warehouse) => (
                            <SelectItem
                                key={warehouse.id}
                                value={warehouse.id.toString()}
                            >
                                {warehouse.name} (
                                {getStockForWarehouse(warehouse.id)} available)
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-[10px] text-neutral-400">
                    You can only request from warehouses assigned to you.
                </p>
                {errors.warehouse_id && (
                    <p className="text-xs font-medium text-red-500">
                        {errors.warehouse_id}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="qty">Requested Quantity</Label>
                <Input
                    id="qty"
                    type="number"
                    placeholder="Enter quantity"
                    className="rounded-lg"
                    value={data.qty.toString()}
                    onChange={(e) =>
                        setData('qty', parseInt(e.target.value) || 0)
                    }
                    min="1"
                    max={selectedWarehouseStock || undefined}
                    disabled={!data.warehouse_id}
                />
                {data.warehouse_id && (
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                        <span className="text-neutral-400">
                            Max available: {selectedWarehouseStock}
                        </span>
                        {data.qty > selectedWarehouseStock && (
                            <span className="font-semibold text-red-500">
                                Exceeds available stock
                            </span>
                        )}
                    </div>
                )}
                {errors.qty && (
                    <p className="text-xs font-medium text-red-500">
                        {errors.qty}
                    </p>
                )}
            </div>

            <Button
                type="submit"
                className="h-10 w-full rounded-lg"
                disabled={isSubmitDisabled}
            >
                {processing ? 'Submitting...' : 'Submit Request'}
            </Button>
        </form>
    );
}

RequestsIndex.layout = {
    breadcrumbs: [{ title: 'My Requests', href: requestsIndex().url }],
};
