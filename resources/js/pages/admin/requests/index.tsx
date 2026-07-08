import { Head, router, useForm } from '@inertiajs/react';
import * as InventoryRequestController from '@/actions/App/Http/Controllers/InventoryRequestController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { index as adminRequestsIndex } from '@/routes/admin/requests';
import { Trash2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { InventoryRequest } from '@/types/inventory';

export default function AdminRequestsIndex({
    requests,
}: {
    requests: InventoryRequest[];
}) {
    const handleDelete = (id: number) => {
        if (
            confirm('Permanently delete this request record from the database?')
        ) {
            router.delete(
                InventoryRequestController.destroy['/admin/requests/{id}']({
                    id: id,
                }).url,
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        // Props are automatically refreshed by Inertia
                    },
                },
            );
        }
    };

    return (
        <>
            <Head title="Manage Requests" />
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Manage Requests
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        Review and fulfill inventory requests from across all
                        warehouses.
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        User
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Product & Warehouse
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Quantity
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
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                    {request.user?.name}
                                                </span>
                                                <span className="text-xs text-neutral-500">
                                                    {request.user?.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                    {request.item?.item_name}
                                                </span>
                                                <div className="mt-0.5 flex items-center gap-1.5">
                                                    <Badge
                                                        variant="outline"
                                                        className="h-4 border-none bg-neutral-100 px-1.5 py-0 text-[10px] dark:bg-neutral-800"
                                                    >
                                                        {
                                                            request.warehouse
                                                                ?.name
                                                        }
                                                    </Badge>
                                                    {request.type === 'IN' && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="h-4 px-1.5 py-0 text-[10px] uppercase"
                                                        >
                                                            Stock In
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-sm font-bold whitespace-nowrap text-neutral-900 dark:text-neutral-100">
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
                                                    <div className="flex max-w-[150px] items-center gap-1 text-[10px] text-red-500 italic">
                                                        <AlertCircle className="h-2.5 w-2.5 shrink-0" />
                                                        <span
                                                            className="truncate"
                                                            title={
                                                                request.reason
                                                            }
                                                        >
                                                            {request.reason}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <StatusUpdateForm
                                                    request={request}
                                                />
                                                {request.status ===
                                                    'canceled' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-neutral-400 hover:text-red-500"
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
        </>
    );
}

function StatusUpdateForm({ request }: { request: InventoryRequest }) {
    const [open, setOpen] = useState(false);
    const { data, setData, patch, processing, reset } = useForm({
        status: request.status as string,
        reason: '',
    });

    const submit = (newStatus: string) => {
        if (newStatus === 'canceled') {
            setData('status', newStatus);
            setOpen(true);
        } else {
            router.patch(
                InventoryRequestController.updateStatus({
                    inventoryRequest: request.id,
                }).url,
                { status: newStatus },
            );
        }
    };

    const confirmCancel = (e: React.FormEvent) => {
        e.preventDefault();
        patch(
            InventoryRequestController.updateStatus({
                inventoryRequest: request.id,
            }).url,
            {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            },
        );
    };

    if (request.status === 'canceled') {
        return (
            <span className="text-xs font-medium text-red-500 italic">
                Request Canceled
            </span>
        );
    }

    if (request.status === 'finished') {
        return (
            <Select value="finished" onValueChange={(value) => submit(value)}>
                <SelectTrigger className="h-9 w-44 rounded-lg border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
                    <SelectValue placeholder="Fulfillment Complete" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="finished" disabled>
                        Fulfillment Complete
                    </SelectItem>
                    <SelectItem value="onReview">
                        Revert to On Review
                    </SelectItem>
                    <SelectItem
                        value="canceled"
                        className="text-red-500 focus:text-red-500"
                    >
                        Cancel Request
                    </SelectItem>
                </SelectContent>
            </Select>
        );
    }

    return (
        <>
            <Select
                value={request.status}
                onValueChange={(value) => submit(value)}
            >
                <SelectTrigger className="h-9 w-40 rounded-lg">
                    <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="onReview">On Review</SelectItem>
                    <SelectItem value="finished">Finish & Log Stock</SelectItem>
                    <SelectItem
                        value="canceled"
                        className="text-red-500 focus:text-red-500"
                    >
                        Cancel Request
                    </SelectItem>
                </SelectContent>
            </Select>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reason for Cancellation</DialogTitle>
                        <DialogDescription>
                            Please provide a reason why this request is being
                            canceled. This will be visible to the user.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={confirmCancel} className="space-y-4">
                        <Textarea
                            placeholder="e.g. Item currently unavailable in this warehouse..."
                            value={data.reason || ''}
                            onChange={(e) => setData('reason', e.target.value)}
                            required
                        />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setOpen(false)}
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={processing}
                            >
                                Confirm Cancellation
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminRequestsIndex.layout = {
    breadcrumbs: [{ title: 'Manage Requests', href: adminRequestsIndex().url }],
};
