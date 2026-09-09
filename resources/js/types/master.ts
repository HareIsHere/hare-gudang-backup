export type AuditUser = {
    id: number;
    name: string;
};

export type Stage = 'Revision' | 'Ready';

export interface WorksiteCategory {
    id: number;
    group: string;
    name: string;
    description: string | null;
    stage: Stage;
    created_at: string;
    created_by: number | null;
    creator: AuditUser | null;
    updated_at: string;
    updated_by: number | null;
    updater: AuditUser | null;
}

export interface Worksite {
    id: number;
    worksite_category_id: number | null;
    group: string;
    name: string;
    address: string | null;
    description: string | null;
    stage: Stage;
    category: { id: number; name: string; group?: string } | null;
    created_at: string;
    created_by: number | null;
    creator: AuditUser | null;
    updated_at: string;
    updated_by: number | null;
    updater: AuditUser | null;
}

export interface Project {
    id: number;
    group: string;
    name: string;
    progress: number;
    description: string | null;
    created_at: string;
    created_by: number | null;
    creator: AuditUser | null;
    updated_at: string;
    updated_by: number | null;
    updater: AuditUser | null;
}

export interface Product {
    id: number;
    group: string;
    category: string;
    name: string;
    specifications_count?: number;
    specifications?: ProductSpecification[];
    description: string | null;
    stage: Stage;
    created_at: string;
    created_by: number | null;
    creator: AuditUser | null;
    updated_at: string;
    updated_by: number | null;
    updater: AuditUser | null;
}

export interface ProductSpecification {
    id: number;
    product_id: number;
    group: string;
    name: string;
    part_number: string | null;
    measurement_unit: string | null;
    prices_count?: number;
    description: string | null;
    stage: Stage;
    product: { id: number; name: string } | null;
    created_at: string;
    created_by: number | null;
    creator: AuditUser | null;
    updated_at: string;
    updated_by: number | null;
    updater: AuditUser | null;
}

export interface Price {
    id: number;
    product_id: number | null;
    product_specification_id: number;
    group: string;
    vendor: string;
    currency: string;
    price: string | number;
    last_price: string | number | null;
    stage: Stage;
    product: { id: number; name: string } | null;
    specification: {
        id: number;
        name: string;
        part_number: string | null;
        measurement_unit: string | null;
    } | null;
    created_at: string;
    created_by: number | null;
    creator: AuditUser | null;
    updated_at: string;
    updated_by: number | null;
    updater: AuditUser | null;
}
