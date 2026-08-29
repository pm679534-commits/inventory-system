import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { aiPredictReorderSchema } from '@/lib/validations';
import { predictReorder, validateAPIKey } from '@/lib/services/gemini';

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
    const rateCheck = checkRateLimit(`ai_reorder_${ip}`, 30, 600000); // 30 requests per 10 minutes

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Çox sayda AI sorğusu. Zəhmət olmasa bir az sonra yenidən cəhd edin.' },
        {
          status: 429,
          headers: getRateLimitHeaders(30, rateCheck.remaining, rateCheck.resetAt),
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

    // All authenticated users can access AI analytics
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, current_plan')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profil tapılmadı' }, { status: 404 });
    }

    // Check plan-based AI analytics access
    const { canAccessAIAnalytics } = await import('@/lib/plan-limits');
    if (!canAccessAIAnalytics(profile.current_plan || 'starter')) {
      return NextResponse.json(
        { error: 'AI analitika funksiyası sizin planınızda mövcud deyil. Professional və ya Enterprise plana yüksəldin.' },
        { status: 403 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    console.log('[REORDER DEBUG] Raw body received:', JSON.stringify(body));

    const validation = aiPredictReorderSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      let errorMessage = 'Yanlış sorğu';

      if (firstError.path.includes('productId')) {
        errorMessage = 'Məhsul seçilməlidir';
      } else if (firstError.path.includes('warehouseId')) {
        errorMessage = 'Anbar seçimi yanlışdır';
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    const { productId, warehouseId } = validation.data;

    // Fetch product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Məhsul tapılmadı' },
        { status: 404 }
      );
    }

    // Fetch stock
    let stockQuery = supabase
      .from('stock')
      .select('*, warehouse:warehouses(name)')
      .eq('product_id', productId);

    if (warehouseId) {
      stockQuery = stockQuery.eq('warehouse_id', warehouseId);
    }

    const { data: stockData, error: stockError } = await stockQuery;

    if (stockError) {
      console.error('Error fetching stock:', stockError);
      return NextResponse.json(
        { error: 'Stok məlumatlarının əldə edilməsi uğursuz oldu' },
        { status: 500 }
      );
    }

    // Calculate total stock
    const totalStock = stockData?.reduce((sum, s) => sum + s.quantity, 0) || 0;
    const totalReserved = stockData?.reduce((sum, s) => sum + s.reserved_quantity, 0) || 0;

    // Fetch recent sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('quantity, created_at')
      .eq('product_id', productId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError);
      return NextResponse.json(
        { error: 'Satış məlumatlarının əldə edilməsi uğursuz oldu' },
        { status: 500 }
      );
    }

    // Group sales by day
    const salesByDay = new Map<string, number>();
    orderItems?.forEach((item: any) => {
      const day = item.created_at.split('T')[0];
      salesByDay.set(day, (salesByDay.get(day) || 0) + item.quantity);
    });

    const recentSales = Array.from(salesByDay.values());

    // Get warehouse name if specified
    const warehouseName = warehouseId
      ? stockData?.find((s) => s.warehouse_id === warehouseId)?.warehouse?.name
      : undefined;

    // Call Gemini AI
    const prediction = await predictReorder({
      productName: product.name,
      productId: product.id,
      currentStock: totalStock,
      reservedStock: totalReserved,
      recentSales,
      warehouseName,
    });

    return NextResponse.json(prediction, {
      headers: getRateLimitHeaders(30, rateCheck.remaining, rateCheck.resetAt),
    });
  } catch (error) {
    console.error('AI reorder prediction error:', error);
    return NextResponse.json(
      { error: 'Proqnoz uğursuz oldu. Zəhmət olmasa yenidən cəhd edin.' },
      { status: 500 }
    );
  }
}
