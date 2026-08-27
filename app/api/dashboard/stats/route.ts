import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCached } from '@/lib/cache';

export const dynamic = 'force-dynamic';

interface DashboardStats {
  productsCount: number;
  warehousesCount: number;
  activeOrdersCount: number;
  totalRevenue: number;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cache stats for 60 seconds per user
    const cacheKey = `dashboard_stats_${user.id}`;

    const stats = await getCached<DashboardStats>(
      cacheKey,
      async () => {
        // Fetch all stats in parallel for better performance
        const [productsResult, warehousesResult, activeOrdersResult, deliveredOrdersResult] =
          await Promise.all([
            supabase.from('products').select('*', { count: 'exact', head: true }),
            supabase.from('warehouses').select('*', { count: 'exact', head: true }),
            supabase
              .from('orders')
              .select('*', { count: 'exact', head: true })
              .in('status', ['pending', 'processing', 'shipped']),
            supabase.from('orders').select('total_amount').eq('status', 'delivered'),
          ]);

        const totalRevenue =
          deliveredOrdersResult.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        return {
          productsCount: productsResult.count || 0,
          warehousesCount: warehousesResult.count || 0,
          activeOrdersCount: activeOrdersResult.count || 0,
          totalRevenue,
        };
      },
      60000 // Cache for 60 seconds
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
