import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { aiAnalyzeTrendsSchema } from '@/lib/validations';
import { analyzeSalesTrends, validateAPIKey } from '@/lib/services/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!validateAPIKey()) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateCheck = checkRateLimit(`ai_trends_${ip}`, 20, 600000); // 20 requests per 10 minutes

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many AI requests. Please try again later.' },
        {
          status: 429,
          headers: getRateLimitHeaders(20, rateCheck.remaining, rateCheck.resetAt),
        }
      );
    }

    // Authentication and authorization
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // All authenticated users can access AI analytics
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Parse and validate request
    const body = await request.json();
    const validation = aiAnalyzeTrendsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { period, limit } = validation.data;

    // Calculate date range
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch order items with aggregated sales
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select(`
        product_id,
        quantity,
        product:products(id, name, sku, created_at)
      `)
      .gte('created_at', startDate.toISOString());

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      return NextResponse.json(
        { error: 'Failed to fetch sales data' },
        { status: 500 }
      );
    }

    // Aggregate sales by product
    const salesByProduct = new Map<string, { id: string; name: string; sku: string; sales: number; createdAt: string }>();

    orderItems.forEach((item: any) => {
      if (item.product) {
        const existing = salesByProduct.get(item.product_id);
        if (existing) {
          existing.sales += item.quantity;
        } else {
          salesByProduct.set(item.product_id, {
            id: item.product.id,
            name: item.product.name,
            sku: item.product.sku,
            sales: item.quantity,
            createdAt: item.product.created_at,
          });
        }
      }
    });

    // Sort by sales
    const sortedProducts = Array.from(salesByProduct.values()).sort(
      (a, b) => b.sales - a.sales
    );

    const topProducts = sortedProducts.slice(0, limit);
    const slowProducts = sortedProducts
      .filter((p) => p.sales > 0)
      .slice(-limit)
      .map((p) => {
        const daysInStock = Math.floor(
          (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return { ...p, daysInStock };
      });

    // Call Gemini AI
    const analysis = await analyzeSalesTrends({
      topProducts,
      slowProducts,
      period,
    });

    return NextResponse.json(analysis, {
      headers: getRateLimitHeaders(20, rateCheck.remaining, rateCheck.resetAt),
    });
  } catch (error) {
    console.error('AI trends analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
