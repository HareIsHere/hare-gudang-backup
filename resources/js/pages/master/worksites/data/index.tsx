import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, X, Edit2, Trash2, Layers, Database } from 'lucide-react';
import { useState } from 'react';
import * as WorksiteController from '@/actions/App/Http/Controllers/Master/WorksiteController';
import { MasterTabs } from '@/components/master-tabs';
import { StageBadge } from '@/components/stage-badge';
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
import { index as worksiteCategoriesIndex } from '@/routes/master/worksites/categories';
import { index as worksitesIndex } from '@/routes/master/worksites/data';
import type { Worksite, Stage } from '@/types/master';

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

export default function WorksiteDataIndex({
    worksites = [],
    categories = [],
}: {
    worksites: Worksite[];
    categories: { id: number; name: string; group?: string }[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [worksiteToDelete, setWorksiteToDelete] = useState<Worksite | null>(null);

    const filteredWorksites = worksites.filter((ws) => {
        const query = searchQuery.toLowerCase();

        return (
            ws.name.toLowerCase().includes(query) ||
            ws.group.toLowerCase().includes(query) ||
            (ws.category?.name && ws.category.name.toLowerCase().includes(query)) ||
            (ws.address && ws.address.toLowerCase().includes(query)) ||
            (ws.description && ws.description.toLowerCase().includes(query))
        );
    });

    const handleDelete = (ws: Worksite) => {
        router.delete(WorksiteController.destroy({ worksite: ws.id }).url, {
            preserveScroll: true,
            onSuccess: () => setWorksiteToDelete(null),
        });
    };

    const tabs = [
        {
            label: 'Categories',
            href: worksiteCategoriesIndex().url,
            icon: Layers,
        },
        {
            label: 'Data',
            href: worksitesIndex().url,
            icon: Database,
        },
    ];

    return (
        <>
            <Head title="Worksite Data - Feature Master" />
            <div className="p-6">
                <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Worksite
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Manage worksite locations, facilities, and project sites.
                        </p>
                    </div>
                    <AddWorksiteDialog categories={categories} />
                </div>

                <div className="mb-6">
                    <MasterTabs tabs={tabs} />
                </div>

                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-col items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 p-4 sm:flex-row dark:border-neutral-800 dark:bg-neutral-900/50">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search worksites..."
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
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Address
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
                                {filteredWorksites.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={12}
                                            className="px-6 py-12 text-center text-sm text-neutral-500 italic"
                                        >
                                            No worksite data found.
                                        </td>
                                    </tr>
                                )}
                                {filteredWorksites.map((ws) => (
                                    <tr
                                        key={ws.id}
                                        className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                    >
                                        <td className="px-6 py-4 text-xs font-mono text-neutral-500 whitespace-nowrap">
                                            #{ws.id}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-neutral-900 whitespace-nowrap dark:text-neutral-100">
                                            {ws.group}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-700 whitespace-nowrap dark:text-neutral-300">
                                            {ws.category?.name || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-neutral-900 whitespace-nowrap dark:text-neutral-100">
                                            {ws.name}
                                        </td>
                                        <td className="max-w-xs truncate px-6 py-4 text-sm text-neutral-600 dark:text-neutral-300">
                                            {ws.address || '-'}
                                        </td>
                                        <td className="max-w-xs truncate px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                                            {ws.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <StageBadge stage={ws.stage} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {formatDateTime(ws.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {ws.creator?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {formatDateTime(ws.updated_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {ws.updater?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <EditWorksiteDialog worksite={ws} categories={categories} />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-neutral-400 hover:text-red-600"
                                                    onClick={() => setWorksiteToDelete(ws)}
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
                open={worksiteToDelete !== null}
                onOpenChange={(open) => !open && setWorksiteToDelete(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Worksite</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete worksite{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                                {worksiteToDelete?.name}
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setWorksiteToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => worksiteToDelete && handleDelete(worksiteToDelete)}
                        >
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function AddWorksiteDialog({
    categories,
}: {
    categories: { id: number; name: string }[];
}) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        worksite_category_id: '',
        group: '',
        name: '',
        address: '',
        description: '',
        stage: 'Revision' as Stage,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(WorksiteController.store().url, {
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
                    Add Worksite
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Add Worksite</DialogTitle>
                    <DialogDescription>
                        Create a new worksite location or facility.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="create_group">Group</Label>
                        <Input
                            id="create_group"
                            placeholder="e.g. South Region"
                            value={data.group}
                            onChange={(e) => setData('group', e.target.value)}
                        />
                        {errors.group && (
                            <p className="text-xs font-medium text-red-500">{errors.group}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_category">Category</Label>
                        <Select
                            value={data.worksite_category_id}
                            onValueChange={(val) => setData('worksite_category_id', val)}
                        >
                            <SelectTrigger id="create_category" className="bg-white dark:bg-neutral-900">
                                <SelectValue placeholder="Select Category (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.worksite_category_id && (
                            <p className="text-xs font-medium text-red-500">
                                {errors.worksite_category_id}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_name">Name</Label>
                        <Input
                            id="create_name"
                            placeholder="e.g. Jetty Port 1"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-xs font-medium text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_address">Address</Label>
                        <Input
                            id="create_address"
                            placeholder="e.g. Km 12 Coastal Highway"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                        />
                        {errors.address && (
                            <p className="text-xs font-medium text-red-500">{errors.address}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_description">Description</Label>
                        <Textarea
                            id="create_description"
                            placeholder="Optional notes or details..."
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
                            Save Worksite
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditWorksiteDialog({
    worksite,
    categories,
}: {
    worksite: Worksite;
    categories: { id: number; name: string }[];
}) {
    const [open, setOpen] = useState(false);
    const { data, setData, put, processing, errors, reset } = useForm({
        worksite_category_id: worksite.worksite_category_id?.toString() || '',
        group: worksite.group,
        name: worksite.name,
        address: worksite.address || '',
        description: worksite.description || '',
        stage: worksite.stage,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(WorksiteController.update({ worksite: worksite.id }).url, {
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
                    <DialogTitle>Edit Worksite</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_group_${worksite.id}`}>Group</Label>
                        <Input
                            id={`edit_group_${worksite.id}`}
                            value={data.group}
                            onChange={(e) => setData('group', e.target.value)}
                        />
                        {errors.group && (
                            <p className="text-xs font-medium text-red-500">{errors.group}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_category_${worksite.id}`}>Category</Label>
                        <Select
                            value={data.worksite_category_id}
                            onValueChange={(val) => setData('worksite_category_id', val)}
                        >
                            <SelectTrigger
                                id={`edit_category_${worksite.id}`}
                                className="bg-white dark:bg-neutral-900"
                            >
                                <SelectValue placeholder="Select Category (Optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.worksite_category_id && (
                            <p className="text-xs font-medium text-red-500">
                                {errors.worksite_category_id}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_name_${worksite.id}`}>Name</Label>
                        <Input
                            id={`edit_name_${worksite.id}`}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-xs font-medium text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_address_${worksite.id}`}>Address</Label>
                        <Input
                            id={`edit_address_${worksite.id}`}
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                        />
                        {errors.address && (
                            <p className="text-xs font-medium text-red-500">{errors.address}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_description_${worksite.id}`}>Description</Label>
                        <Textarea
                            id={`edit_description_${worksite.id}`}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-xs font-medium text-red-500">{errors.description}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_stage_${worksite.id}`}>Stage</Label>
                        <Select
                            value={data.stage}
                            onValueChange={(val: Stage) => setData('stage', val)}
                        >
                            <SelectTrigger
                                id={`edit_stage_${worksite.id}`}
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
                            Update Worksite
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

WorksiteDataIndex.layout = {
    breadcrumbs: [
        { title: 'Feature Master', href: worksitesIndex().url },
        { title: 'Worksite', href: worksitesIndex().url },
        { title: 'Data', href: worksitesIndex().url },
    ],
};
