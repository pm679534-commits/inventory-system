import ExcelJS from 'exceljs';
import type { ExportFilterInput } from '@/lib/validations';
import type { Product, Warehouse, Category, Stock } from '@/lib/types';

interface ProductExportData extends Product {
  category_name: string | null;
  warehouse_stocks: Array<{
    warehouse_id: string;
    warehouse_name: string;
    quantity: number;
    reserved_quantity: number;
    available_quantity: number;
  }>;
  total_quantity: number;
  total_reserved: number;
  total_available: number;
}

export async function generateExcelExport(
  products: ProductExportData[],
  warehouses: Warehouse[],
  filters: ExportFilterInput
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'Warehouse Inventory System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // Define columns for summary
  summarySheet.columns = [
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Barcode', key: 'barcode', width: 15 },
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Variant', key: 'variant', width: 15 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Cost Price', key: 'cost_price', width: 12 },
    { header: 'Sale Price', key: 'sale_price', width: 12 },
    { header: 'Total Qty', key: 'total_quantity', width: 12 },
    { header: 'Reserved', key: 'reserved_quantity', width: 12 },
    { header: 'Available', key: 'available_quantity', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  // Style header row
  summarySheet.getRow(1).font = { bold: true, size: 11 };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0284C7' },
  };
  summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  // Add data to summary sheet
  products.forEach((product) => {
    const row = summarySheet.addRow({
      sku: product.sku,
      barcode: product.barcode || '',
      name: product.name,
      category: product.category_name || '',
      variant: product.variant || '',
      unit: product.unit,
      cost_price: product.cost_price,
      sale_price: product.sale_price,
      total_quantity: product.total_quantity,
      reserved_quantity: product.total_reserved,
      available_quantity: product.total_available,
      status: product.status,
    });

    // Format currency columns
    row.getCell('cost_price').numFmt = '$#,##0.00';
    row.getCell('sale_price').numFmt = '$#,##0.00';

    // Format number columns
    row.getCell('total_quantity').numFmt = '#,##0';
    row.getCell('reserved_quantity').numFmt = '#,##0';
    row.getCell('available_quantity').numFmt = '#,##0';

    // Color code status
    const statusCell = row.getCell('status');
    if (product.status === 'active') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDCFCE7' },
      };
    } else if (product.status === 'inactive') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEF3C7' },
      };
    } else if (product.status === 'discontinued') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFECACA' },
      };
    }
  });

  // Create warehouse-specific sheets
  warehouses.forEach((warehouse) => {
    const warehouseSheet = workbook.addWorksheet(warehouse.name.substring(0, 31), {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    warehouseSheet.columns = [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Barcode', key: 'barcode', width: 15 },
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Variant', key: 'variant', width: 15 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Cost Price', key: 'cost_price', width: 12 },
      { header: 'Sale Price', key: 'sale_price', width: 12 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Reserved', key: 'reserved', width: 12 },
      { header: 'Available', key: 'available', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    // Style header
    warehouseSheet.getRow(1).font = { bold: true, size: 11 };
    warehouseSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF059669' },
    };
    warehouseSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    warehouseSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add products for this warehouse
    products.forEach((product) => {
      const warehouseStock = product.warehouse_stocks.find(
        (ws) => ws.warehouse_id === warehouse.id
      );

      if (warehouseStock || !filters.warehouseId) {
        const quantity = warehouseStock?.quantity || 0;
        const reserved = warehouseStock?.reserved_quantity || 0;
        const available = warehouseStock?.available_quantity || 0;

        const row = warehouseSheet.addRow({
          sku: product.sku,
          barcode: product.barcode || '',
          name: product.name,
          category: product.category_name || '',
          variant: product.variant || '',
          unit: product.unit,
          cost_price: product.cost_price,
          sale_price: product.sale_price,
          quantity,
          reserved,
          available,
          status: product.status,
        });

        row.getCell('cost_price').numFmt = '$#,##0.00';
        row.getCell('sale_price').numFmt = '$#,##0.00';
        row.getCell('quantity').numFmt = '#,##0';
        row.getCell('reserved').numFmt = '#,##0';
        row.getCell('available').numFmt = '#,##0';

        // Highlight low stock
        if (available <= 0 && quantity > 0) {
          row.getCell('available').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFECACA' },
          };
        } else if (available > 0 && available <= 10) {
          row.getCell('available').fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF3C7' },
          };
        }
      }
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function getExportFilename(type: 'excel' | '1c_xml', filters: ExportFilterInput): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filterSuffix = filters.warehouseId ? '_filtered' : '';

  if (type === 'excel') {
    return `inventory_export_${timestamp}${filterSuffix}.xlsx`;
  } else {
    return `inventory_export_${timestamp}${filterSuffix}.zip`;
  }
}
