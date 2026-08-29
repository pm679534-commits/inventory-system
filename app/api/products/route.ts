import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createProductSchema = z.object({
  sku: z.string().min(1).max(50),
  barcode: z.string().max(50).optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  short_description: z.string().max(500).optional(),
  category_id: z.string().uuid().optional(),
  variant: z.string().max(100).optional(),
  unit: z.string().min(1).max(20),
  cost_price: z.number().min(0),
  sale_price: z.number().min(0),
  status: z.enum(['active', 'inactive', 'discontinued']),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const categoryId = searchParams.get('categoryId');
    const warehouseId = searchParams.get('warehouseId');
    const status = searchParams.get('status');
    const stockFilter = searchParams.get('stockFilter');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

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
      `, { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: products, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    // Apply stock and warehouse filters if needed
    let filteredProducts = products || [];
    if (stockFilter || warehouseId) {
      filteredProducts = filteredProducts.filter((product: any) => {
        // Filter by warehouse if specified
        const relevantStock = warehouseId
          ? product.stock?.filter((s: any) => s.warehouse_id === warehouseId) || []
          : product.stock || [];

        const totalStock = relevantStock.reduce((sum: number, s: any) => sum + (s.quantity - s.reserved_quantity), 0);

        if (stockFilter === 'in_stock') return totalStock > 0;
        if (stockFilter === 'low_stock') return totalStock > 0 && totalStock < 10;
        if (stockFilter === 'out_of_stock') return totalStock <= 0;
        return true;
      });
    }

    return NextResponse.json({
      products: filteredProducts,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Products GET error:', error);
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
      .select('role, current_plan')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'Admin' && profile.role !== 'Manager')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check plan-based product limit
    const { hasReachedLimit, getUpgradeMessage } = await import('@/lib/plan-limits');
    const currentPlan = profile.current_plan || 'starter';

    // Count existing products
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (hasReachedLimit('maxProducts', productCount || 0, currentPlan)) {
      return NextResponse.json(
        { error: getUpgradeMessage('maxProducts', currentPlan) },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createProductSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert([validation.data])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'SKU already exists' }, { status: 409 });
      }
      console.error('Error creating product:', error);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
