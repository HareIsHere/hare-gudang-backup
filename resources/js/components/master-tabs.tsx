import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';

export interface MasterTabItem {
    label: string;
    href: string;
    icon?: LucideIcon;
}

export function MasterTabs({
    tabs,
    className = '',
}: {
    tabs: MasterTabItem[];
    className?: string;
}) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <div
            className={cn(
                'inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800',
                className,
            )}
        >
            {tabs.map(({ label, href, icon: Icon }) => {
                const active = isCurrentUrl(href);

                return (
                    <Link
                        key={href}
                        href={href}
                        prefetch
                        className={cn(
                            'flex items-center rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
                            active
                                ? 'bg-white text-neutral-950 shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60 dark:hover:text-neutral-200',
                        )}
                    >
                        {Icon && <Icon className="mr-1.5 h-4 w-4" />}
                        <span>{label}</span>
                    </Link>
                );
            })}
        </div>
    );
}
