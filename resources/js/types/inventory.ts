export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
}

export interface Warehouse {
    id: number;
    name: string;
    location: string | null;
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
    qty: number;
    status: 'requested' | 'onReview' | 'finished' | 'canceled';
    type: 'IN' | 'OUT';
    reason: string | null;
    created_at: string;
    updated_at: string;
    item?: Item;
    warehouse?: Warehouse;
    user?: User;
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
