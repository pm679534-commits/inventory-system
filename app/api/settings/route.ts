import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  low_stock_threshold: z.number().int().min(1).max(1000).optional(),
  email_notifications: z.boolean().optional(),
  items_per_page: z.number().int().min(10).max(100).optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get existing settings
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Settings fetch error:', error);
      return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
    }

    // If no settings exist, return defaults
    if (!settings) {
      return NextResponse.json({
        low_stock_threshold: 10,
        email_notifications: true,
        items_per_page: 20,
        theme: 'light',
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Check if settings exist
    const { data: existingSettings } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingSettings) {
      // Update existing settings
      const { data: settings, error } = await supabase
        .from('user_settings')
        .update(validation.data)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Settings update error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
      }

      return NextResponse.json(settings);
    } else {
      // Insert new settings
      const { data: settings, error } = await supabase
        .from('user_settings')
        .insert([{ user_id: user.id, ...validation.data }])
        .select()
        .single();

      if (error) {
        console.error('Settings insert error:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
      }

      return NextResponse.json(settings);
    }
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
