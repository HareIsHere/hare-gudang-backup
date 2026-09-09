import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, X, Edit2, Trash2, Database, Cpu } from 'lucide-react';
import { useState } from 'react';
import * as ProductController from '@/actions/App/Http/Controllers/Master/ProductController';
import { MasterTabs } from '@/components/master-tabs';
import { StageBadge } from '@/components/stage-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { index as productsIndex } from '@/routes/master/products/data';
import { index as productSpecificationsIndex } from '@/routes/master/products/specifications';
import type { Product, Stage } from '@/types/master';

function formatDateTime(dateStr?: string | null): string {
    if (!dateStr) {
return '-';
}

    const d = new Date(dateStr);

    return isNaN(d.getTime())
        ? dateStr
        : d.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          });
}

export default function ProductsDataIndex({
    products = [],
}: {
    products: Product[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    const filteredProducts = products.filter((prod) => {
        const query = searchQuery.toLowerCase();

        return (
            prod.name.toLowerCase().includes(query) ||
            prod.group.toLowerCase().includes(query) ||
            prod.category.toLowerCase().includes(query) ||
            (prod.description && prod.description.toLowerCase().includes(query))
        );
    });

    const handleDelete = (prod: Product) => {
        router.delete(ProductController.destroy({ product: prod.id }).url, {
            preserveScroll: true,
            onSuccess: () => setProductToDelete(null),
        });
    };

    const tabs = [
        {
            label: 'Data',
            href: productsIndex().url,
            icon: Database,
        },
        {
            label: 'Specification',
            href: productSpecificationsIndex().url,
            icon: Cpu,
        },
    ];

    return (
        <>
            <Head title="Products Data - Feature Master" />
            <div className="p-6">
                <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Products
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Manage product catalog, specifications, and related pricing.
                        </p>
                    </div>
                    <AddProductDialog />
                </div>

                <div className="mb-6">
                    <MasterTabs tabs={tabs} />
                </div>

                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-col items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 p-4 sm:flex-row dark:border-neutral-800 dark:bg-neutral-900/50">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-full bg-white pr-8 pl-9 text-sm dark:bg-neutral-950"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute top-2.5 right-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Group
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Category
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Name
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Specification Count
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Description
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Stage
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Created At
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Created By
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Updated At
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Updated By
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={12}
                                            className="px-6 py-12 text-center text-sm text-neutral-500 italic"
                                        >
                                            No products found.
                                        </td>
                                    </tr>
                                )}
                                {filteredProducts.map((prod) => (
                                    <tr
                                        key={prod.id}
                                        className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                    >
                                        <td className="px-6 py-4 text-xs font-mono text-neutral-500 whitespace-nowrap">
                                            #{prod.id}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-neutral-900 whitespace-nowrap dark:text-neutral-100">
                                            {prod.group}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-700 whitespace-nowrap dark:text-neutral-300">
                                            <Badge variant="secondary" className="font-normal text-xs">
                                                {prod.category}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-neutral-900 whitespace-nowrap dark:text-neutral-100">
                                            {prod.name}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <Badge variant="outline" className="px-2 py-0.5 text-xs font-semibold">
                                                {prod.specifications_count ?? 0}
                                            </Badge>
                                        </td>
                                        <td className="max-w-xs truncate px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                                            {prod.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <StageBadge stage={prod.stage} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {formatDateTime(prod.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {prod.creator?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {formatDateTime(prod.updated_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {prod.updater?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <EditProductDialog product={prod} />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-neutral-400 hover:text-red-600"
                                                    onClick={() => setProductToDelete(prod)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Dialog
                open={productToDelete !== null}
                onOpenChange={(open) => !open && setProductToDelete(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Product</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete product{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                                {productToDelete?.name}
                            </span>
                            ? This will also remove associated specifications and prices.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setProductToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => productToDelete && handleDelete(productToDelete)}
                        >
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function AddProductDialog() {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        group: '',
        category: '',
        name: '',
        description: '',
        stage: 'Revision' as Stage,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(ProductController.store().url, {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 rounded-lg shadow-sm">
                    <Plus className="h-4 w-4" />
                    Add Product
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Add Product</DialogTitle>
                    <DialogDescription>
                        Create a new product item in the master catalog.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="create_group">Group</Label>
                        <Input
                            id="create_group"
                            placeholder="e.g. Heavy Equipment"
                            value={data.group}
                            onChange={(e) => setData('group', e.target.value)}
                        />
                        {errors.group && (
                            <p className="text-xs font-medium text-red-500">{errors.group}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_category">Category</Label>
                        <Input
                            id="create_category"
                            placeholder="e.g. Filters"
                            value={data.category}
                            onChange={(e) => setData('category', e.target.value)}
                        />
                        {errors.category && (
                            <p className="text-xs font-medium text-red-500">{errors.category}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_name">Name</Label>
                        <Input
                            id="create_name"
                            placeholder="e.g. Fuel Water Separator"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-xs font-medium text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_description">Description</Label>
                        <Textarea
                            id="create_description"
                            placeholder="Optional description..."
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-xs font-medium text-red-500">{errors.description}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_stage">Stage</Label>
                        <Select
                            value={data.stage}
                            onValueChange={(val: Stage) => setData('stage', val)}
                        >
                            <SelectTrigger id="create_stage" className="bg-white dark:bg-neutral-900">
                                <SelectValue placeholder="Select Stage" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Revision">Revision</SelectItem>
                                <SelectItem value="Ready">Ready</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.stage && (
                            <p className="text-xs font-medium text-red-500">{errors.stage}</p>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setOpen(false);
                                reset();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Save Product
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditProductDialog({ product }: { product: Product }) {
    const [open, setOpen] = useState(false);
    const { data, setData, put, processing, errors, reset } = useForm({
        group: product.group,
        category: product.category,
        name: product.name,
        description: product.description || '',
        stage: product.stage,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(ProductController.update({ product: product.id }).url, {
            onSuccess: () => {
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_group_${product.id}`}>Group</Label>
                        <Input
                            id={`edit_group_${product.id}`}
                            value={data.group}
                            onChange={(e) => setData('group', e.target.value)}
                        />
                        {errors.group && (
                            <p className="text-xs font-medium text-red-500">{errors.group}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_category_${product.id}`}>Category</Label>
                        <Input
                            id={`edit_category_${product.id}`}
                            value={data.category}
                            onChange={(e) => setData('category', e.target.value)}
                        />
                        {errors.category && (
                            <p className="text-xs font-medium text-red-500">{errors.category}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_name_${product.id}`}>Name</Label>
                        <Input
                            id={`edit_name_${product.id}`}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-xs font-medium text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_description_${product.id}`}>Description</Label>
                        <Textarea
                            id={`edit_description_${product.id}`}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-xs font-medium text-red-500">{errors.description}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_stage_${product.id}`}>Stage</Label>
                        <Select
                            value={data.stage}
                            onValueChange={(val: Stage) => setData('stage', val)}
                        >
                            <SelectTrigger id={`edit_stage_${product.id}`} className="bg-white dark:bg-neutral-900">
                                <SelectValue placeholder="Select Stage" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Revision">Revision</SelectItem>
                                <SelectItem value="Ready">Ready</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.stage && (
                            <p className="text-xs font-medium text-red-500">{errors.stage}</p>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setOpen(false);
                                reset();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Update Product
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

ProductsDataIndex.layout = {
    breadcrumbs: [
        { title: 'Feature Master', href: productsIndex().url },
        { title: 'Products', href: productsIndex().url },
        { title: 'Data', href: productsIndex().url },
    ],
};
