import { Head, usePage, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import * as ItemController from '@/actions/App/Http/Controllers/ItemController';
import * as WarehouseController from '@/actions/App/Http/Controllers/WarehouseController';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { index as inventoryIndex } from '@/routes/inventory';
import { Users, Plus, Warehouse as WarehouseIcon, Trash2, X } from 'lucide-react';
import type { Item, Warehouse, User } from '@/types/inventory';

export default function InventoryIndex({ items, warehouses, users }: { items: Item[], warehouses: Warehouse[], users: User[] }) {
    const { auth } = usePage().props as any;
    const user = auth.user;
    const isAdmin = user.role === 'admin';

    return (
        <>
            <Head title="Inventory" />
            <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
                        <p className="text-neutral-500 dark:text-neutral-400">Track and manage stock across all warehouses.</p>
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2">
                            <ManageWarehousesDialog warehouses={warehouses} />
                            <ManageAccessDialog warehouses={warehouses} users={users} />
                            <AddItemDialog warehouses={warehouses} />
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden border border-neutral-200 dark:border-neutral-800">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                            <thead className="bg-neutral-55 dark:bg-neutral-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Item Details</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Stock by Warehouse</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Quantity</th>
                                    {isAdmin && <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-sm text-neutral-500 italic">
                                            No items found in your assigned warehouses.
                                        </td>
                                    </tr>
                                )}
                                {items.map((item) => {
                                    const totalQty = item.inventories?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;
                                    return (
                                        <tr key={item.item_id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item.item_name}</div>
                                                <div className="text-[10px] text-neutral-450 font-medium">REF: #{item.item_id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {item.inventories && item.inventories.length > 0 ? (
                                                        item.inventories.map((inv) => (
                                                            <Badge key={inv.id} variant="secondary" className="px-2 py-0.5 flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-850 border-none">
                                                                <WarehouseIcon className="w-3 h-3 text-neutral-400" />
                                                                <span className="font-medium">{inv.warehouse?.name}:</span>
                                                                <span className="font-bold">{inv.quantity}</span>
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-neutral-400 italic">No stock recorded</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-black ${totalQty > 0 ? 'text-neutral-900 dark:text-neutral-100' : 'text-red-500'}`}>
                                                        {totalQty}
                                                    </span>
                                                    {totalQty === 0 && <Badge variant="destructive" className="text-[8px] h-4 px-1 leading-none uppercase">Out of Stock</Badge>}
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <EditItemDialog item={item} warehouses={warehouses} />
                                                        <DeleteItemButton item={item} />
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

function AddItemDialog({ warehouses }: { warehouses: Warehouse[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        item_name: '',
        warehouse_id: '',
        initial_quantity: 0,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(ItemController.store().url, {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-lg shadow-sm gap-2">
                    <Plus className="w-4 h-4" />
                    Add Product
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                    <DialogDescription>Create a new product and optionally set its initial stock.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-5 mt-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="item_name">Product Name</Label>
                        <Input id="item_name" placeholder="e.g. MacBook Pro M3" value={data.item_name} onChange={(e) => setData('item_name', e.target.value)} />
                        {errors.item_name && <p className="text-red-500 text-xs font-medium">{errors.item_name}</p>}
                    </div>
                    
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg space-y-4 border border-neutral-100 dark:border-neutral-800">
                        <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Initial Stock (Optional)</div>
                        <div className="space-y-1.5">
                            <Label htmlFor="warehouse_id">Warehouse</Label>
                            <Select value={data.warehouse_id} onValueChange={(val) => setData('warehouse_id', val)}>
                                <SelectTrigger className="bg-white dark:bg-neutral-900">
                                    <SelectValue placeholder="Select warehouse" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map(w => (
                                        <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="initial_quantity">Quantity</Label>
                            <Input 
                                id="initial_quantity" 
                                type="number" 
                                className="bg-white dark:bg-neutral-900"
                                value={data.initial_quantity.toString()} 
                                onChange={(e) => setData('initial_quantity', parseInt(e.target.value) || 0)} 
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={processing} className="w-full">Save Product</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ManageAccessDialog({ warehouses, users }: { warehouses: Warehouse[], users: User[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        user_id: '',
        warehouse_id: '',
    });

    const assignUser = (e: React.FormEvent) => {
        e.preventDefault();
        post(WarehouseController.assignUser().url, {
            onSuccess: () => reset('user_id'),
        });
    };

    const removeUser = (userId: number, warehouseId: number) => {
        router.post(WarehouseController.removeUser().url, {
            user_id: userId,
            warehouse_id: warehouseId,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Users className="w-4 h-4" />
                    Manage Access
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Warehouse User Access</DialogTitle>
                    <DialogDescription>Assign or remove user access to specific warehouses.</DialogDescription>
                </DialogHeader>
                
                <form onSubmit={assignUser} className="flex gap-2 items-end mt-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800">
                    <div className="flex-1 space-y-1.5">
                        <Label>User</Label>
                        <Select value={data.user_id} onValueChange={(val) => setData('user_id', val)}>
                            <SelectTrigger className="bg-white dark:bg-neutral-900">
                                <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id.toString()}>{u.name} ({u.email})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <Label>To Warehouse</Label>
                        <Select value={data.warehouse_id} onValueChange={(val) => setData('warehouse_id', val)}>
                            <SelectTrigger className="bg-white dark:bg-neutral-900">
                                <SelectValue placeholder="Warehouse" />
                            </SelectTrigger>
                            <SelectContent>
                                {warehouses.map(w => (
                                    <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" disabled={processing || !data.user_id || !data.warehouse_id} size="icon">
                        <Plus className="w-4 h-4" />
                    </Button>
                </form>

                <div className="mt-6 space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Current Assignments</div>
                    {warehouses.map(warehouse => (
                        <div key={warehouse.id} className="space-y-2">
                            <div className="text-sm font-semibold flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
                                <WarehouseIcon className="w-3.5 h-3.5" />
                                {warehouse.name}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {warehouse.users && warehouse.users.length > 0 ? (
                                    warehouse.users.map(u => (
                                        <Badge key={u.id} variant="secondary" className="pl-2 pr-1 py-0.5 flex items-center gap-1 group">
                                            <span className="text-[10px]">{u.name}</span>
                                            <button 
                                                onClick={() => removeUser(u.id, warehouse.id)}
                                                className="hover:text-red-500 transition-colors rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-[10px] text-neutral-400 italic ml-5">No users assigned</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function EditItemDialog({ item, warehouses }: { item: Item, warehouses: Warehouse[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, patch, processing, errors, reset } = useForm({
        item_name: item.item_name,
        warehouse_id: '',
        quantity_adjustment: 0,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(ItemController.update({ item: item.item_id }).url, {
            onSuccess: () => {
                setOpen(false);
                reset('warehouse_id', 'quantity_adjustment');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">Edit</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit_item_name">Product Name</Label>
                        <Input id="edit_item_name" value={data.item_name} onChange={(e) => setData('item_name', e.target.value)} />
                        {errors.item_name && <p className="text-red-500 text-xs font-medium">{errors.item_name}</p>}
                    </div>

                    <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg space-y-4 border border-neutral-100 dark:border-neutral-800">
                        <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Adjust Stock (Optional)</div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_warehouse_id">Target Warehouse</Label>
                            <Select value={data.warehouse_id} onValueChange={(val) => setData('warehouse_id', val)}>
                                <SelectTrigger className="bg-white dark:bg-neutral-900">
                                    <SelectValue placeholder="Select warehouse" />
                                </SelectTrigger>
                                <SelectContent>
                                    {warehouses.map(w => (
                                        <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit_quantity_adjustment">Quantity Adjustment</Label>
                            <Input 
                                id="edit_quantity_adjustment" 
                                type="number" 
                                className="bg-white dark:bg-neutral-900"
                                value={data.quantity_adjustment.toString()} 
                                onChange={(e) => setData('quantity_adjustment', parseInt(e.target.value) || 0)} 
                                placeholder="e.g. 10 or -5"
                            />
                            <p className="text-[10px] text-neutral-500">
                                Enter a positive value to add stock, or a negative value to reduce stock.
                            </p>
                            {errors.quantity_adjustment && <p className="text-red-500 text-xs font-medium">{errors.quantity_adjustment}</p>}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={processing} className="w-full sm:w-auto">Update Product</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ManageWarehousesDialog({ warehouses }: { warehouses: Warehouse[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        location: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(WarehouseController.store().url, {
            onSuccess: () => {
                reset();
            },
        });
    };

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Are you sure you want to permanently delete the warehouse "${name}"? This will also remove all associated inventory records.`)) {
            router.delete(WarehouseController.destroy({ warehouse: id }).url, {
                preserveScroll: true,
                onSuccess: () => {
                    // Props are automatically refreshed and toast is triggered
                }
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <WarehouseIcon className="w-4 h-4" />
                    Manage Warehouses
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manage Warehouses</DialogTitle>
                    <DialogDescription>Add new warehouses or delete existing ones from the system.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4 mt-4 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800">
                    <div className="text-xs font-bold text-neutral-450 dark:text-neutral-450 uppercase tracking-wider mb-2">Create New Warehouse</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="warehouse_name">Name</Label>
                            <Input 
                                id="warehouse_name" 
                                placeholder="e.g. Jakarta Hub" 
                                className="bg-white dark:bg-neutral-900"
                                value={data.name} 
                                onChange={(e) => setData('name', e.target.value)} 
                            />
                            {errors.name && <p className="text-red-500 text-xs font-medium">{errors.name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="warehouse_location">Location</Label>
                            <Input 
                                id="warehouse_location" 
                                placeholder="e.g. West Jakarta" 
                                className="bg-white dark:bg-neutral-900"
                                value={data.location} 
                                onChange={(e) => setData('location', e.target.value)} 
                            />
                            {errors.location && <p className="text-red-500 text-xs font-medium">{errors.location}</p>}
                        </div>
                    </div>
                    <Button type="submit" disabled={processing || !data.name} className="w-full mt-2">
                        Add Warehouse
                    </Button>
                </form>

                <div className="mt-6 space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Current Warehouses ({warehouses.length})</div>
                    {warehouses.length === 0 ? (
                        <div className="text-sm text-neutral-550 italic text-center py-4">No warehouses registered.</div>
                    ) : (
                        <div className="divide-y divide-neutral-150 dark:divide-neutral-800">
                            {warehouses.map(warehouse => (
                                <div key={warehouse.id} className="py-2.5 flex items-center justify-between group">
                                    <div className="flex items-start gap-2.5">
                                        <WarehouseIcon className="w-4 h-4 text-neutral-400 mt-1 shrink-0" />
                                        <div>
                                            <div className="text-sm font-semibold text-neutral-850 dark:text-neutral-100">{warehouse.name}</div>
                                            {warehouse.location && (
                                                <div className="text-xs text-neutral-450 dark:text-neutral-400">{warehouse.location}</div>
                                            )}
                                        </div>
                                    </div>
                                    <Button 
                                        type="button"
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                        onClick={() => handleDelete(warehouse.id, warehouse.name)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DeleteItemButton({ item }: { item: Item }) {
    const { delete: destroy, processing } = useForm();

    const submit = () => {
        if (confirm('Are you sure you want to delete this product? This will also remove all associated inventory records across warehouses.')) {
            destroy(ItemController.destroy({ item: item.item_id }).url);
        }
    };

    return (
        <Button variant="destructive" size="sm" className="h-8" onClick={submit} disabled={processing}>
            <Trash2 className="w-3.5 h-3.5" />
        </Button>
    );
}

InventoryIndex.layout = {
    breadcrumbs: [
        { title: 'Inventory', href: inventoryIndex().url },
    ],
};
