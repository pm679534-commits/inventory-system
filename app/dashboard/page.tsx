import { createClient } from '@/lib/supabase/server';
import { Package, Warehouse, ShoppingCart, TrendingUp } from 'lucide-react';

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

  // Fetch real stats
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  const { count: warehousesCount } = await supabase
    .from('warehouses')
    .select('*', { count: 'exact', head: true });

  const { count: activeOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'processing', 'shipped']);

  const { data: deliveredOrders } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'delivered');

  const totalRevenue = deliveredOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {profile?.full_name || user?.email?.split('@')[0]}
        </h1>
        <p className="text-gray-600">Here's what's happening with your inventory today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={productsCount?.toString() || '0'}
          icon={<Package className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Warehouses"
          value={warehousesCount?.toString() || '0'}
          icon={<Warehouse className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Active Orders"
          value={activeOrdersCount?.toString() || '0'}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="orange"
        />
        <StatCard
          title="Total Revenue"
          value={`$${totalRevenue.toFixed(0)}`}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Content Based on Data */}
      {(productsCount || 0) === 0 && (warehousesCount || 0) === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Your dashboard is ready
            </h3>
            <p className="text-gray-600 mb-6">
              Start by adding products and warehouses to manage your inventory.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickLink href="/admin/products" title="Manage Products" description="View and edit product catalog" />
            <QuickLink href="/admin/warehouses" title="Manage Warehouses" description="View warehouse stock levels" />
            <QuickLink href="/admin/orders" title="View Orders" description="Track and manage orders" />
            <QuickLink href="/admin/reports" title="View Reports" description="Analyze performance metrics" />
            <QuickLink href="/admin/analytics" title="AI Analytics" description="Get AI-powered insights" />
            <QuickLink href="/admin/exports" title="Export Data" description="Generate Excel or 1C exports" />
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <a
      href={href}
      className="p-4 rounded-lg border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all"
    >
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
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
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
