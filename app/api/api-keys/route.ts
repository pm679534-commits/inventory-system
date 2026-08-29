import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { canAccessAPIAccess } from '@/lib/plan-limits';
import { generateApiKey, hashApiKey } from '@/lib/api-keys';

export const dynamic = 'force-dynamic';

// GET: List all API keys for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'İcazəsiz' }, { status: 401 });
    }

    // Check plan access
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_plan')
      .eq('id', user.id)
      .single();

    if (!profile || !canAccessAPIAccess(profile.current_plan || 'starter')) {
      return NextResponse.json(
        { error: 'API girişi yalnız Korporativ planda mövcuddur. Planınızı yüksəldin.' },
        { status: 403 }
      );
    }

    // Fetch API keys (excluding sensitive hash)
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, last_used_at, expires_at, is_active, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching API keys:', error);
      return NextResponse.json({ error: 'API açarları yüklənə bilmədi' }, { status: 500 });
    }

    return NextResponse.json({ keys: keys || [] });
  } catch (error) {
    console.error('API keys GET error:', error);
    return NextResponse.json({ error: 'Xəta baş verdi' }, { status: 500 });
  }
}

// POST: Create a new API key
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'İcazəsiz' }, { status: 401 });
    }

    // Check plan access
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_plan')
      .eq('id', user.id)
      .single();

    if (!profile || !canAccessAPIAccess(profile.current_plan || 'starter')) {
      return NextResponse.json(
        { error: 'API girişi yalnız Korporativ planda mövcuddur. Planınızı yüksəldin.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, expiresInDays } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'API açarı adı tələb olunur' }, { status: 400 });
    }

    // Check if key with same name already exists
    const { data: existing } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', name.trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Bu adda API açarı artıq mövcuddur' }, { status: 400 });
    }

    // Generate new API key
    const { key, hash, prefix } = generateApiKey();

    // Calculate expiration date if provided
    let expiresAt = null;
    if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
      const expiration = new Date();
      expiration.setDate(expiration.getDate() + expiresInDays);
      expiresAt = expiration.toISOString();
    }

    // Store hashed key in database
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        name: name.trim(),
        key_hash: hash,
        key_prefix: prefix,
        expires_at: expiresAt,
      })
      .select('id, name, key_prefix, expires_at, is_active, created_at')
      .single();

    if (error) {
      console.error('Error creating API key:', error);
      return NextResponse.json({ error: 'API açarı yaradıla bilmədi' }, { status: 500 });
    }

    // Return the plaintext key ONCE - user must save it
    return NextResponse.json({
      message: 'API açarı uğurla yaradıldı',
      apiKey: { ...apiKey, key }, // Include plaintext key only in creation response
    });
  } catch (error) {
    console.error('API keys POST error:', error);
    return NextResponse.json({ error: 'Xəta baş verdi' }, { status: 500 });
  }
}

// DELETE: Revoke an API key
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'İcazəsiz' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: 'API açarı ID-si tələb olunur' }, { status: 400 });
    }

    // Delete the key (RLS ensures user can only delete their own keys)
    const { error } = await supabase.from('api_keys').delete().eq('id', keyId).eq('user_id', user.id);

    if (error) {
      console.error('Error deleting API key:', error);
      return NextResponse.json({ error: 'API açarı silinə bilmədi' }, { status: 500 });
    }

    return NextResponse.json({ message: 'API açarı uğurla silindi' });
  } catch (error) {
    console.error('API keys DELETE error:', error);
    return NextResponse.json({ error: 'Xəta baş verdi' }, { status: 500 });
  }
}
