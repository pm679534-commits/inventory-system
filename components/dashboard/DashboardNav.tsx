'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import { t } from '@/lib/i18n';

interface DashboardNavProps {
  user: User;
  profile: Profile | null;
}

export default function DashboardNav({ user, profile }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isAdmin = profile?.role === 'Admin';

  const navigation = [
    { name: t.nav.dashboard, href: '/dashboard', icon: LayoutDashboard },
    { name: t.nav.products, href: '/dashboard/products', icon: Package },
    { name: t.nav.warehouses, href: '/dashboard/warehouses', icon: Warehouse },
    { name: t.nav.orders, href: '/dashboard/orders', icon: ShoppingCart },
    { name: t.nav.reports, href: '/dashboard/reports', icon: FileText },
    { name: t.nav.analytics, href: '/dashboard/analytics', icon: BarChart3 },
  ];

  const bottomNavigation = [
    { name: t.nav.profile, href: '/dashboard/profile', icon: UserIcon },
    { name: t.nav.settings, href: '/dashboard/settings', icon: Settings },
  ];

  if (isAdmin) {
    bottomNavigation.unshift({
      name: t.nav.adminPanel,
      href: '/admin',
      icon: Users,
    });
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Package className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              {t.landing.warehouse}
            </span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200 dark:border-gray-700">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Package className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                {t.landing.warehouse}
              </span>
            </Link>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {profile?.full_name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{profile?.role || 'Staff'}</p>
              </div>
            </div>
          </div>

          {/* Main navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom navigation */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
            {bottomNavigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>{t.nav.logOut}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Spacer for mobile */}
      <div className="lg:hidden h-16" />
    </>
  );
}
