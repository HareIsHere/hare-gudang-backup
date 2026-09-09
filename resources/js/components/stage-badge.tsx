import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Stage } from '@/types/master';

export function StageBadge({
    stage,
    className = '',
}: {
    stage: Stage | string;
    className?: string;
}) {
    const isReady = stage === 'Ready';

    return (
        <Badge
            variant="outline"
            className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-md border',
                isReady
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300',
                className,
            )}
        >
            {stage}
        </Badge>
    );
}
