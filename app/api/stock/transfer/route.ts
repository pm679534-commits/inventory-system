import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const stockTransferSchema = z.object({
  product_id: z.string().uuid(),
  from_warehouse_id: z.string().uuid(),
  to_warehouse_id: z.string().uuid(),
  quantity: z.number().int().min(1),
});

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
    const validation = stockTransferSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { product_id, from_warehouse_id, to_warehouse_id, quantity } = validation.data;

    if (from_warehouse_id === to_warehouse_id) {
      return NextResponse.json(
        { error: 'Source and destination warehouses must be different' },
        { status: 400 }
      );
    }

    // Use RPC function for atomic transfer with row locking
    const { data, error } = await supabase.rpc('transfer_stock', {
      p_product_id: product_id,
      p_from_warehouse_id: from_warehouse_id,
      p_to_warehouse_id: to_warehouse_id,
      p_quantity: quantity,
    });

    if (error) {
      console.error('Stock transfer error:', error);

      if (error.message?.includes('Insufficient stock')) {
        return NextResponse.json(
          { error: 'Insufficient stock available for transfer' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to transfer stock' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Stock transfer POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
