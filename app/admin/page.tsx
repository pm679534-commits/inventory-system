import { createClient } from '@/lib/supabase/server';
import { Users, Shield, UserCog } from 'lucide-react';

export default async function AdminPage() {
  const supabase = await createClient();

  // Get user counts by role
  const { data: profiles } = await supabase
    .from('profiles')
    .select('role');

  const adminCount = profiles?.filter((p) => p.role === 'Admin').length || 0;
  const managerCount = profiles?.filter((p) => p.role === 'Manager').length || 0;
  const staffCount = profiles?.filter((p) => p.role === 'Staff').length || 0;
  const totalUsers = profiles?.length || 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage users, products, and system settings</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value={totalUsers.toString()} icon={<Users className="w-6 h-6" />} color="blue" />
        <StatCard title="Administrators" value={adminCount.toString()} icon={<Shield className="w-6 h-6" />} color="purple" />
        <StatCard title="Managers" value={managerCount.toString()} icon={<UserCog className="w-6 h-6" />} color="green" />
        <StatCard title="Staff Members" value={staffCount.toString()} icon={<Users className="w-6 h-6" />} color="orange" />
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard
            href="/admin/users"
            title="Manage Users"
            description="View and edit user roles and permissions"
            icon={<Users className="w-5 h-5" />}
          />
          <ActionCard
            href="/admin/products"
            title="Products"
            description="Manage product catalog and inventory"
            icon={<Package className="w-5 h-5" />}
          />
          <ActionCard
            href="/admin/warehouses"
            title="Warehouses"
            description="Configure warehouse locations and stock"
            icon={<Warehouse className="w-5 h-5" />}
          />
        </div>
      </div>
    </div>
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

function ActionCard({
  href,
  title,
  description,
  icon,
  disabled = false,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="p-5 rounded-xl border border-gray-200 transition-all opacity-50 cursor-not-allowed">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="p-5 rounded-xl border border-gray-200 transition-all hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}

import Link from 'next/link';
import { Package, Warehouse } from 'lucide-react';
