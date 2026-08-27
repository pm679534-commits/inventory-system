import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { exportFilterSchema } from '@/lib/validations';
import { generateProductsCSV, generateWarehousesCSV, generateOrdersCSV, getExportFilename } from '@/lib/services/csv-export';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateCheck = checkRateLimit(`export_csv_${ip}`, 10, 600000); // 10 requests per 10 minutes

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

    let csvContent = '';
    let recordCount = 0;

    if (exportType === 'products' || exportType === 'all') {
      // Build query for products
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
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          category_name: product.category?.name || null,
          variant: product.variant,
          unit: product.unit,
          cost_price: product.cost_price,
          sale_price: product.sale_price,
          total_quantity: totalQuantity,
          total_reserved: totalReserved,
          total_available: totalAvailable,
          status: product.status,
        };
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      recordCount += exportData.length;
      csvContent += generateProductsCSV(exportData);

      if (exportType === 'all') {
        csvContent += '\n\n';
      }
    }

    if (exportType === 'warehouses' || exportType === 'all') {
      // Fetch warehouses
      let warehouseQuery = supabase
        .from('warehouses')
        .select('*');

      if (filters.warehouseId) {
        warehouseQuery = warehouseQuery.eq('id', filters.warehouseId);
      }

      const { data: warehouses, error: warehousesError } = await warehouseQuery;

      if (warehousesError) {
        console.error('Error fetching warehouses:', warehousesError);
        return NextResponse.json(
          { error: 'Failed to fetch warehouses' },
          { status: 500 }
        );
      }

      recordCount += warehouses.length;
      csvContent += generateWarehousesCSV(warehouses);

      if (exportType === 'all') {
        csvContent += '\n\n';
      }
    }

    if (exportType === 'orders' || exportType === 'all') {
      // Fetch orders
      let orderQuery = supabase
        .from('orders')
        .select(`
          *,
          warehouse:warehouses(name)
        `)
        .order('created_at', { ascending: false });

      if (filters.warehouseId) {
        orderQuery = orderQuery.eq('warehouse_id', filters.warehouseId);
      }

      if (filters.orderStatus) {
        orderQuery = orderQuery.eq('status', filters.orderStatus);
      }

      if (filters.startDate) {
        orderQuery = orderQuery.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        orderQuery = orderQuery.lte('created_at', filters.endDate);
      }

      const { data: orders, error: ordersError } = await orderQuery;

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return NextResponse.json(
          { error: 'Failed to fetch orders' },
          { status: 500 }
        );
      }

      const exportOrders = orders.map((order: any) => ({
        order_number: order.order_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        warehouse_name: order.warehouse?.name || '',
        status: order.status,
        total_amount: order.total_amount,
        created_at: order.created_at,
      }));

      recordCount += exportOrders.length;
      csvContent += generateOrdersCSV(exportOrders);
    }

    // Log export to audit table
    await supabase.from('export_audit').insert({
      user_id: user.id,
      export_type: 'csv',
      filters,
      record_count: recordCount,
      file_size_bytes: Buffer.byteLength(csvContent, 'utf8'),
    });

    const filename = getExportFilename('csv', exportType, filters);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(csvContent, 'utf8').toString(),
        ...getRateLimitHeaders(10, rateCheck.remaining, rateCheck.resetAt),
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Export failed. Please try again.' },
      { status: 500 }
    );
  }
}
