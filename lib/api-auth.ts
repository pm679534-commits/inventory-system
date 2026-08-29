import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashApiKey, isValidApiKeyFormat } from '@/lib/api-keys';
import { canAccessAPIAccess } from '@/lib/plan-limits';

export interface AuthenticatedApiContext {
  userId: string;
  apiKeyId: string;
  currentPlan: string;
}

/**
 * Authenticate API requests using API key
 * Returns user context if valid, or error response
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<{ success: true; context: AuthenticatedApiContext } | { success: false; response: NextResponse }> {
  // Extract API key from Authorization header
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authorization başlığı tələb olunur. Format: Bearer wis_live_...' },
        { status: 401 }
      ),
    };
  }

  const apiKey = authHeader.substring(7); // Remove "Bearer "

  // Validate format
  if (!isValidApiKeyFormat(apiKey)) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Yanlış API açarı formatı' }, { status: 401 }),
    };
  }

  // Hash the key to look it up
  const keyHash = hashApiKey(apiKey);

  // Query database for the key
  const supabase = await createClient();
  const { data: apiKeyRecord, error } = await supabase
    .from('api_keys')
    .select('id, user_id, is_active, expires_at')
    .eq('key_hash', keyHash)
    .single();

  if (error || !apiKeyRecord) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Yanlış API açarı' }, { status: 401 }),
    };
  }

  // Check if key is active
  if (!apiKeyRecord.is_active) {
    return {
      success: false,
      response: NextResponse.json({ error: 'API açarı deaktiv edilib' }, { status: 401 }),
    };
  }

  // Check if key is expired
  if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
    return {
      success: false,
      response: NextResponse.json({ error: 'API açarının müddəti bitib' }, { status: 401 }),
    };
  }

  // Get user's plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_plan')
    .eq('id', apiKeyRecord.user_id)
    .single();

  if (!profile) {
    return {
      success: false,
      response: NextResponse.json({ error: 'İstifadəçi tapılmadı' }, { status: 404 }),
    };
  }

  // Verify user has API access (Enterprise plan only)
  if (!canAccessAPIAccess(profile.current_plan || 'starter')) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'API girişi yalnız Korporativ planda mövcuddur' },
        { status: 403 }
      ),
    };
  }

  // Update last_used_at timestamp (fire and forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyRecord.id)
    .then(() => {});

  // Log API usage (fire and forget)
  const endpoint = new URL(request.url).pathname;
  const method = request.method;
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  supabase
    .from('api_key_logs')
    .insert({
      api_key_id: apiKeyRecord.id,
      endpoint,
      method,
      status_code: 200, // Will be updated if request fails
      ip_address: ip,
      user_agent: userAgent,
    })
    .then(() => {});

  return {
    success: true,
    context: {
      userId: apiKeyRecord.user_id,
      apiKeyId: apiKeyRecord.id,
      currentPlan: profile.current_plan || 'starter',
    },
  };
}
