import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const reportsQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  warehouseId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    const { searchParams } = new URL(request.url);
    const validation = reportsQuerySchema.safeParse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { startDate, endDate, warehouseId } = validation.data;

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get total stock levels
    let stockQuery = supabase
      .from('stock')
      .select('quantity, reserved_quantity, warehouse_id');

    if (warehouseId) {
      stockQuery = stockQuery.eq('warehouse_id', warehouseId);
    }

    const { data: stockData, error: stockError } = await stockQuery;

    if (stockError) {
      console.error('Error fetching stock:', stockError);
      return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
    }

    const totalStock = stockData?.reduce((sum, s) => sum + s.quantity, 0) || 0;
    const totalReserved = stockData?.reduce((sum, s) => sum + s.reserved_quantity, 0) || 0;
    const availableStock = totalStock - totalReserved;

    // Get orders for the period
    let ordersQuery = supabase
      .from('orders')
      .select('id, status, total_amount, warehouse_id')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (warehouseId) {
      ordersQuery = ordersQuery.eq('warehouse_id', warehouseId);
    }

    const { data: ordersData, error: ordersError } = await ordersQuery;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders data' }, { status: 500 });
    }

    const totalOrders = ordersData?.length || 0;
    const fulfilledOrders = ordersData?.filter(o => o.status === 'delivered').length || 0;
    const cancelledOrders = ordersData?.filter(o => o.status === 'cancelled').length || 0;
    const pendingOrders = ordersData?.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length || 0;

    const fulfillmentRate = totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0;
    const totalRevenue = ordersData
      ?.filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

    // Get order items for sold quantities
    let orderItemsQuery = supabase
      .from('order_items')
      .select('quantity, order:orders!inner(created_at, status, warehouse_id)');

    const { data: orderItemsData, error: orderItemsError } = await orderItemsQuery;

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 });
    }

    // Filter order items by date and warehouse
    const filteredOrderItems = orderItemsData?.filter((item: any) => {
      const orderDate = new Date(item.order.created_at);
      const inDateRange = orderDate >= start && orderDate <= end;
      const inWarehouse = !warehouseId || item.order.warehouse_id === warehouseId;
      const isDelivered = item.order.status === 'delivered';
      return inDateRange && inWarehouse && isDelivered;
    }) || [];

    const totalSold = filteredOrderItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

    // Get products count
    let productsQuery = supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    const { count: productsCount } = await productsQuery;

    // Get low stock products (available < 10)
    const lowStockCount = stockData?.filter(s => (s.quantity - s.reserved_quantity) < 10 && (s.quantity - s.reserved_quantity) > 0).length || 0;

    // Get out of stock products
    const outOfStockCount = stockData?.filter(s => (s.quantity - s.reserved_quantity) <= 0).length || 0;

    return NextResponse.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      stock: {
        totalStock,
        reservedStock: totalReserved,
        availableStock,
        lowStockCount,
        outOfStockCount,
        totalProducts: productsCount || 0,
      },
      orders: {
        totalOrders,
        fulfilledOrders,
        cancelledOrders,
        pendingOrders,
        fulfillmentRate: Math.round(fulfillmentRate * 100) / 100,
      },
      sales: {
        totalSold,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
      },
    });
  } catch (error) {
    console.error('Reports GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
