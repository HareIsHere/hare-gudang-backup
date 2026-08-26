import { Head, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Warehouse, 
    Ship, 
    Truck, 
    CheckCircle2, 
    AlertTriangle, 
    Loader2, 
    PlayCircle, 
    TrendingUp,
    Clock,
    Sparkles,
    Edit2,
    Save,
    Undo2,
    Shield,
    RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    details: Record<StatusType, {
        message: string;
        percent: number;
        color: string;
        bg: string;
        text: string;
        border: string;
        icon: React.ComponentType<{ className?: string }>;
        glow: string;
    }>;
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
            'Idle': {
                message: 'System is idle. Staged and ready for incoming cargo processing.',
                percent: 0,
                color: 'bg-neutral-500',
                bg: 'bg-neutral-50 dark:bg-neutral-900/50',
                text: 'text-neutral-600 dark:text-neutral-400',
                border: 'border-neutral-200 dark:border-neutral-800',
                icon: Clock,
                glow: 'shadow-neutral-500/10'
            },
            'Working': {
                message: 'Active sorting. Robotic pickers are placing incoming items onto high-density storage shelves.',
                percent: 65,
                color: 'bg-indigo-600 dark:bg-indigo-500 animate-pulse',
                bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
                text: 'text-indigo-700 dark:text-indigo-300',
                border: 'border-indigo-200/65 dark:border-indigo-900/40',
                icon: Loader2,
                glow: 'shadow-indigo-500/10'
            }
        }
    },
    {
        id: 2,
        title: 'Rimau Pacific',
        category: 'Build 2022',
        image: '/images/rimau-pasific.png',
        icon: Ship,
        initialStatus: 'Idle',
        details: {
            'Idle': {
                message: 'System is idle. Vessel is docked or awaiting port entry clearance.',
                percent: 0,
                color: 'bg-neutral-500',
                bg: 'bg-neutral-50 dark:bg-neutral-900/50',
                text: 'text-neutral-600 dark:text-neutral-400',
                border: 'border-neutral-200 dark:border-neutral-800',
                icon: Clock,
                glow: 'shadow-neutral-500/10'
            },
            'Working': {
                message: 'En route. Vessel is traversing primary maritime channel with high engine efficiency status.',
                percent: 75,
                color: 'bg-indigo-600 dark:bg-indigo-500 animate-pulse',
                bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
                text: 'text-indigo-700 dark:text-indigo-300',
                border: 'border-indigo-200/65 dark:border-indigo-900/40',
                icon: Loader2,
                glow: 'shadow-indigo-500/10'
            }
        }
    },
    {
        id: 3,
        title: 'Rimau Ocean',
        category: 'Built 2023',
        image: '/images/rimau-ocean.jpeg',
        icon: Truck,
        initialStatus: 'Idle',
        details: {
            'Idle': {
                message: 'System is idle. Staged for loading. Dispatch drivers scheduled for standard morning shift.',
                percent: 0,
                color: 'bg-neutral-500',
                bg: 'bg-neutral-50 dark:bg-neutral-900/50',
                text: 'text-neutral-600 dark:text-neutral-400',
                border: 'border-neutral-200 dark:border-neutral-800',
                icon: Clock,
                glow: 'shadow-neutral-500/10'
            },
            'Working': {
                message: 'Out for delivery. Couriers navigating routes with optimization systems actively feeding live data.',
                percent: 50,
                color: 'bg-indigo-600 dark:bg-indigo-500 animate-pulse',
                bg: 'bg-indigo-50/50 dark:bg-indigo-950/20',
                text: 'text-indigo-700 dark:text-indigo-300',
                border: 'border-indigo-200/65 dark:border-indigo-900/40',
                icon: Loader2,
                glow: 'shadow-indigo-500/10'
            }
        }
    }
];

interface DashboardProps {
    pipelines: Record<number, {
        id: number;
        activity_id: number;
        status: StatusType;
        custom_messages: Record<StatusType, string> | null;
        created_at: string;
        updated_at: string;
    }>;
}

export default function Dashboard({ pipelines = {} }: DashboardProps) {
    // Fetch logged-in user auth status from Inertia props
    const { auth } = usePage().props as any;
    const currentUser = auth?.user;
    const isSuperAdmin = currentUser?.role === 'super_admin';

    // Inline editing states
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const handleStatusChange = (id: number, newStatus: StatusType) => {
        // If we were editing this row's previous status, close the editor
        if (editingKey?.startsWith(`${id}-`)) {
            setEditingKey(null);
        }

        // Sync with backend database
        router.patch(updateStatus().url, {
            activity_id: id,
            status: newStatus
        }, {
            preserveScroll: true
        });
    };

    const startEditing = (id: number, status: StatusType, currentVal: string) => {
        setEditingKey(`${id}-${status}`);
        setEditText(currentVal);
    };

    const handleSaveMessage = (id: number, status: StatusType, newText: string) => {
        // Sync with backend database
        router.post(updateMessage().url, {
            activity_id: id,
            status: status,
            message: newText.trim()
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingKey(null);
            }
        });
    };

    const resetToDefaults = () => {
        if (confirm('Are you sure you want to reset all custom status messages back to system defaults in the database?')) {
            router.post(resetMessages().url, {}, {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingKey(null);
                }
            });
        }
    };

    // Calculate dynamic stats from the database values
    const totalCount = activities.length;
    const getStatusForActivity = (id: number): StatusType => {
        const rawStatus = pipelines[id]?.status ?? activities.find(a => a.id === id)!.initialStatus;
        if (rawStatus === 'On Progress' || rawStatus === 'Working') return 'Working';
        return 'Idle';
    };

    const workingCount = activities.filter(a => getStatusForActivity(a.id) === 'Working').length;
    const idleCount = activities.filter(a => getStatusForActivity(a.id) === 'Idle').length;

    // Removed overallProgressPercent as percentages are no longer displayed.

    const hasAnyCustomMessages = Object.values(pipelines).some(
        p => p.custom_messages && Object.keys(p.custom_messages).length > 0
    );

    return (
        <>
            <Head title="Logistics Dashboard" />
            <div className="flex-1 space-y-8 p-6 md:p-8 max-w-7xl mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                            Operations Flow Dashboard
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Real-time tracking of logistics lanes, inventory movement, and cargo shipping lines.
                        </p>
                    </div>
                    
                    {/* Role Status & Demo Simulator Control */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Current Authenticated User Badge */}
                        <div className="flex items-center gap-2 bg-neutral-50 dark:bg-neutral-900 px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs">
                            <Shield className={`h-4 w-4 ${isSuperAdmin ? 'text-emerald-500' : 'text-neutral-400'}`} />
                            <span className="text-neutral-500 dark:text-neutral-400">
                                Logged in as: <strong className="text-neutral-700 dark:text-neutral-200 font-semibold">{currentUser?.name || 'Guest'}</strong> ({currentUser?.role || 'Guest'})
                            </span>
                        </div>

                        {/* Reset Button (Visible if custom messages exist in DB) */}
                        {hasAnyCustomMessages && (
                            <button
                                onClick={resetToDefaults}
                                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-900 text-neutral-600 dark:text-neutral-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs transition-colors cursor-pointer"
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
                    <Card className="border border-neutral-200/60 dark:border-neutral-800/80 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Working</CardTitle>
                            <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{workingCount} <span className="text-xs text-neutral-400 font-normal">/ {totalCount}</span></div>
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium">Currently active operations</p>
                        </CardContent>
                    </Card>

                    <Card className="border border-neutral-200/60 dark:border-neutral-800/80 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Idle</CardTitle>
                            <Clock className="h-4 w-4 text-neutral-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{idleCount} <span className="text-xs text-neutral-400 font-normal">/ {totalCount}</span></div>
                            <p className="text-[10px] text-neutral-600 dark:text-neutral-400 mt-1 font-medium">Staged, completed, or delayed</p>
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
                        const customMsgs = pipelines[activity.id]?.custom_messages ?? {};
                        const currentMessage = customMsgs[currentStatus] ?? details.message;
                        const msgKey = `${activity.id}-${currentStatus}`;
                        const isEditingThis = editingKey === msgKey;

                        return (
                            <Card key={activity.id} className="overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300">
                                <div className="grid lg:grid-cols-12 gap-0">
                                    
                                    {/* Image Column */}
                                    <div className="lg:col-span-4 relative group overflow-hidden bg-neutral-100 dark:bg-neutral-950 aspect-[16/9] lg:aspect-auto min-h-[220px]">
                                        <img 
                                            src={activity.image} 
                                            alt={activity.title}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent lg:bg-gradient-to-r lg:from-black/10 lg:to-transparent"></div>
                                        
                                        {/* Corner category tag */}
                                        <div className="absolute top-4 left-4 z-10">
                                            <Badge className="bg-black/60 dark:bg-neutral-950/80 backdrop-blur-md border border-neutral-700/50 text-white font-bold tracking-widest text-[9px]">
                                                {activity.category}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Content & Control Column */}
                                    <div className="lg:col-span-8 p-6 flex flex-col justify-between">
                                        <div>
                                            {/* Row header, Action Controls */}
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                                        <ActivityIcon className="h-5 w-5" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-neutral-950 dark:text-white">
                                                        {activity.title}
                                                    </h3>
                                                </div>

                                                {/* Interactive Selector Controls */}
                                                <div className="flex items-center gap-1.5 self-stretch sm:self-auto bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200/50 dark:border-neutral-800">
                                                    {(['Idle', 'Working'] as StatusType[]).map((status) => {
                                                        const isSelected = currentStatus === status;
                                                        let buttonStyle = 'text-neutral-500 hover:text-neutral-950 dark:hover:text-white cursor-pointer';
                                                        
                                                        if (isSelected) {
                                                            if (status === 'Working') buttonStyle = 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-sm font-semibold cursor-pointer';
                                                            else buttonStyle = 'bg-neutral-600 dark:bg-neutral-700 text-white shadow-sm font-semibold cursor-pointer';
                                                        }

                                                        return (
                                                            <button
                                                                key={status}
                                                                onClick={() => handleStatusChange(activity.id, status)}
                                                                className={`px-2.5 py-1 text-[11px] rounded-md transition-all duration-200 whitespace-nowrap ${buttonStyle}`}
                                                            >
                                                                {status}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Container (BELOW target image) */}
                                        <div className={`mt-4 p-4 rounded-xl border ${details.border} ${details.bg} ${details.glow} shadow-sm transition-all duration-500 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center`}>
                                            
                                            {isEditingThis ? (
                                                /* SUPER ADMIN EDIT MODE */
                                                <div className="w-full space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">Editing Status Message:</span>
                                                        <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded font-bold uppercase text-neutral-600 dark:text-neutral-300">
                                                            {currentStatus}
                                                        </span>
                                                    </div>
                                                    <Textarea 
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        className="w-full min-h-[70px] text-xs font-medium bg-white dark:bg-neutral-900 border-indigo-400 focus-visible:ring-indigo-400"
                                                        placeholder="Type new status description message..."
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => setEditingKey(null)}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                                        >
                                                            <Undo2 className="h-3 w-3" />
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveMessage(activity.id, currentStatus, editText)}
                                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
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
                                                                <span className={`flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                                                                    currentStatus === 'Working' ? 'text-indigo-700 dark:text-indigo-400' :
                                                                    'text-neutral-600 dark:text-neutral-400'
                                                                }`}>
                                                                    <StatusIcon className={`h-4.5 w-4.5 ${currentStatus === 'Working' ? 'animate-spin' : ''}`} />
                                                                    {currentStatus}
                                                                </span>
                                                                {/* Removed percentage progress */}
                                                            </div>

                                                            {/* Edit Description trigger button - ONLY accessible by Super Admin */}
                                                            {isSuperAdmin && (
                                                                <button
                                                                    onClick={() => startEditing(activity.id, currentStatus, currentMessage)}
                                                                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 cursor-pointer transition-colors bg-white/40 dark:bg-neutral-800/40 px-2 py-1 rounded border border-indigo-200/40 dark:border-indigo-800/30"
                                                                >
                                                                    <Edit2 className="h-3 w-3" />
                                                                    Edit Description
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                                                            {currentMessage}
                                                        </p>
                                                    </div>

                                                    {/* Status Text display */}
                                                    <div className="w-full md:w-40 flex flex-col items-end self-stretch md:self-auto justify-center">
                                                        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">
                                                            Current Status
                                                        </span>
                                                        <span className={`text-sm font-extrabold uppercase tracking-wide border px-4 py-2 rounded-xl text-center w-full shadow-sm ${
                                                            currentStatus === 'Working' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400' :
                                                            'bg-neutral-500/10 border-neutral-500/20 text-neutral-600 dark:text-neutral-400'
                                                        }`}>
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
