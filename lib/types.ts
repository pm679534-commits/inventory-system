export type UserRole = 'Admin' | 'Manager' | 'Staff';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  profile: Profile;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  country: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = 'active' | 'inactive' | 'discontinued';

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  variant: string | null;
  unit: string;
  cost_price: number;
  sale_price: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity: number;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  warehouse_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  status: OrderStatus;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export type ExportType = 'excel' | '1c_xml';

export interface ExportAudit {
  id: string;
  user_id: string | null;
  export_type: ExportType;
  filters: Record<string, any> | null;
  record_count: number | null;
  file_size_bytes: number | null;
  created_at: string;
}

export interface ProductWithDetails extends Product {
  category?: Category;
  stock?: Stock[];
  total_quantity?: number;
  available_quantity?: number;
}
