import { Head, router } from '@inertiajs/react';
import {
    Search,
    UserCheck,
    UserX,
    Users as UsersIcon,
    ShieldAlert,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { promote, demote, index as superAdminUsersIndex } from '@/routes/super-admin/users';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'user';
    created_at: string;
}

export default function SuperAdminUsersIndex({
    users,
}: {
    users: User[];
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmAction, setConfirmAction] = useState<{
        userId: number;
        userName: string;
        action: 'promote' | 'demote';
    } | null>(null);

    const filteredUsers = users.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePromote = (userId: number, userName: string) => {
        setConfirmAction({
            userId,
            userName,
            action: 'promote',
        });
    };

    const handleDemote = (userId: number, userName: string) => {
        setConfirmAction({
            userId,
            userName,
            action: 'demote',
        });
    };

    return (
        <>
            <Head title="Manage Users" />

            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                        Manage Users
                    </h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Promote regular users to Admin or demote Admins back to regular users.
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="flex flex-col items-center justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 p-4 sm:flex-row dark:border-neutral-800 dark:bg-neutral-900/50">
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-neutral-400" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-9 bg-white dark:bg-neutral-900"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-200 bg-neutral-50/50 text-xs font-semibold text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/50">
                                    <th className="px-6 py-4">User Details</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Joined Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((u) => (
                                        <tr
                                            key={u.id}
                                            className="hover:bg-neutral-50/50 transition-colors dark:hover:bg-neutral-800/20"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                        <UsersIcon className="h-4.5 w-4.5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-neutral-900 dark:text-neutral-50">
                                                            {u.name}
                                                        </div>
                                                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                                            {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {u.role === 'super_admin' ? (
                                                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-none dark:bg-purple-900/30 dark:text-purple-300">
                                                        Super Admin
                                                    </Badge>
                                                ) : u.role === 'admin' ? (
                                                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none dark:bg-blue-900/30 dark:text-blue-300">
                                                        Admin
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="border-none">
                                                        Regular User
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-neutral-500 dark:text-neutral-400">
                                                {new Date(u.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {u.role === 'user' ? (
                                                    <Button
                                                        onClick={() => handlePromote(u.id, u.name)}
                                                        size="sm"
                                                        className="gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200"
                                                    >
                                                        <UserCheck className="h-4 w-4" />
                                                        Promote to Admin
                                                    </Button>
                                                ) : u.role === 'admin' ? (
                                                    <Button
                                                        onClick={() => handleDemote(u.id, u.name)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/30"
                                                    >
                                                        <UserX className="h-4 w-4" />
                                                        Demote to User
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-neutral-400 italic">
                                                        No Actions Available
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <ShieldAlert className="h-8 w-8 text-neutral-400" />
                                                <div className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                                                    No users found
                                                </div>
                                                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    Try search query with another keyword.
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {confirmAction?.action === 'promote' ? 'Promote to Admin' : 'Demote to User'}
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to {confirmAction?.action === 'promote' ? 'promote' : 'demote'}{' '}
                            <span className="font-semibold text-neutral-900 dark:text-neutral-50">{confirmAction?.userName}</span>{' '}
                            {confirmAction?.action === 'promote' ? 'to an Admin role' : 'to a regular User role'}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 justify-end mt-4">
                        <Button variant="outline" onClick={() => setConfirmAction(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant={confirmAction?.action === 'promote' ? 'default' : 'destructive'}
                            onClick={() => {
                                if (confirmAction) {
                                    if (confirmAction.action === 'promote') {
                                        router.patch(promote(confirmAction.userId).url, {}, {
                                            preserveScroll: true,
                                        });
                                    } else {
                                        router.patch(demote(confirmAction.userId).url, {}, {
                                            preserveScroll: true,
                                        });
                                    }

                                    setConfirmAction(null);
                                }
                            }}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

SuperAdminUsersIndex.layout = {
    breadcrumbs: [{ title: 'Manage Users', href: superAdminUsersIndex().url }],
};
