import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, X, Edit2, Trash2, Tag } from 'lucide-react';
import { useState } from 'react';
import * as PriceController from '@/actions/App/Http/Controllers/Master/PriceController';
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
import { index as pricesIndex } from '@/routes/master/prices';
import type { Price, Stage } from '@/types/master';

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

function formatPrice(amount: string | number, currency: string = 'IDR'): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(num)) {
return '-';
}

    return `${currency} ${num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

interface ProductWithSpecs {
    id: number;
    name: string;
    specifications?: {
        id: number;
        product_id: number;
        name: string;
        part_number: string | null;
        measurement_unit: string | null;
    }[];
}

export default function PricesIndex({
    prices = [],
    products = [],
}: {
    prices: Price[];
    products: ProductWithSpecs[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [priceToDelete, setPriceToDelete] = useState<Price | null>(null);

    const filteredPrices = prices.filter((p) => {
        const query = searchQuery.toLowerCase();

        return (
            p.vendor.toLowerCase().includes(query) ||
            p.group.toLowerCase().includes(query) ||
            (p.product?.name && p.product.name.toLowerCase().includes(query)) ||
            (p.specification?.name && p.specification.name.toLowerCase().includes(query)) ||
            (p.specification?.part_number &&
                p.specification.part_number.toLowerCase().includes(query)) ||
            p.currency.toLowerCase().includes(query)
        );
    });

    const handleDelete = (p: Price) => {
        router.delete(PriceController.destroy({ price: p.id }).url, {
            preserveScroll: true,
            onSuccess: () => setPriceToDelete(null),
        });
    };

    const tabs = [
        {
            label: 'Prices',
            href: pricesIndex().url,
            icon: Tag,
        },
    ];

    return (
        <>
            <Head title="Prices - Feature Master" />
            <div className="p-6">
                <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Prices
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Manage vendor quotations, unit prices, and price change history.
                        </p>
                    </div>
                    <AddPriceDialog products={products} />
                </div>

                <div className="mb-6">
                    <MasterTabs tabs={tabs} />
                </div>

                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-col items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 p-4 sm:flex-row dark:border-neutral-800 dark:bg-neutral-900/50">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search prices by vendor, product, spec..."
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
                                        Vendor
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Product
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Specification
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Part Number
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Measurement Unit
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Currency
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Price
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Last Price
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
                                {filteredPrices.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={16}
                                            className="px-6 py-12 text-center text-sm text-neutral-500 italic"
                                        >
                                            No price records found.
                                        </td>
                                    </tr>
                                )}
                                {filteredPrices.map((p) => (
                                    <tr
                                        key={p.id}
                                        className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                    >
                                        <td className="px-6 py-4 text-xs font-mono text-neutral-500 whitespace-nowrap">
                                            #{p.id}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-neutral-900 whitespace-nowrap dark:text-neutral-100">
                                            {p.group}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-neutral-900 whitespace-nowrap dark:text-neutral-100">
                                            {p.vendor}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-700 whitespace-nowrap dark:text-neutral-300">
                                            {p.product?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-700 whitespace-nowrap dark:text-neutral-300">
                                            {p.specification?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-mono text-neutral-600 whitespace-nowrap dark:text-neutral-300">
                                            {p.specification?.part_number || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600 whitespace-nowrap dark:text-neutral-300">
                                            <Badge variant="outline" className="text-xs font-normal">
                                                {p.specification?.measurement_unit || '-'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-neutral-700 whitespace-nowrap dark:text-neutral-300">
                                            {p.currency}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-neutral-900 whitespace-nowrap dark:text-neutral-100">
                                            {formatPrice(p.price, p.currency)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {p.last_price ? formatPrice(p.last_price, p.currency) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <StageBadge stage={p.stage} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {formatDateTime(p.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {p.creator?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {formatDateTime(p.updated_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {p.updater?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <EditPriceDialog price={p} products={products} />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-neutral-400 hover:text-red-600"
                                                    onClick={() => setPriceToDelete(p)}
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
                open={priceToDelete !== null}
                onOpenChange={(open) => !open && setPriceToDelete(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Price Record</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this price record for vendor{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                                {priceToDelete?.vendor}
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPriceToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => priceToDelete && handleDelete(priceToDelete)}
                        >
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function AddPriceDialog({ products }: { products: ProductWithSpecs[] }) {
    const [open, setOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string>('');

    const { data, setData, post, processing, errors, reset } = useForm({
        product_specification_id: '',
        group: '',
        vendor: '',
        currency: 'IDR',
        price: '',
        last_price: '',
        stage: 'Revision' as Stage,
    });

    const activeProduct = products.find((p) => p.id.toString() === selectedProductId);
    const availableSpecs = activeProduct?.specifications || [];

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(PriceController.store().url, {
            onSuccess: () => {
                setOpen(false);
                reset();
                setSelectedProductId('');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 rounded-lg shadow-sm">
                    <Plus className="h-4 w-4" />
                    Add Price
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Add Price Record</DialogTitle>
                    <DialogDescription>
                        Record a vendor quotation or price for a product specification.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label>1. Select Product</Label>
                        <Select
                            value={selectedProductId}
                            onValueChange={(val) => {
                                setSelectedProductId(val);
                                setData('product_specification_id', '');
                            }}
                        >
                            <SelectTrigger className="bg-white dark:bg-neutral-900">
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
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_spec_id">2. Select Specification</Label>
                        <Select
                            value={data.product_specification_id}
                            onValueChange={(val) => setData('product_specification_id', val)}
                            disabled={!selectedProductId || availableSpecs.length === 0}
                        >
                            <SelectTrigger id="create_spec_id" className="bg-white dark:bg-neutral-900">
                                <SelectValue
                                    placeholder={
                                        !selectedProductId
                                            ? 'Select a product first'
                                            : availableSpecs.length === 0
                                              ? 'No specifications found for product'
                                              : 'Select Specification'
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {availableSpecs.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        {s.name} {s.part_number ? `(${s.part_number})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.product_specification_id && (
                            <p className="text-xs font-medium text-red-500">
                                {errors.product_specification_id}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="create_group">Group</Label>
                            <Input
                                id="create_group"
                                placeholder="e.g. OEM Procurement"
                                value={data.group}
                                onChange={(e) => setData('group', e.target.value)}
                            />
                            {errors.group && (
                                <p className="text-xs font-medium text-red-500">{errors.group}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="create_vendor">Vendor</Label>
                            <Input
                                id="create_vendor"
                                placeholder="e.g. PT Supplierindo"
                                value={data.vendor}
                                onChange={(e) => setData('vendor', e.target.value)}
                            />
                            {errors.vendor && (
                                <p className="text-xs font-medium text-red-500">{errors.vendor}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="create_currency">Currency</Label>
                            <Input
                                id="create_currency"
                                placeholder="IDR"
                                value={data.currency}
                                onChange={(e) => setData('currency', e.target.value)}
                            />
                            {errors.currency && (
                                <p className="text-xs font-medium text-red-500">{errors.currency}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="create_price">Price</Label>
                            <Input
                                id="create_price"
                                type="number"
                                step="any"
                                placeholder="10000"
                                value={data.price}
                                onChange={(e) => setData('price', e.target.value)}
                            />
                            {errors.price && (
                                <p className="text-xs font-medium text-red-500">{errors.price}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="create_last_price">Last Price</Label>
                            <Input
                                id="create_last_price"
                                type="number"
                                step="any"
                                placeholder="Optional"
                                value={data.last_price}
                                onChange={(e) => setData('last_price', e.target.value)}
                            />
                            {errors.last_price && (
                                <p className="text-xs font-medium text-red-500">
                                    {errors.last_price}
                                </p>
                            )}
                        </div>
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
                                setSelectedProductId('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Save Price
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditPriceDialog({
    price,
    products,
}: {
    price: Price;
    products: ProductWithSpecs[];
}) {
    const [open, setOpen] = useState(false);
    const initialProductId = price.product_id?.toString() || '';
    const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId);

    const { data, setData, put, processing, errors, reset } = useForm({
        product_specification_id: price.product_specification_id.toString(),
        group: price.group,
        vendor: price.vendor,
        currency: price.currency,
        price: price.price.toString(),
        last_price: price.last_price ? price.last_price.toString() : '',
        stage: price.stage,
    });

    const activeProduct = products.find((p) => p.id.toString() === selectedProductId);
    const availableSpecs = activeProduct?.specifications || [];

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(PriceController.update({ price: price.id }).url, {
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
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Edit Price Record</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label>1. Product</Label>
                        <Select
                            value={selectedProductId}
                            onValueChange={(val) => {
                                setSelectedProductId(val);
                                setData('product_specification_id', '');
                            }}
                        >
                            <SelectTrigger className="bg-white dark:bg-neutral-900">
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
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_spec_${price.id}`}>2. Specification</Label>
                        <Select
                            value={data.product_specification_id}
                            onValueChange={(val) => setData('product_specification_id', val)}
                        >
                            <SelectTrigger
                                id={`edit_spec_${price.id}`}
                                className="bg-white dark:bg-neutral-900"
                            >
                                <SelectValue placeholder="Select Specification" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableSpecs.map((s) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>
                                        {s.name} {s.part_number ? `(${s.part_number})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.product_specification_id && (
                            <p className="text-xs font-medium text-red-500">
                                {errors.product_specification_id}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor={`edit_group_${price.id}`}>Group</Label>
                            <Input
                                id={`edit_group_${price.id}`}
                                value={data.group}
                                onChange={(e) => setData('group', e.target.value)}
                            />
                            {errors.group && (
                                <p className="text-xs font-medium text-red-500">{errors.group}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor={`edit_vendor_${price.id}`}>Vendor</Label>
                            <Input
                                id={`edit_vendor_${price.id}`}
                                value={data.vendor}
                                onChange={(e) => setData('vendor', e.target.value)}
                            />
                            {errors.vendor && (
                                <p className="text-xs font-medium text-red-500">{errors.vendor}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor={`edit_currency_${price.id}`}>Currency</Label>
                            <Input
                                id={`edit_currency_${price.id}`}
                                value={data.currency}
                                onChange={(e) => setData('currency', e.target.value)}
                            />
                            {errors.currency && (
                                <p className="text-xs font-medium text-red-500">{errors.currency}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor={`edit_price_${price.id}`}>Price</Label>
                            <Input
                                id={`edit_price_${price.id}`}
                                type="number"
                                step="any"
                                value={data.price}
                                onChange={(e) => setData('price', e.target.value)}
                            />
                            {errors.price && (
                                <p className="text-xs font-medium text-red-500">{errors.price}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor={`edit_last_price_${price.id}`}>Last Price</Label>
                            <Input
                                id={`edit_last_price_${price.id}`}
                                type="number"
                                step="any"
                                value={data.last_price}
                                onChange={(e) => setData('last_price', e.target.value)}
                            />
                            {errors.last_price && (
                                <p className="text-xs font-medium text-red-500">
                                    {errors.last_price}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_stage_${price.id}`}>Stage</Label>
                        <Select
                            value={data.stage}
                            onValueChange={(val: Stage) => setData('stage', val)}
                        >
                            <SelectTrigger
                                id={`edit_stage_${price.id}`}
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
                            Update Price
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

PricesIndex.layout = {
    breadcrumbs: [
        { title: 'Feature Master', href: pricesIndex().url },
        { title: 'Prices', href: pricesIndex().url },
    ],
};
