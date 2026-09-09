import { Head, usePage, router, usePoll } from '@inertiajs/react';
import {
    Warehouse,
    Ship,
    Truck,
    Loader2,
    Clock,
    Edit2,
    Save,
    Undo2,
    Shield,
    RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { updateStatus, updateMessage, resetMessages } from '@/routes/dashboard';

type StatusType = 'Idle' | 'Working';

interface ActivityRow {
    id: number;
    title: string;
    category: string;
    image: string;
    icon: React.ComponentType<{ className?: string }>;
    initialStatus: StatusType;
    details: Record<
        StatusType,
        {
            message: string;
            percent: number;
            color: string;
            bg: string;
            text: string;
            border: string;
            icon: React.ComponentType<{ className?: string }>;
            glow: string;
        }
    >;
}

const activities: ActivityRow[] = [
    {
        id: 1,
        title: 'Rimau Star',
        category: 'Built 2020',
        image: '/images/rimau-star.png',
        icon: Warehouse,
        initialStatus: 'Working',
        details: {
            Idle: {
                message:
                    'System is idle. Staged and ready for incoming cargo processing.',
                percent: 0,
                color: 'bg-neutral-500',
                bg: 'bg-neutral-50 dark:bg-neutral-900/50',
                text: 'text-neutral-600 dark:text-neutral-400',
                border: 'border-neutral-200 dark:border-neutral-800',
                icon: Clock,
                glow: 'shadow-neutral-500/10',
            },
            Working: {
                message:
                    'Active sorting. Robotic pickers are placing incoming items onto high-density storage shelves.',
                percent: 65,
                color: 'bg-indigo-600 dark:bg-indigo-500 animate-pulse',
                bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
                text: 'text-indigo-700 dark:text-indigo-300',
                border: 'border-indigo-200/65 dark:border-indigo-900/40',
                icon: Loader2,
                glow: 'shadow-indigo-500/10',
            },
        },
    },
    {
        id: 2,
        title: 'Rimau Pacific',
        category: 'Build 2022',
        image: '/images/rimau-pasific.png',
        icon: Ship,
        initialStatus: 'Idle',
        details: {
            Idle: {
                message:
                    'System is idle. Vessel is docked or awaiting port entry clearance.',
                percent: 0,
                color: 'bg-neutral-500',
                bg: 'bg-neutral-50 dark:bg-neutral-900/50',
                text: 'text-neutral-600 dark:text-neutral-400',
                border: 'border-neutral-200 dark:border-neutral-800',
                icon: Clock,
                glow: 'shadow-neutral-500/10',
            },
            Working: {
                message:
                    'En route. Vessel is traversing primary maritime channel with high engine efficiency status.',
                percent: 75,
                color: 'bg-indigo-600 dark:bg-indigo-500 animate-pulse',
                bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
                text: 'text-indigo-700 dark:text-indigo-300',
                border: 'border-indigo-200/65 dark:border-indigo-900/40',
                icon: Loader2,
                glow: 'shadow-indigo-500/10',
            },
        },
    },
    {
        id: 3,
        title: 'Rimau Ocean',
        category: 'Built 2023',
        image: '/images/rimau-ocean.jpeg',
        icon: Truck,
        initialStatus: 'Idle',
        details: {
            Idle: {
                message:
                    'System is idle. Staged for loading. Dispatch drivers scheduled for standard morning shift.',
                percent: 0,
                color: 'bg-neutral-500',
                bg: 'bg-neutral-50 dark:bg-neutral-900/50',
                text: 'text-neutral-600 dark:text-neutral-400',
                border: 'border-neutral-200 dark:border-neutral-800',
                icon: Clock,
                glow: 'shadow-neutral-500/10',
            },
            Working: {
                message:
                    'Out for delivery. Couriers navigating routes with optimization systems actively feeding live data.',
                percent: 50,
                color: 'bg-indigo-600 dark:bg-indigo-500 animate-pulse',
                bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
                text: 'text-indigo-700 dark:text-indigo-300',
                border: 'border-indigo-200/65 dark:border-indigo-900/40',
                icon: Loader2,
                glow: 'shadow-indigo-500/10',
            },
        },
    },
];

interface DashboardProps {
    pipelines: Record<
        number,
        {
            id: number;
            activity_id: number;
            status: StatusType;
            custom_messages: Record<StatusType, string> | null;
            created_at: string;
            updated_at: string;
        }
    >;
}

export default function Dashboard({ pipelines = {} }: DashboardProps) {
    // Fetch logged-in user auth status from Inertia props
    const { auth } = usePage().props as any;
    const currentUser = auth?.user;
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const isAdminOrSuperAdmin =
        currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

    // Auto-poll every 5 seconds to keep the dashboard up-to-date in real-time
    usePoll(5000, { only: ['pipelines'] });

    // Inline editing states
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const handleStatusChange = (id: number, newStatus: StatusType) => {
        // Only admin and super admin can switch status
        if (!isAdminOrSuperAdmin) {
            return;
        }

        // If we were editing this row's previous status, close the editor
        if (editingKey?.startsWith(`${id}-`)) {
            setEditingKey(null);
        }

        // Sync with backend database
        router.patch(
            updateStatus().url,
            {
                activity_id: id,
                status: newStatus,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const startEditing = (
        id: number,
        status: StatusType,
        currentVal: string,
    ) => {
        setEditingKey(`${id}-${status}`);
        setEditText(currentVal);
    };

    const handleSaveMessage = (
        id: number,
        status: StatusType,
        newText: string,
    ) => {
        // Sync with backend database
        router.post(
            updateMessage().url,
            {
                activity_id: id,
                status: status,
                message: newText.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingKey(null);
                },
            },
        );
    };

    const resetToDefaults = () => {
        if (
            confirm(
                'Are you sure you want to reset all custom status messages back to system defaults in the database?',
            )
        ) {
            router.post(
                resetMessages().url,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setEditingKey(null);
                    },
                },
            );
        }
    };

    // Calculate dynamic stats from the database values
    const totalCount = activities.length;
    const getStatusForActivity = (id: number): StatusType => {
        const rawStatus =
            pipelines[id]?.status ??
            activities.find((a) => a.id === id)!.initialStatus;

        if (
            (rawStatus as string) === 'On Progress' ||
            rawStatus === 'Working'
        ) {
            return 'Working';
        }

        return 'Idle';
    };

    const workingCount = activities.filter(
        (a) => getStatusForActivity(a.id) === 'Working',
    ).length;
    const idleCount = activities.filter(
        (a) => getStatusForActivity(a.id) === 'Idle',
    ).length;

    // Removed overallProgressPercent as percentages are no longer displayed.

    const hasAnyCustomMessages = Object.values(pipelines).some(
        (p) => p.custom_messages && Object.keys(p.custom_messages).length > 0,
    );

    return (
        <>
            <Head title="Logistics Dashboard" />
            <div className="mx-auto max-w-7xl flex-1 space-y-8 p-6 md:p-8">
                {/* Header Section */}
                <div className="flex flex-col items-start justify-between gap-4 border-b border-neutral-100 pb-6 lg:flex-row lg:items-center dark:border-neutral-800">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                            Operations Flow Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Real-time tracking of logistics lanes, inventory
                            movement, and cargo shipping lines.
                        </p>
                    </div>

                    {/* Role Status & Live Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Refresh / Update Data Button */}
                        <button
                            type="button"
                            onClick={() =>
                                router.reload({ only: ['pipelines'] })
                            }
                            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            title="Update and refresh dashboard data"
                        >
                            <RefreshCw className="h-3.5 w-3.5 text-neutral-500" />
                            <span>Refresh</span>
                        </button>

                        {/* Current Authenticated User Badge */}
                        <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-900">
                            <Shield
                                className={`h-4 w-4 ${isSuperAdmin ? 'text-emerald-500' : isAdminOrSuperAdmin ? 'text-indigo-500' : 'text-neutral-400'}`}
                            />
                            <span className="text-neutral-500 dark:text-neutral-400">
                                Logged in as:{' '}
                                <strong className="font-semibold text-neutral-700 dark:text-neutral-200">
                                    {currentUser?.name || 'Guest'}
                                </strong>{' '}
                                ({currentUser?.role || 'Guest'})
                            </span>
                        </div>

                        {/* Reset Button (Only accessible by Super Admin) */}
                        {isSuperAdmin && hasAnyCustomMessages && (
                            <button
                                onClick={resetToDefaults}
                                className="flex cursor-pointer items-center gap-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-600 transition-colors hover:border-rose-300 hover:text-rose-600 dark:border-neutral-800 dark:text-neutral-300 dark:hover:border-rose-900 dark:hover:text-rose-400"
                                title="Reset all custom status descriptions back to default"
                            >
                                <RefreshCw className="h-3 w-3" />
                                Reset Defaults
                            </button>
                        )}
                    </div>
                </div>

                {/* KPI Overview Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border border-neutral-200/60 shadow-sm dark:border-neutral-800/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                Working
                            </CardTitle>
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {workingCount}{' '}
                                <span className="text-xs font-normal text-neutral-400">
                                    / {totalCount}
                                </span>
                            </div>
                            <p className="mt-1 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                                Currently active operations
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-neutral-200/60 shadow-sm dark:border-neutral-800/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
                                Idle
                            </CardTitle>
                            <Clock className="h-4 w-4 text-neutral-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
                                {idleCount}{' '}
                                <span className="text-xs font-normal text-neutral-400">
                                    / {totalCount}
                                </span>
                            </div>
                            <p className="mt-1 text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
                                Staged, completed, or delayed
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 3 Rows of Image and Progression Container */}
                <div className="space-y-6">
                    {activities.map((activity) => {
                        const currentStatus = getStatusForActivity(activity.id);
                        const details = activity.details[currentStatus];
                        const StatusIcon = details.icon;
                        const ActivityIcon = activity.icon;

                        // Retrieve the custom message from DB if exists
                        const customMsgs: Record<string, string> =
                            pipelines[activity.id]?.custom_messages ?? {};
                        const currentMessage =
                            customMsgs[currentStatus] ?? details.message;
                        const msgKey = `${activity.id}-${currentStatus}`;
                        const isEditingThis = editingKey === msgKey;

                        return (
                            <Card
                                key={activity.id}
                                className="overflow-hidden border border-neutral-200 shadow-sm transition-all duration-300 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
                            >
                                <div className="grid gap-0 lg:grid-cols-12">
                                    {/* Image Column */}
                                    <div className="group relative aspect-[16/9] min-h-[220px] overflow-hidden bg-neutral-100 lg:col-span-4 lg:aspect-auto dark:bg-neutral-950">
                                        <img
                                            src={activity.image}
                                            alt={activity.title}
                                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent lg:bg-gradient-to-r lg:from-black/10 lg:to-transparent"></div>

                                        {/* Corner category tag */}
                                        <div className="absolute top-4 left-4 z-10">
                                            <Badge className="border border-neutral-700/50 bg-black/60 text-[9px] font-bold tracking-widest text-white backdrop-blur-md dark:bg-neutral-950/80">
                                                {activity.category}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Content & Control Column */}
                                    <div className="flex flex-col justify-between p-6 lg:col-span-8">
                                        <div>
                                            {/* Row header, Action Controls */}
                                            <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-lg bg-neutral-100 p-2.5 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                        <ActivityIcon className="h-5 w-5" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-neutral-950 dark:text-white">
                                                        {activity.title}
                                                    </h3>
                                                </div>

                                                {/* Interactive Selector Controls (Admin / Super Admin only) */}
                                                {isAdminOrSuperAdmin ? (
                                                    <div className="flex items-center gap-1.5 self-stretch rounded-lg border border-neutral-200/50 bg-neutral-100 p-1 sm:self-auto dark:border-neutral-800 dark:bg-neutral-900">
                                                        {(
                                                            [
                                                                'Idle',
                                                                'Working',
                                                            ] as StatusType[]
                                                        ).map((status) => {
                                                            const isSelected =
                                                                currentStatus ===
                                                                status;
                                                            let buttonStyle =
                                                                'text-neutral-500 hover:text-neutral-950 dark:hover:text-white cursor-pointer';

                                                            if (isSelected) {
                                                                if (
                                                                    status ===
                                                                    'Working'
                                                                ) {
                                                                    buttonStyle =
                                                                        'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm font-semibold cursor-pointer';
                                                                } else {
                                                                    buttonStyle =
                                                                        'bg-neutral-600 dark:bg-neutral-700 text-white shadow-sm font-semibold cursor-pointer';
                                                                }
                                                            }

                                                            return (
                                                                <button
                                                                    key={status}
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleStatusChange(
                                                                            activity.id,
                                                                            status,
                                                                        )
                                                                    }
                                                                    className={`rounded-md px-2.5 py-1 text-[11px] whitespace-nowrap transition-all duration-200 ${buttonStyle}`}
                                                                >
                                                                    {status}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="flex items-center gap-1.5 self-stretch rounded-lg border border-neutral-200/50 bg-neutral-100/70 p-1 sm:self-auto dark:border-neutral-800 dark:bg-neutral-900/70"
                                                        title="Only admin and super admin can switch status between Idle and Working"
                                                    >
                                                        {(
                                                            [
                                                                'Idle',
                                                                'Working',
                                                            ] as StatusType[]
                                                        ).map((status) => {
                                                            const isSelected =
                                                                currentStatus ===
                                                                status;
                                                            let buttonStyle =
                                                                'text-neutral-400 dark:text-neutral-600 opacity-60 cursor-not-allowed';

                                                            if (isSelected) {
                                                                if (
                                                                    status ===
                                                                    'Working'
                                                                ) {
                                                                    buttonStyle =
                                                                        'bg-indigo-600/80 dark:bg-indigo-500/80 text-white shadow-sm font-semibold cursor-not-allowed';
                                                                } else {
                                                                    buttonStyle =
                                                                        'bg-neutral-600/80 dark:bg-neutral-700/80 text-white shadow-sm font-semibold cursor-not-allowed';
                                                                }
                                                            }

                                                            return (
                                                                <button
                                                                    key={status}
                                                                    type="button"
                                                                    disabled
                                                                    aria-disabled="true"
                                                                    tabIndex={
                                                                        -1
                                                                    }
                                                                    className={`rounded-md px-2.5 py-1 text-[11px] whitespace-nowrap transition-all duration-200 ${buttonStyle}`}
                                                                >
                                                                    {status}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Container (BELOW target image) */}
                                        <div
                                            className={`mt-4 rounded-xl border p-4 ${details.border} ${details.bg} ${details.glow} flex flex-col items-start justify-between gap-4 shadow-sm transition-all duration-500 md:flex-row md:items-center`}
                                        >
                                            {isEditingThis ? (
                                                /* SUPER ADMIN EDIT MODE */
                                                <div className="w-full space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                                                            Editing Status
                                                            Message:
                                                        </span>
                                                        <span className="rounded bg-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-600 uppercase dark:bg-neutral-800 dark:text-neutral-300">
                                                            {currentStatus}
                                                        </span>
                                                    </div>
                                                    <Textarea
                                                        value={editText}
                                                        onChange={(e) =>
                                                            setEditText(
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="min-h-[70px] w-full border-indigo-400 bg-white text-xs font-medium focus-visible:ring-indigo-400 dark:bg-neutral-900"
                                                        placeholder="Type new status description message..."
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() =>
                                                                setEditingKey(
                                                                    null,
                                                                )
                                                            }
                                                            className="flex cursor-pointer items-center gap-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                                        >
                                                            <Undo2 className="h-3 w-3" />
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleSaveMessage(
                                                                    activity.id,
                                                                    currentStatus,
                                                                    editText,
                                                                )
                                                            }
                                                            className="flex cursor-pointer items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
                                                        >
                                                            <Save className="h-3 w-3" />
                                                            Save Message
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                /* READ-ONLY DISPLAY MODE */
                                                <>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold tracking-wider uppercase ${
                                                                        currentStatus ===
                                                                        'Working'
                                                                            ? 'text-indigo-700 dark:text-indigo-400'
                                                                            : 'text-neutral-600 dark:text-neutral-400'
                                                                    }`}
                                                                >
                                                                    <StatusIcon
                                                                        className={`h-4.5 w-4.5 ${currentStatus === 'Working' ? 'animate-spin' : ''}`}
                                                                    />
                                                                    {
                                                                        currentStatus
                                                                    }
                                                                </span>
                                                                {/* Removed percentage progress */}
                                                            </div>

                                                            {/* Edit Description trigger button - ONLY accessible by Super Admin */}
                                                            {isSuperAdmin && (
                                                                <button
                                                                    onClick={() =>
                                                                        startEditing(
                                                                            activity.id,
                                                                            currentStatus,
                                                                            currentMessage,
                                                                        )
                                                                    }
                                                                    className="flex cursor-pointer items-center gap-1 rounded border border-indigo-200/40 bg-white/40 px-2 py-1 text-[11px] font-bold text-indigo-600 transition-colors hover:text-indigo-700 dark:border-indigo-800/30 dark:bg-neutral-800/40 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                                >
                                                                    <Edit2 className="h-3 w-3" />
                                                                    Edit
                                                                    Description
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-xs leading-relaxed font-medium text-neutral-600 dark:text-neutral-300">
                                                            {currentMessage}
                                                        </p>
                                                    </div>

                                                    {/* Status Text display */}
                                                    <div className="flex w-full flex-col items-end justify-center self-stretch md:w-40 md:self-auto">
                                                        <span className="mb-1 text-[10px] font-bold tracking-widest text-neutral-400 uppercase dark:text-neutral-500">
                                                            Current Status
                                                        </span>
                                                        <span
                                                            className={`w-full rounded-xl border px-4 py-2 text-center text-sm font-extrabold tracking-wide uppercase shadow-sm ${
                                                                currentStatus ===
                                                                'Working'
                                                                    ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                                    : 'border-neutral-500/20 bg-neutral-500/10 text-neutral-600 dark:text-neutral-400'
                                                            }`}
                                                        >
                                                            {currentStatus}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
