import { Head, router, useForm } from '@inertiajs/react';
import * as InventoryRequestController from '@/actions/App/Http/Controllers/InventoryRequestController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { index as adminRequestsIndex } from '@/routes/admin/requests';
import { Trash2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { InventoryRequest } from '@/types/inventory';

export default function AdminRequestsIndex({ requests }: { requests: InventoryRequest[] }) {
    const handleDelete = (id: number) => {
        if (confirm('Permanently delete this request record from the database?')) {
            router.delete(InventoryRequestController.destroy['/admin/requests/{id}']({ id: id }).url, {
                preserveScroll: true,
                onSuccess: () => {
                    // Props are automatically refreshed by Inertia
                }
            });
        }
    };

    return (
        <>
            <Head title="Manage Requests" />
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Manage Requests</h1>
                    <p className="text-neutral-500 dark:text-neutral-400">Review and fulfill inventory requests from across all warehouses.</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden border border-neutral-200 dark:border-neutral-800">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Product & Warehouse</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-500 italic">No requests found.</td>
                                    </tr>
                                )}
                                {requests.map((request) => (
                                    <tr key={request.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{request.user?.name}</span>
                                                <span className="text-xs text-neutral-500">{request.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{request.item?.item_name}</span>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-neutral-100 dark:bg-neutral-800 border-none">
                                                        {request.warehouse?.name}
                                                    </Badge>
                                                    {request.type === 'IN' && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 uppercase">Stock In</Badge>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100 font-bold">{request.qty}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex flex-col gap-1">
                                                <Badge 
                                                    variant={request.status === 'finished' ? 'default' : request.status === 'onReview' ? 'secondary' : request.status === 'canceled' ? 'destructive' : 'outline'}
                                                    className="capitalize w-fit"
                                                >
                                                    {request.status.replace(/([A-Z])/g, ' $1').trim()}
                                                </Badge>
                                                {request.reason && (
                                                    <div className="flex items-center gap-1 text-[10px] text-red-500 italic max-w-[150px]">
                                                        <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                                                        <span className="truncate" title={request.reason}>{request.reason}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end items-center gap-2">
                                                <StatusUpdateForm request={request} />
                                                {request.status === 'canceled' && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-400 hover:text-red-500" onClick={() => handleDelete(request.id)}>
                                                        <Trash2 className="w-4 h-4" />
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
            router.patch(InventoryRequestController.updateStatus({ inventoryRequest: request.id }).url, { status: newStatus });
        }
    };

    const confirmCancel = (e: React.FormEvent) => {
        e.preventDefault();
        patch(InventoryRequestController.updateStatus({ inventoryRequest: request.id }).url, {
            onSuccess: () => {
                setOpen(false);
                reset();
            }
        });
    };

    if (request.status === 'canceled') {
        return (
            <span className="text-xs text-red-500 font-medium italic">
                Request Canceled
            </span>
        );
    }

    if (request.status === 'finished') {
        return (
            <Select value="finished" onValueChange={(value) => submit(value)}>
                <SelectTrigger className="w-44 h-9 rounded-lg bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50">
                    <SelectValue placeholder="Fulfillment Complete" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="finished" disabled>Fulfillment Complete</SelectItem>
                    <SelectItem value="onReview">Revert to On Review</SelectItem>
                    <SelectItem value="canceled" className="text-red-500 focus:text-red-500">Cancel Request</SelectItem>
                </SelectContent>
            </Select>
        );
    }

    return (
        <>
            <Select value={request.status} onValueChange={(value) => submit(value)}>
                <SelectTrigger className="w-40 h-9 rounded-lg">
                    <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="onReview">On Review</SelectItem>
                    <SelectItem value="finished">Finish & Log Stock</SelectItem>
                    <SelectItem value="canceled" className="text-red-500 focus:text-red-500">Cancel Request</SelectItem>
                </SelectContent>
            </Select>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reason for Cancellation</DialogTitle>
                        <DialogDescription>Please provide a reason why this request is being canceled. This will be visible to the user.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={confirmCancel} className="space-y-4">
                        <Textarea 
                            placeholder="e.g. Item currently unavailable in this warehouse..."
                            value={data.reason || ''}
                            onChange={(e) => setData('reason', e.target.value)}
                            required
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Back</Button>
                            <Button type="submit" variant="destructive" disabled={processing}>Confirm Cancellation</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

AdminRequestsIndex.layout = {
    breadcrumbs: [
        { title: 'Manage Requests', href: adminRequestsIndex().url },
    ],
};
