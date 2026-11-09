<?php

namespace App\Http\Controllers;

use App\Http\Requests\ActOnProcurementRequestApproval;
use App\Http\Requests\ApproveProcurementRequest;
use App\Http\Requests\AssignProcurementApproversRequest;
use App\Http\Requests\DecideProcurementReceivingException;
use App\Http\Requests\OverrideProcurementReceivingRequest;
use App\Http\Requests\ReceiveProcurementRequest;
use App\Http\Requests\RequestProcurementReceivingException;
use App\Http\Requests\StoreProcurementRequest;
use App\Models\InventoryMutation;
use App\Models\Item;
use App\Models\ProcurementReceivingException;
use App\Models\ProcurementReceivingOverride;
use App\Models\ProcurementRequest;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\Worksite;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProcurementRequestController extends Controller
{
    public function __construct(protected InventoryService $inventoryService) {}

    public function index(): Response
    {
        $user = auth()->user();
        $requests = ProcurementRequest::with(['items.item.product', 'items.item.specification', 'requester', 'approver', 'rejector', 'examiner', 'acknowledgerOne', 'acknowledgerTwo', 'finalApprover', 'approvalHistory.actor', 'worksite'])
            ->when(! $user->isAdmin(), fn ($query) => $query->where(function ($visibleRequests) use ($user): void {
                $visibleRequests
                    ->where('requester_id', $user->id)
                    ->orWhere('examiner_id', $user->id)
                    ->orWhere('acknowledger_one_id', $user->id)
                    ->orWhere('acknowledger_two_id', $user->id)
                    ->orWhere('final_approver_id', $user->id);
            }))
            ->latest()
            ->get();

        return Inertia::render('procurement/index', [
            'requests' => $requests,
            'worksites' => Worksite::where('stage', '!=', 'Drop')->orderBy('name')->get(),
            'warehouses' => $user->isSuperAdmin() ? Warehouse::with('worksite')->orderBy('name')->get() : $user->warehouses()->with('worksite')->orderBy('name')->get(),
            'users' => $user->isAdmin() ? User::orderBy('name')->get(['id', 'name', 'email', 'role']) : [],
        ]);
    }

    public function searchItems(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
        ]);
        $query = trim((string) ($validated['q'] ?? ''));

        $items = Item::query()
            ->with(['product:id,name', 'specification:id,name,part_number,measurement_unit', 'inventories' => fn ($query) => $query->when($request->user()->role === 'admin', fn ($query) => $query->whereIn('warehouse_id', $request->user()->warehouses()->select('warehouses.id'))), 'inventories.warehouse.worksite'])
            ->when($query !== '', fn ($itemQuery) => $itemQuery->where(fn ($searchQuery) => $searchQuery->where('item_name', 'like', "%{$query}%")->orWhereHas('product', fn ($productQuery) => $productQuery->where('name', 'like', "%{$query}%"))))
            ->orderBy('item_name')
            ->limit(20)
            ->get();

        return response()->json($items);
    }

    public function store(StoreProcurementRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $worksiteId = $validated['worksite_id'] ?? null;
        $items = Item::with(['product', 'specification', 'inventories' => function ($query) use ($worksiteId, $request) {
            if ($request->user()->role === 'admin') {
                $query->whereIn('warehouse_id', $request->user()->warehouses()->select('warehouses.id'));
            }
            if ($worksiteId) {
                $query->whereHas('warehouse', fn ($warehouseQuery) => $warehouseQuery->where('worksite_id', $worksiteId));
            }
        }])->whereIn('item_id', collect($validated['items'])->pluck('item_id'))->get()->keyBy('item_id');

        $procurementRequest = DB::transaction(function () use ($validated, $items, $request): ProcurementRequest {
            $procurementRequest = ProcurementRequest::create([
                'request_number' => 'SPB-'.now()->format('Ymd-Hisv'),
                'request_date' => $validated['request_date'],
                'worksite_id' => $validated['worksite_id'] ?? null,
                'requester_id' => $request->user()->id,
                'status' => $validated['status'],
                'description' => $validated['description'] ?? null,
            ]);

            foreach ($validated['items'] as $line) {
                $item = $items->get($line['item_id']);

                $procurementRequest->items()->create([
                    'item_id' => $item->item_id,
                    'item_name' => $item->item_name,
                    'item_code' => (string) $item->item_id,
                    'part_number' => $item->specification?->part_number,
                    'manufacturer_code' => $line['manufacturer_code'] ?? null,
                    'measurement_unit' => $line['measurement_unit'],
                    'current_stock' => $item->inventories->sum('quantity'),
                    'requested_quantity' => $line['requested_quantity'],
                    'description' => $line['description'] ?? null,
                ]);
            }

            return $procurementRequest;
        });

        return to_route('procurement.index')->with('success', "Procurement request {$procurementRequest->request_number} saved.");
    }

    public function assignApprovers(AssignProcurementApproversRequest $request, ProcurementRequest $procurementRequest): RedirectResponse
    {
        if (! in_array($procurementRequest->status, ['draft', 'submitted'], true)) {
            return back()->withErrors(['approvers' => 'Approvers can only be assigned before review starts.']);
        }
        $validated = $request->validated();
        $users = User::whereIn('id', $validated)->get()->keyBy('id');
        if ($users->count() !== 4 || $users->has($procurementRequest->requester_id) || ! $users->get($validated['final_approver_id'])?->isAdmin()) {
            return back()->withErrors(['approvers' => 'Assignments must be distinct, cannot include the creator, and require an admin final approver.']);
        }
        DB::transaction(function () use ($procurementRequest, $validated, $request): void {
            $procurementRequest->update([...$validated, 'status' => 'awaiting_review']);
            foreach (['examiner_id' => 'examiner', 'acknowledger_one_id' => 'acknowledger_one', 'acknowledger_two_id' => 'acknowledger_two', 'final_approver_id' => 'final_approver'] as $field => $stage) {
                $procurementRequest->approvalHistory()->create(['actor_id' => $request->user()->id, 'stage' => $stage, 'action' => 'assigned', 'remarks' => "Assigned user {$validated[$field]}."]);
            }
        });

        return back()->with('success', 'Approvers assigned.');
    }

    public function actOnApproval(ActOnProcurementRequestApproval $request, ProcurementRequest $procurementRequest): RedirectResponse
    {
        $stage = match ($procurementRequest->status) {
            'awaiting_review' => ['field' => 'examiner_id', 'next' => 'awaiting_acknowledgement', 'stage' => 'review'],
            'awaiting_acknowledgement' => $procurementRequest->approvalHistory()->where('stage', 'acknowledgement')->where('action', 'confirm')->where('actor_id', $procurementRequest->acknowledger_one_id)->exists()
                ? ['field' => 'acknowledger_two_id', 'next' => 'awaiting_final_approval', 'stage' => 'acknowledgement']
                : ['field' => 'acknowledger_one_id', 'next' => 'awaiting_acknowledgement', 'stage' => 'acknowledgement'],
            'awaiting_final_approval' => ['field' => 'final_approver_id', 'next' => 'approved', 'stage' => 'final_approval'],
            'approved' => $procurementRequest->items()->whereNull('approved_quantity')->exists()
                ? ['field' => 'final_approver_id', 'next' => 'approved', 'stage' => 'quantity_correction']
                : null,
            default => null,
        };
        if (! $stage || $procurementRequest->{$stage['field']} !== $request->user()->id) {
            abort(403);
        }
        $validated = $request->validated();
        DB::transaction(function () use ($procurementRequest, $request, $validated, $stage): void {
            $locked = ProcurementRequest::lockForUpdate()->findOrFail($procurementRequest->id);
            if ($locked->status !== $procurementRequest->status) {
                abort(409);
            }
            if (in_array($stage['stage'], ['final_approval', 'quantity_correction'], true)) {
                abort_unless($request->user()->isAdmin(), 403);
                $requestItems = $locked->items()->lockForUpdate()->get();
                if ($stage['stage'] === 'quantity_correction') {
                    if ($validated['action'] !== 'confirm' || blank($validated['remarks'] ?? null) || $requestItems->contains(fn ($item) => $item->received_quantity > 0) || ! $requestItems->contains(fn ($item) => $item->approved_quantity === null)) {
                        throw ValidationException::withMessages(['items' => 'Quantity correction requires a reason, missing quantities, and no prior receipts.']);
                    }
                }
                if ($validated['action'] === 'confirm') {
                    $approvedItems = collect($validated['items'] ?? [])->keyBy('id');
                    if ($requestItems->isEmpty() || $approvedItems->count() !== $requestItems->count()) {
                        throw ValidationException::withMessages(['items' => 'Explicitly approve the quantity of every SPB line.']);
                    }
                    foreach ($requestItems as $item) {
                        $quantity = $approvedItems->get($item->id)['approved_quantity'] ?? null;
                        if ($quantity === null || $quantity > $item->requested_quantity || ($stage['stage'] === 'quantity_correction' && $item->approved_quantity !== null && $quantity !== $item->approved_quantity)) {
                            throw ValidationException::withMessages(['items' => 'Approved quantities must match this SPB, remain within requested quantities, and preserve previously approved quantities.']);
                        }
                        $item->update(['approved_quantity' => $quantity]);
                    }
                }
            }
            $next = $validated['action'] === 'reject' ? 'rejected' : $stage['next'];
            $locked->update(['status' => $next, ...($next === 'approved' && $stage['stage'] !== 'quantity_correction' ? ['approved_by' => $request->user()->id, 'approved_at' => now(), 'approval_remarks' => $validated['remarks'] ?? null] : []), ...($next === 'rejected' ? ['rejected_by' => $request->user()->id, 'rejected_at' => now(), 'rejection_remarks' => $validated['remarks']] : [])]);
            $locked->approvalHistory()->create(['actor_id' => $request->user()->id, 'stage' => $stage['stage'], 'action' => $validated['action'], 'remarks' => ($validated['remarks'] ?? '').(isset($validated['items']) ? ' Quantities: '.json_encode($validated['items']) : '')]);
        });

        return back()->with('success', 'Approval step recorded.');
    }

    public function approve(ApproveProcurementRequest $request, ProcurementRequest $procurementRequest): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $request, $procurementRequest): void {
            $procurementRequest = ProcurementRequest::lockForUpdate()->findOrFail($procurementRequest->id);

            if ($procurementRequest->status !== 'pending_approval') {
                abort(422, 'Only pending procurement requests can be approved or rejected.');
            }

            if ($validated['decision'] === 'rejected') {
                $procurementRequest->update([
                    'status' => 'rejected',
                    'rejected_by' => $request->user()->id,
                    'rejected_at' => now(),
                    'rejection_remarks' => $validated['remarks'] ?? null,
                ]);

                return;
            }

            $approvedItems = collect($validated['items'])->keyBy('id');
            $requestItems = $procurementRequest->items()->lockForUpdate()->get();

            if ($approvedItems->count() !== $requestItems->count() || $requestItems->contains(fn ($item) => ! $approvedItems->has($item->id))) {
                abort(422, 'Every procurement line must be approved explicitly.');
            }

            foreach ($requestItems as $item) {
                $item->update(['approved_quantity' => $approvedItems[$item->id]['approved_quantity']]);
            }

            $procurementRequest->update([
                'status' => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
                'approval_remarks' => $validated['remarks'] ?? null,
            ]);
        });

        return back()->with('success', 'Procurement request approved. Stock will change only when goods are received.');
    }

    public function receive(ReceiveProcurementRequest $request, ProcurementRequest $procurementRequest): RedirectResponse
    {
        return $this->recordReceiving($request, $procurementRequest);
    }

    public function overrideReceiving(OverrideProcurementReceivingRequest $request, ProcurementRequest $procurementRequest): RedirectResponse
    {
        return $this->recordReceiving($request, $procurementRequest);
    }

    private function recordReceiving(ReceiveProcurementRequest $request, ProcurementRequest $procurementRequest): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $request, $procurementRequest): void {
            $procurementRequest = ProcurementRequest::lockForUpdate()->findOrFail($procurementRequest->id);

            if ($request instanceof OverrideProcurementReceivingRequest && ProcurementReceivingOverride::where('submission_id', $validated['submission_id'])->exists()) {
                throw ValidationException::withMessages(['submission_id' => 'This override submission has already been received.']);
            }

            if ($procurementRequest->status !== 'approved') {
                throw ValidationException::withMessages([
                    'receiving' => 'Only approved procurement requests can be received.',
                ]);
            }

            $warehouse = Warehouse::findOrFail($validated['warehouse_id']);
            abort_if($request->user()->role === 'admin' && ! $request->user()->canAccessWarehouse($warehouse->id), 403);
            if ($request->user()->isWarehouseManager() && ! $request->user()->warehouses()->whereKey($warehouse->id)->exists()) {
                throw ValidationException::withMessages([
                    'warehouse_id' => 'You are not assigned to this warehouse.',
                ]);
            }
            $receiptLines = collect($validated['items'])->keyBy('id');
            $receivingException = null;
            if ($request->user()->role === 'admin') {
                $exception = ProcurementReceivingException::lockForUpdate()->find($validated['receiving_exception_id'] ?? null);
                if (! $exception || $exception->status !== 'approved' || $exception->requested_by !== $request->user()->id || $exception->procurement_request_id !== $procurementRequest->id || $exception->warehouse_id !== $warehouse->id || $exception->revoked_at || ($exception->expires_at && $exception->expires_at->isPast())) {
                    throw ValidationException::withMessages(['receiving_exception_id' => 'An approved receiving exception for this SPB and warehouse is required.']);
                }
                $receivingException = $exception;
            }
            $requestItems = $procurementRequest->items()->with('item')->lockForUpdate()->get();

            foreach ($receiptLines as $lineId => $line) {
                $requestItem = $requestItems->firstWhere('id', $lineId);
                if (! $requestItem) {
                    throw ValidationException::withMessages(['items' => 'A received line does not belong to this procurement request.']);
                }

                if ($requestItem->approved_quantity < $line['received_quantity'] + $requestItem->received_quantity) {
                    throw ValidationException::withMessages(['items' => 'Received quantity cannot exceed the approved quantity.']);
                }
            }

            if ($receivingException) {
                $consumed = $receivingException->consumed_quantities ?? [];
                foreach ($receiptLines as $line) {
                    $limit = $receivingException->quantities[(string) $line['id']] ?? 0;
                    if ($limit < $line['received_quantity'] + ($consumed[(string) $line['id']] ?? 0)) {
                        throw ValidationException::withMessages(['items' => 'Receiving quantity exceeds the approved exception allowance.']);
                    }
                    $consumed[(string) $line['id']] = ($consumed[(string) $line['id']] ?? 0) + $line['received_quantity'];
                }
                $receivingException->update(['consumed_quantities' => $consumed]);
            }

            $mutationIds = [];
            foreach ($requestItems as $requestItem) {
                $receivedQuantity = $receiptLines->get($requestItem->id)['received_quantity'] ?? 0;

                if ($receivedQuantity === 0) {
                    continue;
                }

                if (! $requestItem->item) {
                    throw ValidationException::withMessages(['items' => "Item {$requestItem->item_name} is no longer available for receiving."]);
                }

                $this->inventoryService->recordMutation(
                    item: $requestItem->item,
                    quantity: $receivedQuantity,
                    type: 'IN',
                    user: $request->user(),
                    toWarehouse: $warehouse,
                    referenceType: 'ProcurementRequest',
                    referenceId: $procurementRequest->id,
                );

                $requestItem->increment('received_quantity', $receivedQuantity);
                if ($request instanceof OverrideProcurementReceivingRequest) {
                    $mutationIds[] = InventoryMutation::where('reference_type', 'ProcurementRequest')
                        ->where('reference_id', $procurementRequest->id)
                        ->where('item_id', $requestItem->item_id)
                        ->where('user_id', $request->user()->id)
                        ->latest('id')->firstOrFail()->id;
                }
            }

            $completed = $procurementRequest->items()
                ->get()
                ->every(fn ($item) => $item->received_quantity >= $item->approved_quantity);

            if ($completed) {
                $procurementRequest->update(['status' => 'received']);
            }

            if ($request instanceof OverrideProcurementReceivingRequest) {
                ProcurementReceivingOverride::create([
                    'submission_id' => $validated['submission_id'],
                    'procurement_request_id' => $procurementRequest->id,
                    'warehouse_id' => $warehouse->id,
                    'actor_id' => $request->user()->id,
                    'event' => 'RECEIVING_OVERRIDE',
                    'reason' => trim($validated['reason']),
                    'quantities' => $receiptLines->mapWithKeys(fn (array $line) => [(string) $line['id'] => $line['received_quantity']])->all(),
                    'mutation_ids' => $mutationIds,
                ]);
            }

            if ($receivingException) {
                $remainingAllowanceExists = collect($receivingException->quantities)
                    ->contains(fn ($quantity, $lineId): bool => $quantity > ($consumed[$lineId] ?? 0));
                if (! $remainingAllowanceExists) {
                    $receivingException->update(['status' => 'exhausted']);
                }
                $receivingException->audits()->create([
                    'procurement_request_id' => $procurementRequest->id,
                    'warehouse_id' => $warehouse->id,
                    'actor_id' => $request->user()->id,
                    'event' => 'received',
                    'reason' => $receivingException->reason,
                    'quantities' => $receiptLines->mapWithKeys(fn (array $line) => [(string) $line['id'] => $line['received_quantity']])->all(),
                    'receiving_reference' => "ProcurementRequest:{$procurementRequest->id}",
                ]);
            }
        });

        return back()->with('success', 'Warehouse receipt recorded and inventory updated.');
    }

    public function requestReceivingException(RequestProcurementReceivingException $request, ProcurementRequest $procurementRequest): RedirectResponse
    {
        $validated = $request->validated();
        abort_unless($request->user()->canAccessWarehouse($validated['warehouse_id']), 403);
        $quantities = collect($validated['items'])->mapWithKeys(fn ($item) => [(string) $item['id'] => $item['received_quantity']])->all();

        DB::transaction(function () use ($procurementRequest, $validated, $quantities, $request): void {
            $procurementRequest = ProcurementRequest::lockForUpdate()->findOrFail($procurementRequest->id);
            if ($procurementRequest->status !== 'approved') {
                throw ValidationException::withMessages(['receiving' => 'Only approved SPBs can receive an exception.']);
            }

            Warehouse::findOrFail($validated['warehouse_id']);
            $requestItems = $procurementRequest->items()->lockForUpdate()->get()->keyBy('id');
            foreach ($quantities as $lineId => $quantity) {
                $requestItem = $requestItems->get($lineId);
                if (! $requestItem || $requestItem->approved_quantity === null || $quantity > $requestItem->approved_quantity - $requestItem->received_quantity) {
                    throw ValidationException::withMessages(['items' => 'Exception quantities must belong to this approved SPB and cannot exceed its remaining quantities.']);
                }
            }

            $exception = ProcurementReceivingException::create([
                'procurement_request_id' => $procurementRequest->id,
                'warehouse_id' => $validated['warehouse_id'],
                'requested_by' => $request->user()->id,
                'status' => 'pending',
                'reason' => trim($validated['reason']),
                'quantities' => $quantities,
                'expires_at' => now()->addDays(7),
            ]);
            $exception->audits()->create([
                'procurement_request_id' => $procurementRequest->id,
                'warehouse_id' => $validated['warehouse_id'],
                'actor_id' => $request->user()->id,
                'event' => 'requested',
                'reason' => $exception->reason,
                'quantities' => $quantities,
            ]);
        });

        return back()->with('success', 'Receiving exception requested.');
    }

    public function decideReceivingException(DecideProcurementReceivingException $request, ProcurementReceivingException $receivingException): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($receivingException, $request, $validated): void {
            $procurementRequest = ProcurementRequest::lockForUpdate()->findOrFail($receivingException->procurement_request_id);
            $receivingException = ProcurementReceivingException::lockForUpdate()->findOrFail($receivingException->id);
            if ($receivingException->requested_by === $request->user()->id) {
                abort(403);
            }
            if ($receivingException->status !== 'pending') {
                throw ValidationException::withMessages(['decision' => 'Only pending receiving exceptions can be decided.']);
            }

            if ($validated['decision'] === 'approved') {
                if ($procurementRequest->status !== 'approved' || ($receivingException->expires_at && $receivingException->expires_at->isPast())) {
                    throw ValidationException::withMessages(['decision' => 'Only exceptions for approved SPBs can be authorized.']);
                }
                $requestItems = $procurementRequest->items()->lockForUpdate()->get()->keyBy('id');
                $activeExceptions = ProcurementReceivingException::query()
                    ->where('procurement_request_id', $procurementRequest->id)
                    ->where('warehouse_id', $receivingException->warehouse_id)
                    ->where('requested_by', $receivingException->requested_by)
                    ->where('status', 'approved')
                    ->whereNull('revoked_at')
                    ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                    ->lockForUpdate()
                    ->get();
                foreach ($receivingException->quantities as $lineId => $quantity) {
                    $requestItem = $requestItems->get($lineId);
                    $reserved = $activeExceptions->sum(fn (ProcurementReceivingException $exception): int => max(0, ($exception->quantities[$lineId] ?? 0) - ($exception->consumed_quantities[$lineId] ?? 0)));
                    if (! $requestItem || $requestItem->approved_quantity === null || $quantity + $reserved > $requestItem->approved_quantity - $requestItem->received_quantity) {
                        throw ValidationException::withMessages(['decision' => 'The requested exception quantities are no longer available.']);
                    }
                }
            }

            $receivingException->update([
                'status' => $validated['decision'],
                'authorized_by' => $request->user()->id,
                'authorized_at' => now(),
                'decision_remarks' => $validated['remarks'] ?? null,
            ]);
            $receivingException->audits()->create([
                'procurement_request_id' => $receivingException->procurement_request_id,
                'warehouse_id' => $receivingException->warehouse_id,
                'actor_id' => $request->user()->id,
                'event' => $validated['decision'],
                'reason' => $validated['remarks'] ?? $receivingException->reason,
                'quantities' => $receivingException->quantities,
            ]);
        });

        return back()->with('success', 'Receiving exception decision recorded.');
    }

    public function cancel(Request $request, ProcurementRequest $procurementRequest): RedirectResponse
    {
        if (! $request->user()->isAdmin() && $procurementRequest->requester_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate(['remarks' => ['required', 'string', 'max:2000']]);
        DB::transaction(function () use ($request, $procurementRequest, $validated): void {
            $locked = ProcurementRequest::lockForUpdate()->findOrFail($procurementRequest->id);
            if (! in_array($locked->status, ['draft', 'submitted', 'pending_approval', 'awaiting_review', 'awaiting_acknowledgement', 'awaiting_final_approval'], true) || $locked->items()->where('received_quantity', '>', 0)->exists()) {
                throw ValidationException::withMessages(['status' => 'Only SPBs awaiting final approval with no receipts can be canceled.']);
            }
            $locked->update([
                'status' => 'canceled',
                'canceled_at' => now(),
                'cancellation_remarks' => $validated['remarks'],
            ]);
            $locked->approvalHistory()->create(['actor_id' => $request->user()->id, 'stage' => 'cancellation', 'action' => 'canceled', 'remarks' => $validated['remarks']]);
        });

        return back()->with('success', 'Procurement request canceled.');
    }
}
