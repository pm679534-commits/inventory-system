import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Fetch stock movements for this warehouse
    const { data: movements, error } = await supabase
      .from('stock_movements')
      .select(`
        id,
        product_id,
        from_warehouse_id,
        to_warehouse_id,
        quantity,
        movement_type,
        notes,
        created_at,
        product:products(id, name, sku),
        from_warehouse:warehouses!from_warehouse_id(id, name),
        to_warehouse:warehouses!to_warehouse_id(id, name)
      `)
      .or(`from_warehouse_id.eq.${id},to_warehouse_id.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching movements:', error);
      return NextResponse.json({ error: 'Failed to fetch movements' }, { status: 500 });
    }

    return NextResponse.json(movements || []);
  } catch (error) {
    console.error('Movements GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
