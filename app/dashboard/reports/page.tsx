'use client';

import { useEffect, useState } from 'react';
import { FileText, TrendingUp, Package, ShoppingCart, AlertTriangle, Download } from 'lucide-react';
import { t } from '@/lib/i18n';

interface ReportData {
  period: {
    start: string;
    end: string;
  };
  stock: {
    totalStock: number;
    reservedStock: number;
    availableStock: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalProducts: number;
  };
  orders: {
    totalOrders: number;
    fulfilledOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
    fulfillmentRate: number;
  };
  sales: {
    totalSold: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
}

interface Warehouse {
  id: string;
  name: string;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [warehouseId, setWarehouseId] = useState('');

  useEffect(() => {
    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);

    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchReport();
    }
  }, [startDate, endDate, warehouseId]);

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/warehouses');
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (warehouseId) params.append('warehouseId', warehouseId);

      const response = await fetch(`/api/reports?${params}`);
      if (!response.ok) throw new Error('Failed to fetch report data');

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t('reports.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('reports.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('reports.startDate')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('reports.endDate')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('reports.warehouse')}
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="">{t('reports.allWarehouses')}</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setQuickRange(7)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              {t('reports.last7Days')}
            </button>
            <button
              onClick={() => setQuickRange(30)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              {t('reports.last30Days')}
            </button>
            <button
              onClick={() => setQuickRange(90)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
            >
              {t('reports.last90Days')}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('reports.generatingReport')}</p>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title={t('reports.totalRevenue')}
              value={`$${reportData.sales.totalRevenue.toLocaleString()}`}
              icon={<TrendingUp className="w-6 h-6" />}
              color="green"
              subtitle={`${reportData.orders.fulfilledOrders} ${t('reports.deliveredOrders')}`}
            />
            <StatCard
              title={t('reports.totalOrders')}
              value={reportData.orders.totalOrders.toString()}
              icon={<ShoppingCart className="w-6 h-6" />}
              color="blue"
              subtitle={`${reportData.orders.pendingOrders} ${t('reports.pending')}`}
            />
            <StatCard
              title={t('reports.unitsSold')}
              value={reportData.sales.totalSold.toLocaleString()}
              icon={<Package className="w-6 h-6" />}
              color="purple"
              subtitle={t('reports.totalUnitsDelivered')}
            />
            <StatCard
              title={t('reports.fulfillmentRate')}
              value={`${reportData.orders.fulfillmentRate.toFixed(1)}%`}
              icon={<FileText className="w-6 h-6" />}
              color="orange"
              subtitle={`${reportData.orders.cancelledOrders} ${t('reports.cancelled')}`}
            />
          </div>

          {/* Stock Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('reports.stockSummary')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('reports.totalStock')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {reportData.stock.totalStock.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>{t('reports.reserved')}: {reportData.stock.reservedStock.toLocaleString()}</p>
                  <p>{t('reports.available')}: {reportData.stock.availableStock.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('reports.lowStockItems')}</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {reportData.stock.lowStockCount}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('reports.productsWithLessThan10Units')}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('reports.outOfStock')}</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {reportData.stock.outOfStockCount}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('reports.productsNotInStock')}
                </p>
              </div>
            </div>
          </div>

          {/* Orders Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('reports.ordersBreakdown')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {reportData.orders.pendingOrders}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('reports.pending')}</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {reportData.orders.fulfilledOrders}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('reports.delivered')}</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {reportData.orders.cancelledOrders}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('reports.cancelled')}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {reportData.orders.totalOrders}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('reports.total')}</p>
              </div>
            </div>
          </div>

          {/* Sales Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('reports.salesMetrics')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('reports.totalRevenue')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  ${reportData.sales.totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('reports.fromDeliveredOrders')}
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('reports.averageOrderValue')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  ${reportData.sales.averageOrderValue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('reports.perOrderAverage')}
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('reports.unitsSold')}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {reportData.sales.totalSold.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('reports.totalDelivered')}
                </p>
              </div>
            </div>
          </div>

          {/* Stock vs Sales */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('reports.inventoryHealth')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('reports.stockStatus')}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.totalProducts')}</span>
                    <span className="font-medium dark:text-gray-200">{reportData.stock.totalProducts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.inStock')}</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {reportData.stock.totalProducts - reportData.stock.outOfStockCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.lowStock')}</span>
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">
                      {reportData.stock.lowStockCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.outOfStock')}</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {reportData.stock.outOfStockCount}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('reports.orderPerformance')}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.fulfillmentRate')}</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {reportData.orders.fulfillmentRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.cancellationRate')}</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {reportData.orders.totalOrders > 0
                        ? ((reportData.orders.cancelledOrders / reportData.orders.totalOrders) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.pendingOrders')}</span>
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">
                      {reportData.orders.pendingOrders}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Period Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">{t('reports.reportPeriod')}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {new Date(reportData.period.start).toLocaleDateString()} -{' '}
                  {new Date(reportData.period.end).toLocaleDateString()}
                  {warehouseId && warehouses.find(w => w.id === warehouseId) && (
                    <span className="ml-2">
                      • {warehouses.find(w => w.id === warehouseId)?.name}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                {t('reports.printReport')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
  subtitle?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </div>
  );
}
