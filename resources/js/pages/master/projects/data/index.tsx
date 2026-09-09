import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Search, X, Edit2, Trash2, Database } from 'lucide-react';
import { useState } from 'react';
import * as ProjectController from '@/actions/App/Http/Controllers/Master/ProjectController';
import { MasterTabs } from '@/components/master-tabs';
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
import { Textarea } from '@/components/ui/textarea';
import { index as projectsIndex } from '@/routes/master/projects/data';
import type { Project } from '@/types/master';

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

export default function ProjectsDataIndex({
    projects = [],
}: {
    projects: Project[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    const filteredProjects = projects.filter((proj) => {
        const query = searchQuery.toLowerCase();

        return (
            proj.name.toLowerCase().includes(query) ||
            proj.group.toLowerCase().includes(query) ||
            (proj.description && proj.description.toLowerCase().includes(query))
        );
    });

    const handleDelete = (proj: Project) => {
        router.delete(ProjectController.destroy({ project: proj.id }).url, {
            preserveScroll: true,
            onSuccess: () => setProjectToDelete(null),
        });
    };

    const tabs = [
        {
            label: 'Data',
            href: projectsIndex().url,
            icon: Database,
        },
    ];

    return (
        <>
            <Head title="Projects Data - Feature Master" />
            <div className="p-6">
                <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Projects
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Manage projects, development initiatives, and progress tracking.
                        </p>
                    </div>
                    <AddProjectDialog />
                </div>

                <div className="mb-6">
                    <MasterTabs tabs={tabs} />
                </div>

                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-col items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 p-4 sm:flex-row dark:border-neutral-800 dark:bg-neutral-900/50">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search projects..."
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
                                        Progress
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                        Description
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
                                {filteredProjects.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-6 py-12 text-center text-sm text-neutral-500 italic"
                                        >
                                            No projects found.
                                        </td>
                                    </tr>
                                )}
                                {filteredProjects.map((proj) => (
                                    <tr
                                        key={proj.id}
                                        className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-neutral-900 whitespace-nowrap dark:text-neutral-100">
                                            {proj.group}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-neutral-900 whitespace-nowrap dark:text-neutral-100">
                                            {proj.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-24 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                                    <div
                                                        className="h-full bg-neutral-900 transition-all dark:bg-neutral-100"
                                                        style={{ width: `${Math.min(100, Math.max(0, proj.progress))}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                                    {proj.progress}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="max-w-xs truncate px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                                            {proj.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {formatDateTime(proj.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {proj.creator?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {formatDateTime(proj.updated_at)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-500 whitespace-nowrap dark:text-neutral-400">
                                            {proj.updater?.name ?? '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <EditProjectDialog project={proj} />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-neutral-400 hover:text-red-600"
                                                    onClick={() => setProjectToDelete(proj)}
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
                open={projectToDelete !== null}
                onOpenChange={(open) => !open && setProjectToDelete(null)}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete project{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-50">
                                {projectToDelete?.name}
                            </span>
                            ? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setProjectToDelete(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => projectToDelete && handleDelete(projectToDelete)}
                        >
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function AddProjectDialog() {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        group: '',
        name: '',
        progress: 0,
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(ProjectController.store().url, {
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
                    Add Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Add Project</DialogTitle>
                    <DialogDescription>
                        Register a new project initiative and set initial progress.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="create_group">Group</Label>
                        <Input
                            id="create_group"
                            placeholder="e.g. Infrastructure"
                            value={data.group}
                            onChange={(e) => setData('group', e.target.value)}
                        />
                        {errors.group && (
                            <p className="text-xs font-medium text-red-500">{errors.group}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_name">Name</Label>
                        <Input
                            id="create_name"
                            placeholder="e.g. Jetty Expansion Phase 2"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-xs font-medium text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_progress">Progress (%)</Label>
                        <Input
                            id="create_progress"
                            type="number"
                            min="0"
                            max="100"
                            value={data.progress.toString()}
                            onChange={(e) =>
                                setData('progress', parseInt(e.target.value) || 0)
                            }
                        />
                        {errors.progress && (
                            <p className="text-xs font-medium text-red-500">{errors.progress}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="create_description">Description</Label>
                        <Textarea
                            id="create_description"
                            placeholder="Optional notes or scope..."
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-xs font-medium text-red-500">{errors.description}</p>
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
                            Save Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditProjectDialog({ project }: { project: Project }) {
    const [open, setOpen] = useState(false);
    const { data, setData, put, processing, errors, reset } = useForm({
        group: project.group,
        name: project.name,
        progress: project.progress,
        description: project.description || '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(ProjectController.update({ project: project.id }).url, {
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
                    <DialogTitle>Edit Project</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_group_${project.id}`}>Group</Label>
                        <Input
                            id={`edit_group_${project.id}`}
                            value={data.group}
                            onChange={(e) => setData('group', e.target.value)}
                        />
                        {errors.group && (
                            <p className="text-xs font-medium text-red-500">{errors.group}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_name_${project.id}`}>Name</Label>
                        <Input
                            id={`edit_name_${project.id}`}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && (
                            <p className="text-xs font-medium text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_progress_${project.id}`}>Progress (%)</Label>
                        <Input
                            id={`edit_progress_${project.id}`}
                            type="number"
                            min="0"
                            max="100"
                            value={data.progress.toString()}
                            onChange={(e) =>
                                setData('progress', parseInt(e.target.value) || 0)
                            }
                        />
                        {errors.progress && (
                            <p className="text-xs font-medium text-red-500">{errors.progress}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor={`edit_description_${project.id}`}>Description</Label>
                        <Textarea
                            id={`edit_description_${project.id}`}
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-xs font-medium text-red-500">{errors.description}</p>
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
                            Update Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

ProjectsDataIndex.layout = {
    breadcrumbs: [
        { title: 'Feature Master', href: projectsIndex().url },
        { title: 'Projects', href: projectsIndex().url },
        { title: 'Data', href: projectsIndex().url },
    ],
};
