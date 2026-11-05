import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Check, Plus, Search, Send, Truck, X } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useId,
    useState,
} from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import * as ProcurementRequestController from '@/actions/App/Http/Controllers/ProcurementRequestController';
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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { index as procurementIndex } from '@/routes/procurement';
import type {
    Item,
    ProcurementRequest,
    User,
    Warehouse,
} from '@/types/inventory';
import type { Worksite } from '@/types/master';

type RequestLine = {
    row_id: string;
    item_id: string;
    requested_quantity: string;
    manufacturer_code: string;
    measurement_unit: string;
    description: string;
    selected_item?: Item;
};

const productLabel = (item: Item) =>
    `${item.product?.name ?? item.item_name}${item.specification ? ` — ${item.specification.name}` : ''}`;

const productKey = (item: Item) =>
    item.product_id ? `product-${item.product_id}` : `item-${item.item_id}`;

export default function ProcurementIndex({
    requests,
    worksites,
    warehouses,
    users,
}: {
    requests: ProcurementRequest[];
    worksites: Worksite[];
    warehouses: Warehouse[];
    users: User[];
}) {
    const { auth } = usePage().props as any;
    const isAdmin = ['admin', 'super_admin'].includes(auth.user.role);
    const createEmptyLine = (rowId: number): RequestLine => ({
        row_id: `procurement-line-${rowId}`,
        item_id: '',
        requested_quantity: '1',
        manufacturer_code: '',
        measurement_unit: '',
        description: '',
    });
    const [nextRowId, setNextRowId] = useState(1);
    const [selectedRequest, setSelectedRequest] =
        useState<ProcurementRequest | null>(null);
    const [cancelRequest, setCancelRequest] =
        useState<ProcurementRequest | null>(null);
    const cancellation = useForm({ remarks: '' });
    const openCancellation = (request: ProcurementRequest) => {
        setSelectedRequest(null);
        cancellation.resetAndClearErrors();
        setCancelRequest(request);
    };
    const confirmCancellation = () => {
        if (!cancelRequest) return;
        cancellation.patch(
            ProcurementRequestController.cancel({
                procurementRequest: cancelRequest.id,
            }).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCancelRequest(null);
                    toast.success('SPB berhasil dibatalkan.');
                },
            },
        );
    };
    const { data, setData, post, processing, errors, reset, transform } =
        useForm({
            request_date: new Date().toISOString().slice(0, 10),
            worksite_id: '',
            description: '',
            status: 'draft',
            items: [createEmptyLine(0)],
        });

    const updateLine = (
        index: number,
        field: keyof RequestLine,
        value: string,
    ) => {
        setData(
            'items',
            data.items.map((line, lineIndex) =>
                lineIndex === index ? { ...line, [field]: value } : line,
            ),
        );
    };

    const selectedProductKeysForOtherRows = (rowIndex: number) =>
        new Set(
            data.items.flatMap((line, lineIndex) =>
                lineIndex === rowIndex || !line.selected_item
                    ? []
                    : [productKey(line.selected_item)],
            ),
        );

    const selectProduct = (rowIndex: number, selectedItem: Item) => {
        if (
            selectedProductKeysForOtherRows(rowIndex).has(
                productKey(selectedItem),
            )
        ) {
            toast.error('Produk ini sudah ditambahkan ke SPB.');

            return false;
        }

        setData(
            'items',
            data.items.map((candidate, lineIndex) =>
                lineIndex === rowIndex
                    ? {
                          ...candidate,
                          item_id: String(selectedItem.item_id),
                          measurement_unit:
                              selectedItem.specification?.measurement_unit ??
                              candidate.measurement_unit,
                          selected_item: selectedItem,
                      }
                    : candidate,
            ),
        );

        return true;
    };

    const submit = (status: 'draft' | 'submitted') => {
        transform((formData) => ({
            ...formData,
            status,
            items: formData.items.map((line) => ({
                item_id: line.item_id,
                requested_quantity: line.requested_quantity,
                manufacturer_code: line.manufacturer_code,
                measurement_unit: line.measurement_unit.trim(),
                description: line.description,
            })),
        }));
        post(ProcurementRequestController.store.url(), {
            preserveScroll: true,
            onSuccess: () => reset('description', 'worksite_id', 'items'),
        });
    };

    return (
        <>
            <Head title="Pengadaan Barang" />
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Pengadaan Barang
                    </h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Surat Permintaan Barang (SPB) dengan persetujuan dan
                        penerimaan gudang terpisah.
                    </p>
                </div>

                <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="font-semibold">Buat SPB</h2>
                            <p className="text-sm text-neutral-500">
                                Nomor SPB dibuat otomatis saat disimpan.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setData('items', [
                                    ...data.items,
                                    createEmptyLine(nextRowId),
                                ]);
                                setNextRowId((rowId) => rowId + 1);
                            }}
                        >
                            <Plus className="mr-1 h-4 w-4" /> Tambah barang
                        </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Field
                            label="Tanggal permintaan"
                            error={errors.request_date}
                        >
                            <Input
                                type="date"
                                value={data.request_date}
                                onChange={(event) =>
                                    setData('request_date', event.target.value)
                                }
                            />
                        </Field>
                        <Field
                            label="Worksite / kapal"
                            error={errors.worksite_id}
                        >
                            <Select
                                value={data.worksite_id}
                                onValueChange={(value) =>
                                    setData('worksite_id', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih worksite" />
                                </SelectTrigger>
                                <SelectContent>
                                    {worksites.map((worksite) => (
                                        <SelectItem
                                            key={worksite.id}
                                            value={String(worksite.id)}
                                        >
                                            {worksite.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field
                            label="Keterangan umum"
                            error={errors.description}
                        >
                            <Input
                                value={data.description}
                                onChange={(event) =>
                                    setData('description', event.target.value)
                                }
                                placeholder="Keperluan pengadaan"
                            />
                        </Field>
                    </div>

                    <div className="mt-5 overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[1050px] text-sm">
                            <thead className="bg-neutral-50 text-left text-xs text-neutral-500 uppercase dark:bg-neutral-800">
                                <tr>
                                    <th className="p-3">Barang / tipe</th>
                                    <th className="p-3">Kode</th>
                                    <th className="p-3">Part no.</th>
                                    <th className="p-3">Kode pabrik</th>
                                    <th className="p-3">Satuan</th>
                                    <th className="p-3">Stok saat ini</th>
                                    <th className="p-3">Qty minta</th>
                                    <th className="p-3">Keterangan</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody>
                                {data.items.map((line, index) => {
                                    const item = line.selected_item;
                                    const currentStock =
                                        item?.inventories
                                            ?.filter(
                                                (inventory) =>
                                                    inventory.warehouse
                                                        ?.worksite_id ===
                                                    Number(data.worksite_id),
                                            )
                                            .reduce(
                                                (total, inventory) =>
                                                    total + inventory.quantity,
                                                0,
                                            ) ?? 0;

                                    return (
                                        <tr
                                            key={line.row_id}
                                            className="border-t dark:border-neutral-800"
                                        >
                                            <td className="p-2">
                                                <ProductSearchInput
                                                    selectedItem={item}
                                                    excludedProductKeys={selectedProductKeysForOtherRows(
                                                        index,
                                                    )}
                                                    onSelect={(selectedItem) =>
                                                        selectProduct(
                                                            index,
                                                            selectedItem,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="p-2 text-neutral-500">
                                                {item
                                                    ? `#${item.item_id}`
                                                    : '—'}
                                            </td>
                                            <td className="p-2 text-neutral-500">
                                                {item?.specification
                                                    ?.part_number || '—'}
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    value={
                                                        line.manufacturer_code
                                                    }
                                                    onChange={(event) =>
                                                        updateLine(
                                                            index,
                                                            'manufacturer_code',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Opsional"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    value={
                                                        line.measurement_unit
                                                    }
                                                    onChange={(event) =>
                                                        updateLine(
                                                            index,
                                                            'measurement_unit',
                                                            event.target.value,
                                                        )
                                                    }
                                                    onBlur={(event) =>
                                                        updateLine(
                                                            index,
                                                            'measurement_unit',
                                                            event.target.value.trim(),
                                                        )
                                                    }
                                                    maxLength={100}
                                                    placeholder="Contoh: Pcs"
                                                />
                                            </td>
                                            <td className="p-2 font-medium">
                                                {currentStock}
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={
                                                        line.requested_quantity
                                                    }
                                                    onChange={(event) =>
                                                        updateLine(
                                                            index,
                                                            'requested_quantity',
                                                            event.target.value,
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    value={line.description}
                                                    onChange={(event) =>
                                                        updateLine(
                                                            index,
                                                            'description',
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Catatan"
                                                />
                                            </td>
                                            <td className="p-2">
                                                {data.items.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            setData(
                                                                'items',
                                                                data.items.filter(
                                                                    (
                                                                        _,
                                                                        lineIndex,
                                                                    ) =>
                                                                        lineIndex !==
                                                                        index,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {errors.items && (
                        <p className="mt-2 text-sm text-destructive">
                            {errors.items}
                        </p>
                    )}
                    <div className="mt-4 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processing}
                            onClick={() => submit('draft')}
                        >
                            Simpan draf
                        </Button>
                        <Button
                            type="button"
                            disabled={processing}
                            onClick={() => submit('submitted')}
                        >
                            <Send className="mr-1 h-4 w-4" />
                            Ajukan persetujuan
                        </Button>
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="border-b p-5 dark:border-neutral-800">
                        <h2 className="font-semibold">Daftar SPB</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-neutral-50 text-left text-xs text-neutral-500 uppercase dark:bg-neutral-800">
                                <tr>
                                    <th className="p-4">Nomor / tanggal</th>
                                    <th className="p-4">Peminta</th>
                                    <th className="p-4">Worksite</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Barang</th>
                                    <th className="p-4" />
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((procurementRequest) => (
                                    <tr
                                        key={procurementRequest.id}
                                        className="border-t dark:border-neutral-800"
                                    >
                                        <td className="p-4 font-medium">
                                            {procurementRequest.request_number}
                                            <div className="text-xs text-neutral-500">
                                                {
                                                    procurementRequest.request_date
                                                }
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {procurementRequest.requester?.name}
                                        </td>
                                        <td className="p-4">
                                            {procurementRequest.worksite?.name}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge
                                                status={
                                                    procurementRequest.status
                                                }
                                            />
                                        </td>
                                        <td className="p-4">
                                            {procurementRequest.items.length}{' '}
                                            baris
                                        </td>
                                        <td className="p-4 text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    setSelectedRequest(
                                                        procurementRequest,
                                                    )
                                                }
                                            >
                                                Detail
                                            </Button>
                                            {canCancelSpb(
                                                procurementRequest,
                                                auth.user.id,
                                                isAdmin,
                                            ) && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        openCancellation(
                                                            procurementRequest,
                                                        )
                                                    }
                                                >
                                                    Batalkan
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {requests.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="p-8 text-center text-neutral-500"
                                        >
                                            Belum ada SPB.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            <RequestDialog
                key={selectedRequest?.id ?? 'closed'}
                onCancel={openCancellation}
                request={selectedRequest}
                open={selectedRequest !== null}
                onOpenChange={(open) => !open && setSelectedRequest(null)}
                isAdmin={isAdmin}
                canReceive={isAdmin || auth.user.role === 'warehouse_manager'}
                currentUserId={auth.user.id}
                warehouses={warehouses}
                users={users}
                onApproversAssigned={(requestId) =>
                    router.reload({
                        only: ['requests'],
                        onSuccess: (page) => {
                            const refreshedRequest = (
                                page.props.requests as ProcurementRequest[]
                            ).find((candidate) => candidate.id === requestId);

                            if (refreshedRequest) {
                                setSelectedRequest(refreshedRequest);
                            }
                        },
                    })
                }
            />
            <Dialog
                open={cancelRequest !== null}
                onOpenChange={(open) =>
                    !open && !cancellation.processing && setCancelRequest(null)
                }
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Batalkan SPB</DialogTitle>
                        <DialogDescription>
                            {cancelRequest?.request_number} akan dibatalkan.
                            Riwayat SPB tetap tersimpan.
                        </DialogDescription>
                    </DialogHeader>
                    <Field
                        label="Alasan pembatalan (wajib)"
                        error={cancellation.errors.remarks}
                    >
                        <Textarea
                            aria-label="Alasan pembatalan"
                            value={cancellation.data.remarks}
                            onChange={(event) =>
                                cancellation.setData(
                                    'remarks',
                                    event.target.value,
                                )
                            }
                        />
                    </Field>
                    {Object.entries(cancellation.errors)
                        .filter(([key]) => key !== 'remarks')
                        .map(([key, message]) => (
                            <p key={key} role="alert">
                                {message}
                            </p>
                        ))}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            disabled={cancellation.processing}
                            onClick={() => setCancelRequest(null)}
                        >
                            Kembali
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={
                                cancellation.processing ||
                                !cancellation.data.remarks.trim()
                            }
                            onClick={confirmCancellation}
                        >
                            Konfirmasi pembatalan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function ProductSearchInput({
    selectedItem,
    excludedProductKeys,
    onSelect,
}: {
    selectedItem?: Item;
    excludedProductKeys: Set<string>;
    onSelect: (item: Item) => boolean;
}) {
    const [query, setQuery] = useState(() =>
        selectedItem ? productLabel(selectedItem) : '',
    );
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState<Item[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchResultsId = useId();
    const [dropdownPosition, setDropdownPosition] = useState<{
        left: number;
        width: number;
        maxHeight: number;
        placement: 'top' | 'bottom';
        offset: number;
    } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const availableResults = useMemo(
        () =>
            results.filter(
                (item) => !excludedProductKeys.has(productKey(item)),
            ),
        [excludedProductKeys, results],
    );
    const activeResultIndex =
        availableResults.length === 0
            ? -1
            : Math.min(activeIndex, availableResults.length - 1);

    const updateDropdownPosition = useCallback(() => {
        const input = inputRef.current;

        if (!input) {
            return;
        }

        const rect = input.getBoundingClientRect();
        const viewportPadding = 8;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const availableBelow = viewportHeight - rect.bottom - viewportPadding;
        const availableAbove = rect.top - viewportPadding;
        const placement =
            availableBelow >= 180 || availableBelow >= availableAbove
                ? 'bottom'
                : 'top';
        const availableHeight =
            placement === 'bottom' ? availableBelow : availableAbove;
        const width = Math.min(
            Math.max(rect.width, 256),
            viewportWidth - viewportPadding * 2,
        );

        setDropdownPosition({
            left: Math.min(
                Math.max(viewportPadding, rect.left),
                viewportWidth - width - viewportPadding,
            ),
            width,
            maxHeight: Math.min(320, availableHeight),
            placement,
            offset:
                placement === 'bottom'
                    ? rect.bottom + viewportPadding
                    : viewportHeight - rect.top + viewportPadding,
        });
    }, []);

    useLayoutEffect(() => {
        if (!isOpen) {
            return;
        }

        const animationFrame = window.requestAnimationFrame(
            updateDropdownPosition,
        );
        window.addEventListener('resize', updateDropdownPosition);
        window.addEventListener('scroll', updateDropdownPosition, true);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', updateDropdownPosition);
            window.removeEventListener('scroll', updateDropdownPosition, true);
        };
    }, [isOpen, updateDropdownPosition]);

    useEffect(() => {
        const searchQuery = query.trim();

        const controller = new AbortController();
        const timeout = window.setTimeout(() => {
            fetch(
                ProcurementRequestController.searchItems.url({
                    query: { q: searchQuery },
                }),
                {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                },
            )
                .then((response) =>
                    response.ok ? response.json() : Promise.reject(response),
                )
                .then((items: Item[]) => {
                    setResults(items);
                    setActiveIndex(-1);
                })
                .catch((error: unknown) => {
                    if ((error as DOMException).name !== 'AbortError') {
                        setResults([]);
                    }
                });
        }, 250);

        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [query]);

    const selectItem = (item: Item) => {
        if (!onSelect(item)) {
            return;
        }

        setQuery(productLabel(item));
        setResults([]);
        setActiveIndex(-1);
        setIsOpen(false);
    };

    const dropdown =
        isOpen && dropdownPosition
            ? createPortal(
                  <div
                      id={searchResultsId}
                      role="listbox"
                      className="fixed z-[60] overflow-y-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-md dark:border-neutral-800 dark:bg-neutral-900"
                      style={{
                          left: dropdownPosition.left,
                          width: dropdownPosition.width,
                          maxHeight: dropdownPosition.maxHeight,
                          [dropdownPosition.placement]: dropdownPosition.offset,
                      }}
                  >
                      {availableResults.length === 0 ? (
                          <p className="px-3 py-2 text-sm text-neutral-500">
                              Tidak ada barang ditemukan
                          </p>
                      ) : (
                          availableResults.map((item, index) => (
                              <button
                                  key={item.item_id}
                                  id={`${searchResultsId}-option-${item.item_id}`}
                                  type="button"
                                  role="option"
                                  aria-selected={activeResultIndex === index}
                                  className={`w-full rounded-md px-3 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800 ${
                                      activeResultIndex === index
                                          ? 'bg-neutral-100 dark:bg-neutral-800'
                                          : ''
                                  }`}
                                  onMouseDown={(event) =>
                                      event.preventDefault()
                                  }
                                  onMouseEnter={() => setActiveIndex(index)}
                                  onClick={() => selectItem(item)}
                              >
                                  {productLabel(item)}
                              </button>
                          ))
                      )}
                  </div>,
                  document.body,
              )
            : null;

    return (
        <div className="relative min-w-64">
            <Search className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-neutral-400" />
            <Input
                ref={inputRef}
                value={query}
                onFocus={() => {
                    setIsOpen(true);
                    updateDropdownPosition();
                }}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setResults([]);
                    setActiveIndex(-1);
                    setIsOpen(true);
                }}
                onBlur={() => {
                    window.setTimeout(() => {
                        setIsOpen(false);
                        setResults([]);
                        setActiveIndex(-1);
                        setQuery(
                            selectedItem ? productLabel(selectedItem) : '',
                        );
                    }, 150);
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        setIsOpen(false);

                        return;
                    }

                    if (event.key === 'ArrowDown') {
                        event.preventDefault();

                        if (availableResults.length === 0) {
                            return;
                        }

                        setIsOpen(true);
                        setActiveIndex((index) =>
                            Math.min(index + 1, availableResults.length - 1),
                        );

                        return;
                    }

                    if (event.key === 'ArrowUp') {
                        event.preventDefault();

                        if (availableResults.length === 0) {
                            return;
                        }

                        setActiveIndex((index) => Math.max(index - 1, 0));

                        return;
                    }

                    if (
                        event.key === 'Enter' &&
                        isOpen &&
                        activeResultIndex >= 0
                    ) {
                        event.preventDefault();
                        selectItem(availableResults[activeResultIndex]);
                    }
                }}
                placeholder="Cari barang Feature Master"
                className="pl-9"
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={searchResultsId}
                aria-activedescendant={
                    activeResultIndex >= 0
                        ? `${searchResultsId}-option-${availableResults[activeResultIndex]?.item_id}`
                        : undefined
                }
            />
            {dropdown}
        </div>
    );
}

function StatusBadge({ status }: { status: ProcurementRequest['status'] }) {
    const labels: Record<ProcurementRequest['status'], string> = {
        draft: 'Draf',
        submitted: 'Diajukan',
        awaiting_review: 'Menunggu Pemeriksaan',
        awaiting_acknowledgement: 'Menunggu Mengetahui',
        awaiting_final_approval: 'Menunggu Persetujuan Akhir',
        pending_approval: 'Menunggu Persetujuan',
        approved: 'Disetujui',
        received: 'Diterima Gudang',
        rejected: 'Ditolak',
        canceled: 'Dibatalkan',
    };

    return (
        <Badge
            variant={
                status === 'received' || status === 'approved'
                    ? 'default'
                    : status === 'rejected' || status === 'canceled'
                      ? 'destructive'
                      : 'secondary'
            }
        >
            {labels[status]}
        </Badge>
    );
}

function canCancelSpb(
    request: ProcurementRequest,
    userId: number,
    isAdmin: boolean,
): boolean {
    return (
        (isAdmin || request.requester_id === userId) &&
        [
            'draft',
            'submitted',
            'pending_approval',
            'awaiting_review',
            'awaiting_acknowledgement',
            'awaiting_final_approval',
        ].includes(request.status) &&
        request.items.every((item) => item.received_quantity === 0)
    );
}

function RequestDialog({
    onCancel,
    request,
    open,
    onOpenChange,
    isAdmin,
    canReceive,
    currentUserId,
    warehouses,
    users,
    onApproversAssigned,
}: {
    onCancel: (request: ProcurementRequest) => void;
    request: ProcurementRequest | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isAdmin: boolean;
    canReceive: boolean;
    currentUserId: number;
    warehouses: Warehouse[];
    users: User[];
    onApproversAssigned: (requestId: number) => void;
}) {
    const [remarks, setRemarks] = useState('');
    const [approvedQuantities, setApprovedQuantities] = useState<
        Record<number, string>
    >({});
    const [warehouseId, setWarehouseId] = useState('');
    const [receivedQuantities, setReceivedQuantities] = useState<
        Record<number, string>
    >({});
    const [receiveError, setReceiveError] = useState<string | null>(null);
    const [approverSearch, setApproverSearch] = useState('');
    const [approvers, setApprovers] = useState({
        examiner_id: '',
        acknowledger_one_id: '',
        acknowledger_two_id: '',
        final_approver_id: '',
    });
    const [assignmentError, setAssignmentError] = useState<string | null>(null);

    if (!request) {
        return null;
    }

    const needsQuantityCorrection =
        request.status === 'approved' &&
        request.items.some((item) => item.approved_quantity === null) &&
        request.items.every((item) => item.received_quantity === 0);
    const canSetFinalQuantities =
        isAdmin &&
        currentUserId === request.final_approver_id &&
        (request.status === 'awaiting_final_approval' ||
            needsQuantityCorrection);
    const assignedActorId =
        request.status === 'awaiting_review'
            ? request.examiner_id
            : request.status === 'awaiting_acknowledgement'
              ? request.approval_history?.some(
                    (entry) =>
                        entry.stage === 'acknowledgement' &&
                        entry.action === 'confirm' &&
                        entry.actor_id === request.acknowledger_one_id,
                )
                  ? request.acknowledger_two_id
                  : request.acknowledger_one_id
              : request.status === 'awaiting_final_approval'
                ? request.final_approver_id
                : null;
    const actOnApproval = (action: 'confirm' | 'reject') =>
        router.post(
            ProcurementRequestController.actOnApproval({
                procurementRequest: request.id,
            }).url,
            {
                action,
                remarks,
                ...(canSetFinalQuantities
                    ? {
                          items: request.items.map((item) => ({
                              id: item.id,
                              approved_quantity: Number(
                                  approvedQuantities[item.id] ??
                                      item.approved_quantity ??
                                      (needsQuantityCorrection
                                          ? ''
                                          : item.requested_quantity),
                              ),
                          })),
                      }
                    : {}),
            },
            {
                preserveScroll: true,
                onSuccess: () => onOpenChange(false),
                onError: (errors) =>
                    toast.error(
                        Object.values(errors)[0] ??
                            'Persetujuan gagal disimpan.',
                    ),
            },
        );

    const approve = (decision: 'approved' | 'rejected') =>
        router.patch(
            ProcurementRequestController.approve({
                procurementRequest: request.id,
            }).url,
            {
                decision,
                remarks,
                items: request.items.map((item) => ({
                    id: item.id,
                    approved_quantity: Number(
                        approvedQuantities[item.id] ?? item.requested_quantity,
                    ),
                })),
            },
            { preserveScroll: true, onSuccess: () => onOpenChange(false) },
        );

    const receive = () => {
        setReceiveError(null);

        router.post(
            ProcurementRequestController.receive({
                procurementRequest: request.id,
            }).url,
            {
                warehouse_id: warehouseId,
                items: request.items.map((item) => ({
                    id: item.id,
                    received_quantity: Number(receivedQuantities[item.id] ?? 0),
                })),
            },
            {
                preserveScroll: true,
                onError: (errors) => {
                    const message =
                        errors.receiving ??
                        Object.values(errors)[0] ??
                        'Barang hanya dapat diterima setelah SPB disetujui.';

                    setReceiveError(message);
                    toast.error(message);
                    router.reload({ only: ['requests'] });
                },
                onSuccess: () => onOpenChange(false),
            },
        );
    };

    const availableApprovers = users.filter((user) =>
        `${user.name} ${user.email}`
            .toLowerCase()
            .includes(approverSearch.toLowerCase()),
    );
    const saveApprovers = () => {
        setAssignmentError(null);

        router.put(
            ProcurementRequestController.assignApprovers({
                procurementRequest: request.id,
            }).url,
            approvers,
            {
                preserveScroll: true,
                onError: (errors) => {
                    const message =
                        errors.approvers ??
                        errors.examiner_id ??
                        errors.acknowledger_one_id ??
                        errors.acknowledger_two_id ??
                        errors.final_approver_id ??
                        'Penugasan approver tidak dapat disimpan.';

                    setAssignmentError(message);
                    toast.error(message);
                },
                onSuccess: () => {
                    toast.success('Penugasan approver berhasil disimpan.');
                    onApproversAssigned(request.id);
                },
            },
        );
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    setReceiveError(null);
                }

                onOpenChange(nextOpen);
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{request.request_number}</DialogTitle>
                    <DialogDescription>
                        Yang Membuat: {request.requester?.name ?? '—'} ·{' '}
                        {request.worksite?.name ?? '—'} · {request.request_date}
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] text-sm">
                        <thead className="text-left text-xs text-neutral-500 uppercase">
                            <tr>
                                <th className="p-2">Barang</th>
                                <th className="p-2">Kode / part no.</th>
                                <th className="p-2">Stok</th>
                                <th className="p-2">Minta</th>
                                <th className="p-2">Setuju</th>
                                <th className="p-2">Diterima</th>
                            </tr>
                        </thead>
                        <tbody>
                            {request.items.map((item) => (
                                <tr key={item.id} className="border-t">
                                    <td className="p-2">
                                        {item.item_name}
                                        <div className="text-xs text-neutral-500">
                                            {item.measurement_unit ?? '—'} ·{' '}
                                            {item.manufacturer_code ?? '—'}
                                        </div>
                                    </td>
                                    <td className="p-2">
                                        {item.item_code ?? '—'} /{' '}
                                        {item.part_number ?? '—'}
                                    </td>
                                    <td className="p-2">
                                        {item.current_stock}
                                    </td>
                                    <td className="p-2">
                                        {item.requested_quantity}
                                    </td>
                                    <td className="p-2">
                                        {canSetFinalQuantities ||
                                        (canReceive &&
                                            request.status ===
                                                'pending_approval') ? (
                                            <Input
                                                type="number"
                                                min="1"
                                                max={item.requested_quantity}
                                                value={
                                                    approvedQuantities[
                                                        item.id
                                                    ] ??
                                                    item.approved_quantity ??
                                                    (needsQuantityCorrection
                                                        ? ''
                                                        : item.requested_quantity)
                                                }
                                                onChange={(event) =>
                                                    setApprovedQuantities({
                                                        ...approvedQuantities,
                                                        [item.id]:
                                                            event.target.value,
                                                    })
                                                }
                                            />
                                        ) : (
                                            (item.approved_quantity ?? '—')
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {canReceive &&
                                        request.status === 'approved' ? (
                                            <Input
                                                type="number"
                                                min="0"
                                                max={
                                                    (item.approved_quantity ??
                                                        0) -
                                                    item.received_quantity
                                                }
                                                value={
                                                    receivedQuantities[
                                                        item.id
                                                    ] ?? 0
                                                }
                                                onChange={(event) =>
                                                    setReceivedQuantities({
                                                        ...receivedQuantities,
                                                        [item.id]:
                                                            event.target.value,
                                                    })
                                                }
                                            />
                                        ) : (
                                            `${item.received_quantity}${item.approved_quantity ? ` / ${item.approved_quantity}` : ''}`
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Textarea
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    placeholder={
                        needsQuantityCorrection
                            ? 'Alasan koreksi kuantitas (wajib)'
                            : request.status === 'awaiting_final_approval'
                              ? 'Catatan persetujuan akhir (opsional)'
                              : 'Catatan persetujuan, penolakan, atau pembatalan (opsional)'
                    }
                />
                {request.approved_at && (
                    <p className="text-sm text-neutral-500">
                        Disetujui oleh {request.approver?.name} pada{' '}
                        {new Date(request.approved_at).toLocaleString()}.
                    </p>
                )}
                {isAdmin && ['draft', 'submitted'].includes(request.status) && (
                    <div className="space-y-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                            <p className="font-medium">Assign Approvers</p>
                            <Input
                                value={approverSearch}
                                onChange={(event) =>
                                    setApproverSearch(event.target.value)
                                }
                                placeholder="Cari pengguna"
                                className="max-w-56"
                            />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {(
                                [
                                    ['examiner_id', 'Yang Memeriksa'],
                                    ['acknowledger_one_id', 'Mengetahui 1'],
                                    ['acknowledger_two_id', 'Mengetahui 2'],
                                    ['final_approver_id', 'Menyetujui'],
                                ] as const
                            ).map(([field, label]) => (
                                <Field key={field} label={label}>
                                    <Select
                                        value={approvers[field]}
                                        onValueChange={(value) =>
                                            setApprovers({
                                                ...approvers,
                                                [field]: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih pengguna" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableApprovers
                                                .filter(
                                                    (user) =>
                                                        (field !==
                                                            'final_approver_id' ||
                                                            [
                                                                'admin',
                                                                'super_admin',
                                                            ].includes(
                                                                user.role,
                                                            )) &&
                                                        !Object.entries(
                                                            approvers,
                                                        ).some(
                                                            ([key, value]) =>
                                                                key !== field &&
                                                                value ===
                                                                    String(
                                                                        user.id,
                                                                    ),
                                                        ),
                                                )
                                                .map((user) => (
                                                    <SelectItem
                                                        key={user.id}
                                                        value={String(user.id)}
                                                    >
                                                        {user.name} (
                                                        {user.email})
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            ))}
                        </div>
                        <Button
                            disabled={Object.values(approvers).some(
                                (value) => value === '',
                            )}
                            onClick={saveApprovers}
                        >
                            Simpan penugasan
                        </Button>
                        {assignmentError && (
                            <p
                                className="text-sm text-destructive"
                                role="alert"
                            >
                                {assignmentError}
                            </p>
                        )}
                    </div>
                )}
                <div className="grid gap-2 rounded-lg border p-3 text-xs sm:grid-cols-5">
                    <SignatureRole
                        label="Yang Membuat"
                        name={request.requester?.name}
                    />
                    <SignatureRole
                        label="Yang Memeriksa"
                        name={request.examiner?.name}
                    />
                    <SignatureRole
                        label="Mengetahui"
                        name={request.acknowledger_one?.name}
                    />
                    <SignatureRole
                        label="Mengetahui"
                        name={request.acknowledger_two?.name}
                    />
                    <SignatureRole
                        label="Menyetujui"
                        name={
                            request.final_approver?.name ??
                            request.approver?.name
                        }
                    />
                </div>
                {canReceive && request.status === 'approved' && (
                    <Field label="Gudang tujuan">
                        <Select
                            value={warehouseId}
                            onValueChange={setWarehouseId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih gudang" />
                            </SelectTrigger>
                            <SelectContent>
                                {warehouses.map((warehouse) => (
                                    <SelectItem
                                        key={warehouse.id}
                                        value={String(warehouse.id)}
                                    >
                                        {warehouse.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                )}
                {receiveError && (
                    <p className="text-sm text-destructive" role="alert">
                        {receiveError}
                    </p>
                )}
                <DialogFooter>
                    {canCancelSpb(request, currentUserId, isAdmin) && (
                        <Button
                            variant="destructive"
                            onClick={() => onCancel(request)}
                        >
                            Batalkan
                        </Button>
                    )}
                    {isAdmin && request.status === 'pending_approval' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => approve('rejected')}
                            >
                                Tolak
                            </Button>
                            <Button onClick={() => approve('approved')}>
                                <Check className="mr-1 h-4 w-4" />
                                Setujui
                            </Button>
                        </>
                    )}
                    {assignedActorId === currentUserId && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => actOnApproval('reject')}
                            >
                                Tolak
                            </Button>
                            <Button onClick={() => actOnApproval('confirm')}>
                                Konfirmasi tahap
                            </Button>
                        </>
                    )}
                    {canSetFinalQuantities && needsQuantityCorrection && (
                        <Button
                            onClick={() => actOnApproval('confirm')}
                            disabled={!remarks.trim()}
                        >
                            Konfirmasi koreksi kuantitas
                        </Button>
                    )}
                    {canReceive &&
                        request.status === 'approved' &&
                        !needsQuantityCorrection && (
                            <Button disabled={!warehouseId} onClick={receive}>
                                <Truck className="mr-1 h-4 w-4" />
                                Konfirmasi penerimaan
                            </Button>
                        )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function SignatureRole({ label, name }: { label: string; name?: string }) {
    return (
        <div className="min-h-16 border-b pb-2 sm:border-r sm:border-b-0 sm:pr-2">
            <p className="font-medium">{label}</p>
            <p className="mt-6 text-neutral-500">
                {name ?? 'Belum ditetapkan'}
            </p>
        </div>
    );
}

ProcurementIndex.layout = {
    breadcrumbs: [{ title: 'Pengadaan Barang', href: procurementIndex().url }],
};
