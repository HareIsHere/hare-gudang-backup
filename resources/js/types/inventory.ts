import type {
    Product,
    ProductSpecification,
    Project,
    Worksite,
} from './master';

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'warehouse_manager' | 'user';
}

export interface Warehouse {
    id: number;
    name: string;
    location: string | null;
    worksite_id?: number | null;
    worksite?: Worksite;
    created_at: string;
    updated_at: string;
    users?: User[];
}

export interface Inventory {
    id: number;
    item_id: number;
    warehouse_id: number;
    quantity: number;
    created_at: string;
    updated_at: string;
    warehouse?: Warehouse;
    item?: Item;
}

export interface Item {
    item_id: number;
    item_name: string;
    category?: string | null;
    product_id?: number | null;
    product_specification_id?: number | null;
    product?: Product;
    specification?: ProductSpecification;
    created_at: string;
    updated_at: string;
    inventories?: Inventory[];
    warehouses?: Warehouse[];
}

export interface InventoryRequest {
    id: number;
    user_id: number;
    item_id: number;
    warehouse_id: number;
    project_id?: number | null;
    worksite_id?: number | null;
    request_description: string | null;
    qty: number;
    status: 'requested' | 'onReview' | 'finished' | 'canceled';
    type: 'IN' | 'OUT';
    reason: string | null;
    created_at: string;
    updated_at: string;
    canceled_at: string | null;
    item?: Item;
    warehouse?: Warehouse;
    user?: User;
    project?: Project;
    worksite?: Worksite;
}

export interface InventoryMutation {
    id: number;
    item_id: number;
    from_warehouse_id: number | null;
    to_warehouse_id: number | null;
    quantity: number;
    type: 'IN' | 'OUT' | 'TRANSFER' | 'REQUEST';
    user_id: number;
    reference_type: string | null;
    reference_id: number | null;
    created_at: string;
    updated_at: string;
    item?: Item;
    from_warehouse?: Warehouse;
    to_warehouse?: Warehouse;
    user?: User;
}

export interface ProcurementRequestItem {
    id: number;
    item_id: number | null;
    item_name: string;
    item_code: string | null;
    part_number: string | null;
    manufacturer_code: string | null;
    measurement_unit: string | null;
    current_stock: number;
    requested_quantity: number;
    approved_quantity: number | null;
    received_quantity: number;
    description: string | null;
    item?: Item;
}

export interface ProcurementRequest {
    id: number;
    request_number: string;
    request_date: string;
    worksite_id: number | null;
    requester_id: number;
    status:
        | 'draft'
        | 'submitted'
        | 'awaiting_review'
        | 'awaiting_acknowledgement'
        | 'awaiting_final_approval'
        | 'pending_approval'
        | 'approved'
        | 'received'
        | 'rejected'
        | 'canceled';
    description: string | null;
    approved_by: number | null;
    approved_at: string | null;
    approval_remarks: string | null;
    rejected_by: number | null;
    rejected_at: string | null;
    rejection_remarks: string | null;
    canceled_at: string | null;
    examiner_id: number | null;
    acknowledger_one_id: number | null;
    acknowledger_two_id: number | null;
    final_approver_id: number | null;
    examiner?: User;
    acknowledger_one?: User;
    acknowledger_two?: User;
    final_approver?: User;
    approval_history?: Array<{ actor_id: number | null; stage: string; action: string; remarks: string | null; created_at: string }>;
    cancellation_remarks: string | null;
    items: ProcurementRequestItem[];
    requester?: User;
    approver?: User;
    rejector?: User;
    worksite?: Worksite;
}
