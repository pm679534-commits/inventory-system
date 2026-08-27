import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { aiGenerateDescriptionSchema } from '@/lib/validations';
import { generateProductDescription, validateAPIKey } from '@/lib/services/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!validateAPIKey()) {
      return NextResponse.json(
        { error: 'AI xidməti konfiqurasiya olunmayıb' },
        { status: 503 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateCheck = checkRateLimit(`ai_description_${ip}`, 50, 600000); // 50 requests per 10 minutes

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Çox sayda AI sorğusu. Zəhmət olmasa bir az sonra yenidən cəhd edin.' },
        {
          status: 429,
          headers: getRateLimitHeaders(50, rateCheck.remaining, rateCheck.resetAt),
        }
      );
    }

    // Authentication and authorization
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'İcazəsiz giriş' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'Admin' && profile.role !== 'Manager')) {
      return NextResponse.json({ error: 'Bu funksiya yalnız administratorlar və menecerlər üçün əlçatandır' }, { status: 403 });
    }

    // Parse and validate request
    const body = await request.json();
    const validation = aiGenerateDescriptionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Yanlış sorğu', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { productName, shortDescription, category } = validation.data;

    // Call Gemini AI
    const description = await generateProductDescription({
      productName,
      shortDescription,
      category,
    });

    return NextResponse.json(description, {
      headers: getRateLimitHeaders(50, rateCheck.remaining, rateCheck.resetAt),
    });
  } catch (error) {
    console.error('AI description generation error:', error);
    return NextResponse.json(
      { error: 'Təsvir yaratma uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.' },
      { status: 500 }
    );
  }
}
