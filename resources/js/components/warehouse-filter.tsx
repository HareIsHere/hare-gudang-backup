import {
    Combobox,
    ComboboxButton,
    ComboboxInput,
    ComboboxOption,
    ComboboxOptions,
} from '@headlessui/react';
import { router } from '@inertiajs/react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useId, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Warehouse } from '@/types/inventory';

export default function WarehouseFilter({
    warehouses,
    value,
    href,
}: {
    warehouses: Warehouse[];
    value: number | null;
    href: string;
}) {
    const inputId = useId();
    const [query, setQuery] = useState('');
    const matchesAllWarehouses = 'all warehouses'.includes(
        query.trim().toLowerCase(),
    );
    const filteredWarehouses = [...warehouses]
        .sort((first, second) => first.name.localeCompare(second.name))
        .filter((warehouse) =>
            warehouse.name.toLowerCase().includes(query.trim().toLowerCase()),
        );

    const selectWarehouse = (warehouseId: string | null) => {
        if (warehouseId === null) {
            return;
        }

        router.get(
            href,
            warehouseId === '' ? {} : { warehouse_id: Number(warehouseId) },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <div className="w-full min-w-0 space-y-1.5 sm:w-64">
            <Label htmlFor={inputId}>Warehouse filter</Label>
            <Combobox
                value={value?.toString() ?? ''}
                onChange={selectWarehouse}
                onClose={() => setQuery('')}
                immediate
            >
                <div className="relative">
                    <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                    <ComboboxInput
                        as={Input}
                        id={inputId}
                        className="h-9 min-w-0 truncate pr-9 pl-9"
                        displayValue={(warehouseId: string) =>
                            warehouses.find(
                                (warehouse) =>
                                    warehouse.id.toString() === warehouseId,
                            )?.name ?? 'All warehouses'
                        }
                        onChange={(event) => setQuery(event.target.value)}
                        onFocus={(event) => event.target.select()}
                        autoComplete="off"
                    />
                    <ComboboxButton
                        type="button"
                        aria-label="Show warehouses"
                        className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 text-muted-foreground"
                    >
                        <ChevronsUpDown className="size-4" />
                    </ComboboxButton>
                </div>
                <ComboboxOptions
                    anchor={{ to: 'bottom start', gap: 4, padding: 8 }}
                    portal
                    modal={false}
                    className="z-[60] w-(--input-width) overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none [--anchor-max-height:16rem]"
                >
                    {matchesAllWarehouses && (
                        <ComboboxOption
                            value=""
                            className="group flex cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm data-focus:bg-accent data-focus:text-accent-foreground"
                        >
                            All warehouses
                            <Check className="invisible size-4 shrink-0 group-data-selected:visible" />
                        </ComboboxOption>
                    )}
                    {filteredWarehouses.map((warehouse) => (
                        <ComboboxOption
                            key={warehouse.id}
                            value={warehouse.id.toString()}
                            className="group flex cursor-pointer items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm data-focus:bg-accent data-focus:text-accent-foreground"
                        >
                            <span className="min-w-0 break-words">
                                {warehouse.name}
                            </span>
                            <Check className="invisible size-4 shrink-0 group-data-selected:visible" />
                        </ComboboxOption>
                    ))}
                    {filteredWarehouses.length === 0 &&
                        !matchesAllWarehouses && (
                            <p className="px-3 py-2 text-sm text-muted-foreground">
                                No warehouses found.
                            </p>
                        )}
                </ComboboxOptions>
            </Combobox>
        </div>
    );
}
