import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createOrderSchema = z.object({
  warehouse_id: z.string().uuid(),
  customer_name: z.string().min(1).max(200),
  customer_email: z.string().email().max(200),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1),
    unit_price: z.number().min(0),
  })).min(1),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const warehouseId = searchParams.get('warehouseId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('orders')
      .select(`
        *,
        warehouse:warehouses(id, name),
        order_items:order_items(
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          product:products(id, sku, name, unit)
        )
      `, { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (warehouseId) {
      query = query.eq('warehouse_id', warehouseId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: orders, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({
      orders: orders || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { warehouse_id, customer_name, customer_email, notes, items } = validation.data;

    // Use RPC function for atomic order creation with stock reservation
    const { data, error } = await supabase.rpc('create_order_with_reservation', {
      p_warehouse_id: warehouse_id,
      p_customer_name: customer_name,
      p_customer_email: customer_email,
      p_notes: notes || null,
      p_items: items,
    });

    if (error) {
      console.error('Order creation error:', error);

      if (error.message?.includes('Insufficient stock')) {
        return NextResponse.json(
          { error: 'Insufficient stock for one or more items' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
