import { createClient } from '@/lib/supabase/server';
import { Package, Warehouse, ShoppingCart, TrendingUp } from 'lucide-react';
import { t } from '@/lib/i18n';
import Link from 'next/link';

// Disable caching to ensure fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single();

  // Parallelize all independent queries
  const [
    { count: productsCount },
    { count: warehousesCount },
    { count: activeOrdersCount },
    { data: revenueData },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('warehouses').select('*', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'processing', 'shipped']),
    supabase.rpc('get_total_revenue'),
  ]);

  const totalRevenue = revenueData || 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t.dashboard.welcome}, {profile?.full_name || user?.email?.split('@')[0]}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t.dashboard.todayActivity}</p>
      </div>

      {/* Stats Grid - Responsive with mobile-first design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard
          title={t.stats.totalProducts}
          value={productsCount?.toString() || '0'}
          icon={<Package className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title={t.stats.warehouses}
          value={warehousesCount?.toString() || '0'}
          icon={<Warehouse className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title={t.stats.activeOrders}
          value={activeOrdersCount?.toString() || '0'}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          title={t.stats.totalRevenue}
          value={`$${totalRevenue.toFixed(0)}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Content Based on Data */}
      {(productsCount || 0) === 0 && (warehousesCount || 0) === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              İdarə paneliniz hazırdır
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              İnventarınızı idarə etmək üçün məhsullar və anbarlar əlavə etməklə başlayın.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{t.dashboard.quickLinks}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickLink href="/dashboard/products" title="Məhsulları İdarə Et" description="Məhsul kataloquna baxın və redaktə edin" />
            <QuickLink href="/dashboard/warehouses" title="Anbarları İdarə Et" description="Anbar stok səviyyələrini görün" />
            <QuickLink href="/dashboard/orders" title="Sifarişlərə Baxın" description="Sifarişləri izləyin və idarə edin" />
            <QuickLink href="/dashboard/reports" title="Hesabatlara Baxın" description="Performans göstəricilərini təhlil edin" />
            <QuickLink href="/dashboard/analytics" title="AI Analitika" description="AI gücündə təhlillər əldə edin" />
            <QuickLink href="/dashboard/export" title="Məlumatları İxrac Et" description="Excel və CSV ixracları yaradın" />
            <QuickLink href="/dashboard/pricing" title="Planlar və Qiymətlər" description="Abunə planlarına baxın" />
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-md transition-all"
    >
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </Link>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}
