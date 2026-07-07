import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import type { InventoryMutation } from '@/types/inventory';

export default function MutationsIndex({ mutations }: { mutations: InventoryMutation[] }) {
    return (
        <>
            <Head title="Inventory Mutation Log" />
            <div className="p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Inventory Mutation Log</h1>
                    <p className="text-neutral-500 dark:text-neutral-400">A comprehensive history of all inventory movements including stock-ins, fulfillments, and transfers.</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm overflow-hidden border border-neutral-200 dark:border-neutral-800">
                    <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Movement</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Qty</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">User</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-800">
                            {mutations.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-neutral-500 italic">No mutations logged yet.</td>
                                </tr>
                            )}
                            {mutations.map((mutation) => (
                                <tr key={mutation.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-500">
                                        {new Date(mutation.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <MutationTypeBadge type={mutation.type} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{mutation.item?.item_name}</div>
                                        <div className="text-[10px] text-neutral-400">ID: {mutation.item_id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex items-center gap-2">
                                            {mutation.from_warehouse && (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">From</span>
                                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{mutation.from_warehouse.name}</span>
                                                </div>
                                            )}
                                            {mutation.from_warehouse && mutation.to_warehouse && <span className="text-neutral-400">→</span>}
                                            {mutation.to_warehouse && (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">To</span>
                                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{mutation.to_warehouse.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm font-bold ${
                                            mutation.type === 'IN' 
                                                ? 'text-green-600' 
                                                : mutation.type === 'OUT' 
                                                    ? 'text-red-600' 
                                                    : mutation.type === 'REQUEST'
                                                        ? (mutation.from_warehouse_id ? 'text-red-600' : 'text-green-600')
                                                        : 'text-blue-600'
                                        }`}>
                                            {mutation.type === 'OUT' || (mutation.type === 'REQUEST' && mutation.from_warehouse_id) ? '-' : '+'}{mutation.quantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-neutral-900 dark:text-neutral-100">{mutation.user?.name}</span>
                                            <span className="text-[10px] text-neutral-400 italic">{mutation.reference_type || 'Manual'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

function MutationTypeBadge({ type }: { type: string }) {
    const colors: Record<string, string> = {
        IN: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
        OUT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
        TRANSFER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        REQUEST: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    };

    return (
        <Badge variant="outline" className={`${colors[type] || ''} border px-2 py-0.5 text-[10px] font-bold tracking-wider`}>
            {type}
        </Badge>
    );
}
