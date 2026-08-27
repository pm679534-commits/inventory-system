import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { exportFilterSchema } from '@/lib/validations';
import { generateExcelExport, getExportFilename } from '@/lib/services/excel-export';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateCheck = checkRateLimit(`export_excel_${ip}`, 10, 600000); // 10 requests per 10 minutes

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many export requests. Please try again later.' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'Admin' && profile.role !== 'Manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse and validate filters
    const body = await request.json();
    const validation = exportFilterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid filters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const filters = validation.data;
    const exportType = filters.exportType || 'products';

    // Build query
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name),
        stock:stock(
          id,
          warehouse_id,
          quantity,
          reserved_quantity,
          warehouse:warehouses(id, name)
        )
      `);

    // Apply filters
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Fetch all warehouses
    const { data: warehouses, error: warehousesError } = await supabase
      .from('warehouses')
      .select('*')
      .eq('is_active', true);

    if (warehousesError) {
      console.error('Error fetching warehouses:', warehousesError);
      return NextResponse.json(
        { error: 'Failed to fetch warehouses' },
        { status: 500 }
      );
    }

    // Transform data for export
    const exportData = products.map((product: any) => {
      const stocks = product.stock || [];

      // Filter by warehouse if specified
      const filteredStocks = filters.warehouseId
        ? stocks.filter((s: any) => s.warehouse_id === filters.warehouseId)
        : stocks;

      // Calculate totals
      const totalQuantity = filteredStocks.reduce(
        (sum: number, s: any) => sum + (s.quantity || 0),
        0
      );
      const totalReserved = filteredStocks.reduce(
        (sum: number, s: any) => sum + (s.reserved_quantity || 0),
        0
      );
      const totalAvailable = totalQuantity - totalReserved;

      // Apply stock filter
      if (filters.stockFilter === 'in_stock' && totalAvailable <= 0) {
        return null;
      }
      if (filters.stockFilter === 'out_of_stock' && totalAvailable > 0) {
        return null;
      }

      return {
        ...product,
        category_name: product.category?.name || null,
        warehouse_stocks: filteredStocks.map((s: any) => ({
          warehouse_id: s.warehouse_id,
          warehouse_name: s.warehouse?.name || 'Unknown',
          quantity: s.quantity || 0,
          reserved_quantity: s.reserved_quantity || 0,
          available_quantity: (s.quantity || 0) - (s.reserved_quantity || 0),
        })),
        total_quantity: totalQuantity,
        total_reserved: totalReserved,
        total_available: totalAvailable,
      };
    }).filter(Boolean);

    // Filter warehouses if specified
    const exportWarehouses = filters.warehouseId
      ? warehouses.filter((w) => w.id === filters.warehouseId)
      : warehouses;

    // Generate Excel
    const buffer = await generateExcelExport(exportData, exportWarehouses, filters);

    // Log export to audit table
    await supabase.from('export_audit').insert({
      user_id: user.id,
      export_type: 'excel',
      filters,
      record_count: exportData.length,
      file_size_bytes: buffer.length,
    });

    const filename = getExportFilename('excel', exportType, filters);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        ...getRateLimitHeaders(10, rateCheck.remaining, rateCheck.resetAt),
      },
    });
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json(
      { error: 'Export failed. Please try again.' },
      { status: 500 }
    );
  }
}
