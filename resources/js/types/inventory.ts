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
    role: 'super_admin' | 'admin' | 'user';
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
    qty: number;
    status: 'requested' | 'onReview' | 'finished' | 'canceled';
    type: 'IN' | 'OUT';
    reason: string | null;
    created_at: string;
    updated_at: string;
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
