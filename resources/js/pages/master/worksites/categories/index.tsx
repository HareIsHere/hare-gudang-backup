import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, X, Edit2, Trash2, Layers, Database } from 'lucide-react';
import { useState } from 'react';
import * as WorksiteCategoryController from '@/actions/App/Http/Controllers/Master/WorksiteCategoryController';
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
import type { WorksiteCategory, Stage } from '@/types/master';

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

export default function WorksiteCategoriesIndex({
    categories = [],
}: {
    categories: WorksiteCategory[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryToDelete, setCategoryToDelete] =
        useState<WorksiteCategory | null>(null);

    const filteredCategories = categories.filter((cat) => {
        const query = searchQuery.toLowerCase();

        return (
            cat.name.toLowerCase().includes(query) ||
            cat.group.toLowerCase().includes(query) ||
            (cat.description && cat.description.toLowerCase().includes(query))
        );
    });

    const handleDelete = (cat: WorksiteCategory) => {
        router.delete(
            WorksiteCategoryController.destroy({ category: cat.id }).url,
            {
                preserveScroll: true,
                onSuccess: () => setCategoryToDelete(null),
            },
        );
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
            <Head title="Worksite Categories - Feature Master" />
            <div className="p-6">
                <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Worksite
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Manage worksite categories and site locations.
                        </p>
                    </div>
                    <AddCategoryDialog />
                </div>

                <div className="mb-6">
                    <MasterTabs tabs={tabs} />
                </div>

                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-col items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 p-4 sm:flex-row dark:border-neutral-800 dark:bg-neutral-900/50">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search by name or group..."
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
                                        Group
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Name
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
                                {filteredCategories.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-6 py-12 text-center text-sm text-neutral-500 italic"
                                        >
                                            No worksite categories found.
                                        </td>
                                    </tr>
                                )}
                                {filteredCategories.map((cat) => (
                                    <tr
                                        key={cat.id}
                                        className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-neutral-900 dark:text-neutral-100">
                                            {cat.group}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold whitespace-nowrap text-neutral-900 dark:text-neutral-100">
                                            {cat.name}
                                        </td>
                                        <td className="max-w-xs truncate px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                                            {cat.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <StageBadge stage={cat.stage} />
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                                            {formatDateTime(cat.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                                            {cat.creator?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                                            {formatDateTime(cat.updated_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                                            {cat.updater?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <EditCategoryDialog
                                                    category={cat}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-neutral-400 hover:text-red-600"
                                                    onClick={() =>
                                                        setCategoryToDelete(cat)
                                                    }
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
                open={categoryToDelete !== null}
                onOpenChange={(open) => !open && setCategoryToDelete(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Worksite Category</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete category{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                                {categoryToDelete?.name}
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setCategoryToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                categoryToDelete &&
                                handleDelete(categoryToDelete)
                            }
                        >
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function AddCategoryDialog() {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        group: '',
        name: '',
        description: '',
        stage: 'Revision' as Stage,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(WorksiteCategoryController.store().url, {
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
                    Add Category
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Add Worksite Category</DialogTitle>
                    <DialogDescription>
                        Create a new category for worksites.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="create_group">Group</Label>
                        <Input
                            id="create_group"
                            placeholder="e.g. Region A"
                            value={data.group}
                            onChange={(e) => setData('group', e.target.value)}
                        />
                        {errors.group && (
                            <p className="text-xs font-medium text-red-500">
                                {errors.group}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_name">Name</Label>
                        <Input
                            id="create_name"
                            placeholder="e.g. Offshore Operations"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-xs font-medium text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_description">Description</Label>
                        <Textarea
                            id="create_description"
                            placeholder="Optional description..."
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-xs font-medium text-red-500">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_stage">Stage</Label>
                        <Select
                            value={data.stage}
                            onValueChange={(val: Stage) =>
                                setData('stage', val)
                            }
                        >
                            <SelectTrigger
                                id="create_stage"
                                className="bg-white dark:bg-neutral-900"
                            >
                                <SelectValue placeholder="Select Stage" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Revision">
                                    Revision
                                </SelectItem>
                                <SelectItem value="Ready">Ready</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.stage && (
                            <p className="text-xs font-medium text-red-500">
                                {errors.stage}
                            </p>
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
                            Save Category
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditCategoryDialog({ category }: { category: WorksiteCategory }) {
    const [open, setOpen] = useState(false);
    const { data, setData, put, processing, errors, reset } = useForm({
        group: category.group,
        name: category.name,
        description: category.description || '',
        stage: category.stage,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(WorksiteCategoryController.update({ category: category.id }).url, {
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
                    <DialogTitle>Edit Worksite Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_group_${category.id}`}>
                            Group
                        </Label>
                        <Input
                            id={`edit_group_${category.id}`}
                            value={data.group}
                            onChange={(e) => setData('group', e.target.value)}
                        />
                        {errors.group && (
                            <p className="text-xs font-medium text-red-500">
                                {errors.group}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_name_${category.id}`}>Name</Label>
                        <Input
                            id={`edit_name_${category.id}`}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-xs font-medium text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_description_${category.id}`}>
                            Description
                        </Label>
                        <Textarea
                            id={`edit_description_${category.id}`}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-xs font-medium text-red-500">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_stage_${category.id}`}>
                            Stage
                        </Label>
                        <Select
                            value={data.stage}
                            onValueChange={(val: Stage) =>
                                setData('stage', val)
                            }
                        >
                            <SelectTrigger
                                id={`edit_stage_${category.id}`}
                                className="bg-white dark:bg-neutral-900"
                            >
                                <SelectValue placeholder="Select Stage" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Revision">
                                    Revision
                                </SelectItem>
                                <SelectItem value="Ready">Ready</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.stage && (
                            <p className="text-xs font-medium text-red-500">
                                {errors.stage}
                            </p>
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
                            Update Category
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

WorksiteCategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Feature Master', href: worksiteCategoriesIndex().url },
        { title: 'Worksite', href: worksiteCategoriesIndex().url },
        { title: 'Categories', href: worksiteCategoriesIndex().url },
    ],
};
