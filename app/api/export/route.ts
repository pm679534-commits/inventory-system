import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Define allowed fields per entity (security: explicit allow-list, never expose sensitive data)
const ALLOWED_PRODUCT_FIELDS = [
  'sku',
  'barcode',
  'name',
  'category_id',
  'variant',
  'unit',
  'cost_price',
  'sale_price',
  'status',
  'created_at',
];

const ALLOWED_WAREHOUSE_FIELDS = [
  'id',
  'name',
  'code',
  'address',
  'city',
  'country',
  'is_active',
];

const ALLOWED_ORDER_FIELDS = [
  'order_number',
  'customer_name',
  'customer_email',
  'status',
  'total_amount',
  'created_at',
];

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateProductsCSV(products: any[]): string {
  const headers = ['SKU', 'Barcode', 'Ad', 'Variant', 'Vahid', 'Maya dəyəri', 'Satış qiyməti', 'Status', 'Yaradılma tarixi'];
  let csv = headers.map(escapeCSV).join(',') + '\n';

  products.forEach((product) => {
    const row = [
      product.sku,
      product.barcode || '',
      product.name,
      product.variant || '',
      product.unit,
      product.cost_price?.toFixed(2) || '0.00',
      product.sale_price?.toFixed(2) || '0.00',
      product.status,
      product.created_at,
    ];
    csv += row.map(escapeCSV).join(',') + '\n';
  });

  return csv;
}

function generateWarehousesCSV(warehouses: any[]): string {
  const headers = ['ID', 'Ad', 'Kod', 'Ünvan', 'Şəhər', 'Ölkə', 'Aktiv'];
  let csv = headers.map(escapeCSV).join(',') + '\n';

  warehouses.forEach((wh) => {
    const row = [
      wh.id,
      wh.name,
      wh.code,
      wh.address || '',
      wh.city || '',
      wh.country || '',
      wh.is_active ? 'Bəli' : 'Xeyr',
    ];
    csv += row.map(escapeCSV).join(',') + '\n';
  });

  return csv;
}

function generateOrdersCSV(orders: any[]): string {
  const headers = ['Sifariş nömrəsi', 'Müştəri', 'Email', 'Status', 'Məbləğ', 'Tarix'];
  let csv = headers.map(escapeCSV).join(',') + '\n';

  orders.forEach((order) => {
    const row = [
      order.order_number,
      order.customer_name || '',
      order.customer_email || '',
      order.status,
      order.total_amount?.toFixed(2) || '0.00',
      order.created_at,
    ];
    csv += row.map(escapeCSV).join(',') + '\n';
  });

  return csv;
}

async function generateProductsExcel(products: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Məhsullar');

  worksheet.columns = [
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Barkod', key: 'barcode', width: 15 },
    { header: 'Ad', key: 'name', width: 30 },
    { header: 'Variant', key: 'variant', width: 15 },
    { header: 'Vahid', key: 'unit', width: 10 },
    { header: 'Maya dəyəri', key: 'cost_price', width: 12 },
    { header: 'Satış qiyməti', key: 'sale_price', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  // Style header
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0284C7' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  products.forEach((product) => {
    const row = worksheet.addRow({
      sku: product.sku,
      barcode: product.barcode || '',
      name: product.name,
      variant: product.variant || '',
      unit: product.unit,
      cost_price: product.cost_price,
      sale_price: product.sale_price,
      status: product.status,
    });

    row.getCell('cost_price').numFmt = '$#,##0.00';
    row.getCell('sale_price').numFmt = '$#,##0.00';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function generateWarehousesExcel(warehouses: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Anbarlar');

  worksheet.columns = [
    { header: 'Ad', key: 'name', width: 25 },
    { header: 'Kod', key: 'code', width: 15 },
    { header: 'Ünvan', key: 'address', width: 30 },
    { header: 'Şəhər', key: 'city', width: 15 },
    { header: 'Ölkə', key: 'country', width: 15 },
    { header: 'Aktiv', key: 'is_active', width: 10 },
  ];

  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  warehouses.forEach((wh) => {
    worksheet.addRow({
      name: wh.name,
      code: wh.code,
      address: wh.address || '',
      city: wh.city || '',
      country: wh.country || '',
      is_active: wh.is_active ? 'Bəli' : 'Xeyr',
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

async function generateOrdersExcel(orders: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sifarişlər');

  worksheet.columns = [
    { header: 'Sifariş nömrəsi', key: 'order_number', width: 20 },
    { header: 'Müştəri', key: 'customer_name', width: 25 },
    { header: 'Email', key: 'customer_email', width: 25 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Məbləğ', key: 'total_amount', width: 15 },
    { header: 'Tarix', key: 'created_at', width: 20 },
  ];

  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF7C3AED' },
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

  orders.forEach((order) => {
    const row = worksheet.addRow({
      order_number: order.order_number,
      customer_name: order.customer_name || '',
      customer_email: order.customer_email || '',
      status: order.status,
      total_amount: order.total_amount,
      created_at: new Date(order.created_at).toLocaleString('az-AZ'),
    });

    row.getCell('total_amount').numFmt = '$#,##0.00';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateCheck = checkRateLimit(`export_${ip}`, 10, 600000); // 10 requests per 10 minutes

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Çox sayda ixrac sorğusu. Xahiş edirik bir qədər sonra yenidən cəhd edin.' },
        {
          status: 429,
          headers: getRateLimitHeaders(10, rateCheck.remaining, rateCheck.resetAt),
        }
      );
    }

    // Authentication and authorization
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'İcazəsiz. Xahiş edirik daxil olun.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Allow Admin and Manager roles to export - Staff cannot export
    if (!profile || (profile.role !== 'Admin' && profile.role !== 'Manager')) {
      return NextResponse.json(
        { error: 'Bu funksiya yalnız administratorlar və menecerlər üçün əlçatandır.' },
        { status: 403 }
      );
    }

    // Parse request
    const body = await request.json();
    const { entityType, format } = body;

    if (!['products', 'warehouses', 'orders'].includes(entityType)) {
      return NextResponse.json({ error: 'Yanlış ixrac növü' }, { status: 400 });
    }

    if (!['excel', 'csv'].includes(format)) {
      return NextResponse.json({ error: 'Yanlış format' }, { status: 400 });
    }

    let data: any[] = [];
    let contentType = '';
    let fileExtension = '';
    let fileContent: Buffer | string = '';

    // Fetch data based on entity type with explicit field selection (security)
    if (entityType === 'products') {
      const { data: products, error } = await supabase
        .from('products')
        .select(ALLOWED_PRODUCT_FIELDS.join(','))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Məhsullar yüklənə bilmədi' }, { status: 500 });
      }

      data = products || [];

      if (format === 'csv') {
        fileContent = generateProductsCSV(data);
        contentType = 'text/csv; charset=utf-8';
        fileExtension = 'csv';
      } else {
        fileContent = await generateProductsExcel(data);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
      }
    } else if (entityType === 'warehouses') {
      const { data: warehouses, error } = await supabase
        .from('warehouses')
        .select(ALLOWED_WAREHOUSE_FIELDS.join(','))
        .order('name');

      if (error) {
        console.error('Error fetching warehouses:', error);
        return NextResponse.json({ error: 'Anbarlar yüklənə bilmədi' }, { status: 500 });
      }

      data = warehouses || [];

      if (format === 'csv') {
        fileContent = generateWarehousesCSV(data);
        contentType = 'text/csv; charset=utf-8';
        fileExtension = 'csv';
      } else {
        fileContent = await generateWarehousesExcel(data);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
      }
    } else if (entityType === 'orders') {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(ALLOWED_ORDER_FIELDS.join(','))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Sifarişlər yüklənə bilmədi' }, { status: 500 });
      }

      data = orders || [];

      if (format === 'csv') {
        fileContent = generateOrdersCSV(data);
        contentType = 'text/csv; charset=utf-8';
        fileExtension = 'csv';
      } else {
        fileContent = await generateOrdersExcel(data);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
      }
    } else {
      // This should never happen due to validation above, but TypeScript requires it
      return NextResponse.json({ error: 'Yanlış ixrac növü' }, { status: 400 });
    }

    // Audit logging
    await supabase.from('export_audit').insert({
      user_id: user.id,
      export_type: format,
      filters: { entityType },
      record_count: data.length,
      file_size_bytes: Buffer.isBuffer(fileContent) ? fileContent.length : Buffer.byteLength(fileContent, 'utf8'),
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `${entityType}_export_${timestamp}.${fileExtension}`;

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const responseBody = Buffer.isBuffer(fileContent) ? new Uint8Array(fileContent) : fileContent;

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.isBuffer(fileContent)
          ? fileContent.length.toString()
          : Buffer.byteLength(fileContent, 'utf8').toString(),
        ...getRateLimitHeaders(10, rateCheck.remaining, rateCheck.resetAt),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'İxrac uğursuz oldu. Xahiş edirik yenidən cəhd edin.' },
      { status: 500 }
    );
  }
}
