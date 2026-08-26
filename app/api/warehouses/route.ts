import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createWarehouseSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  is_active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: warehouses, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching warehouses:', error);
      return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 });
    }

    return NextResponse.json(warehouses);
  } catch (error) {
    console.error('Warehouses GET error:', error);
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
    const validation = createWarehouseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { data: warehouse, error } = await supabase
      .from('warehouses')
      .insert([validation.data])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Warehouse code already exists' }, { status: 409 });
      }
      console.error('Error creating warehouse:', error);
      return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 });
    }

    return NextResponse.json(warehouse, { status: 201 });
  } catch (error) {
    console.error('Warehouses POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
