import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, X, Edit2, Trash2, Database, Cpu } from 'lucide-react';
import { useState } from 'react';
import * as ProductSpecificationController from '@/actions/App/Http/Controllers/Master/ProductSpecificationController';
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
import type { ProductSpecification, Stage } from '@/types/master';

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

export default function ProductSpecificationsIndex({
    specifications = [],
    products = [],
}: {
    specifications: ProductSpecification[];
    products: { id: number; name: string; group?: string }[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [specToDelete, setSpecToDelete] = useState<ProductSpecification | null>(null);

    const filteredSpecifications = specifications.filter((spec) => {
        const query = searchQuery.toLowerCase();

        return (
            spec.name.toLowerCase().includes(query) ||
            spec.group.toLowerCase().includes(query) ||
            (spec.product?.name && spec.product.name.toLowerCase().includes(query)) ||
            (spec.part_number && spec.part_number.toLowerCase().includes(query)) ||
            (spec.measurement_unit && spec.measurement_unit.toLowerCase().includes(query)) ||
            (spec.description && spec.description.toLowerCase().includes(query))
        );
    });

    const handleDelete = (spec: ProductSpecification) => {
        router.delete(
            ProductSpecificationController.destroy({ specification: spec.id }).url,
            {
                preserveScroll: true,
                onSuccess: () => setSpecToDelete(null),
            },
        );
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
            <Head title="Product Specifications - Feature Master" />
            <div className="p-6">
                <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Products
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Manage product specifications, technical details, and part numbers.
                        </p>
                    </div>
                    <AddSpecificationDialog products={products} />
                </div>

                <div className="mb-6">
                    <MasterTabs tabs={tabs} />
                </div>

                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-col items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 p-4 sm:flex-row dark:border-neutral-800 dark:bg-neutral-900/50">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search specifications..."
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
                                        Product
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Name
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Part Number
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Measurement Unit
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Price Count
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
                                {filteredSpecifications.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={14}
                                            className="px-6 py-12 text-center text-sm text-neutral-500 italic"
                                        >
                                            No product specifications found.
                                        </td>
                                    </tr>
                                )}
                                {filteredSpecifications.map((spec) => (
                                    <tr
                                        key={spec.id}
                                        className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                    >
                                        <td className="px-6 py-4 text-xs font-mono text-neutral-500 whitespace-nowrap">
                                            #{spec.id}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-neutral-900 whitespace-nowrap dark:text-neutral-100">
                                            {spec.group}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-700 whitespace-nowrap dark:text-neutral-300">
                                            {spec.product?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-neutral-900 whitespace-nowrap dark:text-neutral-100">
                                            {spec.name}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-neutral-600 whitespace-nowrap dark:text-neutral-300">
                                            {spec.part_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600 whitespace-nowrap dark:text-neutral-300">
                                            <Badge variant="outline" className="text-xs font-normal">
                                                {spec.measurement_unit || '-'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold">
                                                {spec.prices_count ?? 0}
                                            </Badge>
                                        </td>
                                        <td className="max-w-xs truncate px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                                            {spec.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <StageBadge stage={spec.stage} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {formatDateTime(spec.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {spec.creator?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {formatDateTime(spec.updated_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {spec.updater?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <EditSpecificationDialog
                                                    specification={spec}
                                                    products={products}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-neutral-400 hover:text-red-600"
                                                    onClick={() => setSpecToDelete(spec)}
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
                open={specToDelete !== null}
                onOpenChange={(open) => !open && setSpecToDelete(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Product Specification</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete specification{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                                {specToDelete?.name}
                            </span>
                            ? This will also remove associated prices.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setSpecToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => specToDelete && handleDelete(specToDelete)}
                        >
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function AddSpecificationDialog({
    products,
}: {
    products: { id: number; name: string }[];
}) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: '',
        group: '',
        name: '',
        part_number: '',
        measurement_unit: 'PCS',
        description: '',
        stage: 'Revision' as Stage,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(ProductSpecificationController.store().url, {
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
                    Add Specification
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Add Product Specification</DialogTitle>
                    <DialogDescription>
                        Define specification details, part number, and unit for a product.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="create_product_id">Product</Label>
                        <Select
                            value={data.product_id}
                            onValueChange={(val) => setData('product_id', val)}
                        >
                            <SelectTrigger id="create_product_id" className="bg-white dark:bg-neutral-900">
                                <SelectValue placeholder="Select Product" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.product_id && (
                            <p className="text-xs font-medium text-red-500">{errors.product_id}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_group">Group</Label>
                        <Input
                            id="create_group"
                            placeholder="e.g. Standard Spec"
                            value={data.group}
                            onChange={(e) => setData('group', e.target.value)}
                        />
                        {errors.group && (
                            <p className="text-xs font-medium text-red-500">{errors.group}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_name">Specification Name</Label>
                        <Input
                            id="create_name"
                            placeholder="e.g. 10 Micron Standard"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-xs font-medium text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="create_part_number">Part Number</Label>
                            <Input
                                id="create_part_number"
                                placeholder="e.g. PN-12345"
                                value={data.part_number}
                                onChange={(e) => setData('part_number', e.target.value)}
                            />
                            {errors.part_number && (
                                <p className="text-xs font-medium text-red-500">
                                    {errors.part_number}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="create_measurement_unit">Measurement Unit</Label>
                            <Input
                                id="create_measurement_unit"
                                placeholder="e.g. PCS, UNIT, SET"
                                value={data.measurement_unit}
                                onChange={(e) => setData('measurement_unit', e.target.value)}
                            />
                            {errors.measurement_unit && (
                                <p className="text-xs font-medium text-red-500">
                                    {errors.measurement_unit}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_description">Description</Label>
                        <Textarea
                            id="create_description"
                            placeholder="Optional technical notes..."
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
                            Save Specification
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditSpecificationDialog({
    specification,
    products,
}: {
    specification: ProductSpecification;
    products: { id: number; name: string }[];
}) {
    const [open, setOpen] = useState(false);
    const { data, setData, put, processing, errors, reset } = useForm({
        product_id: specification.product_id.toString(),
        group: specification.group,
        name: specification.name,
        part_number: specification.part_number || '',
        measurement_unit: specification.measurement_unit || '',
        description: specification.description || '',
        stage: specification.stage,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(
            ProductSpecificationController.update({ specification: specification.id }).url,
            {
                onSuccess: () => {
                    setOpen(false);
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Edit Product Specification</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_product_${specification.id}`}>Product</Label>
                        <Select
                            value={data.product_id}
                            onValueChange={(val) => setData('product_id', val)}
                        >
                            <SelectTrigger
                                id={`edit_product_${specification.id}`}
                                className="bg-white dark:bg-neutral-900"
                            >
                                <SelectValue placeholder="Select Product" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.product_id && (
                            <p className="text-xs font-medium text-red-500">{errors.product_id}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_group_${specification.id}`}>Group</Label>
                        <Input
                            id={`edit_group_${specification.id}`}
                            value={data.group}
                            onChange={(e) => setData('group', e.target.value)}
                        />
                        {errors.group && (
                            <p className="text-xs font-medium text-red-500">{errors.group}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_name_${specification.id}`}>Specification Name</Label>
                        <Input
                            id={`edit_name_${specification.id}`}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-xs font-medium text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor={`edit_part_number_${specification.id}`}>Part Number</Label>
                            <Input
                                id={`edit_part_number_${specification.id}`}
                                value={data.part_number}
                                onChange={(e) => setData('part_number', e.target.value)}
                            />
                            {errors.part_number && (
                                <p className="text-xs font-medium text-red-500">
                                    {errors.part_number}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor={`edit_unit_${specification.id}`}>Measurement Unit</Label>
                            <Input
                                id={`edit_unit_${specification.id}`}
                                value={data.measurement_unit}
                                onChange={(e) => setData('measurement_unit', e.target.value)}
                            />
                            {errors.measurement_unit && (
                                <p className="text-xs font-medium text-red-500">
                                    {errors.measurement_unit}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_description_${specification.id}`}>Description</Label>
                        <Textarea
                            id={`edit_description_${specification.id}`}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-xs font-medium text-red-500">{errors.description}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_stage_${specification.id}`}>Stage</Label>
                        <Select
                            value={data.stage}
                            onValueChange={(val: Stage) => setData('stage', val)}
                        >
                            <SelectTrigger
                                id={`edit_stage_${specification.id}`}
                                className="bg-white dark:bg-neutral-900"
                            >
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
                            Update Specification
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

ProductSpecificationsIndex.layout = {
    breadcrumbs: [
        { title: 'Feature Master', href: productSpecificationsIndex().url },
        { title: 'Products', href: productsIndex().url },
        { title: 'Specification', href: productSpecificationsIndex().url },
    ],
};
