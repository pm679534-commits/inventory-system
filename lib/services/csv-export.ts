import type { ExportFilterInput } from '@/lib/validations';

interface Product {
  sku: string;
  barcode?: string | null;
  name: string;
  category_name?: string | null;
  variant?: string | null;
  unit: string;
  cost_price: number;
  sale_price: number;
  status: string;
  total_quantity?: number;
  total_reserved?: number;
  total_available?: number;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  is_active: boolean;
}

interface Order {
  order_number: string;
  customer_name?: string | null;
  customer_email?: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  warehouse_name?: string | null;
}

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape double quotes and wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateProductsCSV(products: Product[]): string {
  const headers = [
    'SKU',
    'Barcode',
    'Product Name',
    'Category',
    'Variant',
    'Unit',
    'Cost Price',
    'Sale Price',
    'Total Quantity',
    'Reserved',
    'Available',
    'Status',
  ];

  let csv = headers.map(escapeCSV).join(',') + '\n';

  products.forEach((product) => {
    const row = [
      product.sku,
      product.barcode || '',
      product.name,
      product.category_name || '',
      product.variant || '',
      product.unit,
      product.cost_price.toFixed(2),
      product.sale_price.toFixed(2),
      product.total_quantity || 0,
      product.total_reserved || 0,
      product.total_available || 0,
      product.status,
    ];
    csv += row.map(escapeCSV).join(',') + '\n';
  });

  return csv;
}

export function generateWarehousesCSV(warehouses: Warehouse[]): string {
  const headers = [
    'Warehouse ID',
    'Name',
    'Code',
    'Address',
    'City',
    'Country',
    'Active',
  ];

  let csv = headers.map(escapeCSV).join(',') + '\n';

  warehouses.forEach((warehouse) => {
    const row = [
      warehouse.id,
      warehouse.name,
      warehouse.code,
      warehouse.address || '',
      warehouse.city || '',
      warehouse.country || '',
      warehouse.is_active ? 'Yes' : 'No',
    ];
    csv += row.map(escapeCSV).join(',') + '\n';
  });

  return csv;
}

export function generateOrdersCSV(orders: Order[]): string {
  const headers = [
    'Order Number',
    'Customer Name',
    'Customer Email',
    'Warehouse',
    'Status',
    'Total Amount',
    'Created At',
  ];

  let csv = headers.map(escapeCSV).join(',') + '\n';

  orders.forEach((order) => {
    const row = [
      order.order_number,
      order.customer_name || '',
      order.customer_email || '',
      order.warehouse_name || '',
      order.status,
      order.total_amount.toFixed(2),
      order.created_at,
    ];
    csv += row.map(escapeCSV).join(',') + '\n';
  });

  return csv;
}

export function getExportFilename(
  type: 'excel' | 'csv' | '1c_xml',
  exportType: string,
  filters: ExportFilterInput
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filterSuffix = filters.warehouseId || filters.categoryId ? '_filtered' : '';

  let baseName = 'inventory_export';
  if (exportType !== 'all') {
    baseName = `${exportType}_export`;
  }

  if (type === 'excel') {
    return `${baseName}_${timestamp}${filterSuffix}.xlsx`;
  } else if (type === 'csv') {
    return `${baseName}_${timestamp}${filterSuffix}.csv`;
  } else {
    return `${baseName}_${timestamp}${filterSuffix}.zip`;
  }
}
