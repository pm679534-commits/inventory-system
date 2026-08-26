'use client';

import { useState, useEffect } from 'react';

interface Warehouse {
  id: string;
  name: string;
}

interface ReportsData {
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

export default function ReportsPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [warehouseFilter, setWarehouseFilter] = useState('');

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate, warehouseFilter]);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch('/api/warehouses');
      if (!res.ok) throw new Error('Failed to fetch warehouses');
      const data = await res.json();
      setWarehouses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        startDate,
        endDate,
      });
      if (warehouseFilter) params.append('warehouseId', warehouseFilter);

      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReportsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Warehouses</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reports Content */}
      {loading ? (
        <div className="text-center py-12">Loading reports...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded">{error}</div>
      ) : reportsData ? (
        <div className="space-y-6">
          {/* Stock Overview */}
          <div>
            <h2 className="text-xl font-bold mb-4">Stock Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">
                  {reportsData.stock.totalProducts}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-1">Total Stock</p>
                <p className="text-3xl font-bold text-gray-900">
                  {reportsData.stock.totalStock.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {reportsData.stock.reservedStock.toLocaleString()} reserved
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-1">Available Stock</p>
                <p className="text-3xl font-bold text-green-600">
                  {reportsData.stock.availableStock.toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-1">Low Stock Items</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {reportsData.stock.lowStockCount}
                </p>
                <p className="text-sm text-gray-500 mt-1">&lt; 10 units available</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-1">Out of Stock</p>
                <p className="text-3xl font-bold text-red-600">
                  {reportsData.stock.outOfStockCount}
                </p>
              </div>
            </div>
          </div>

          {/* Orders Overview */}
          <div>
            <h2 className="text-xl font-bold mb-4">Orders Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">
                  {reportsData.orders.totalOrders}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-1">Fulfilled Orders</p>
                <p className="text-3xl font-bold text-green-600">
                  {reportsData.orders.fulfilledOrders}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-1">Pending Orders</p>
                <p className="text-3xl font-bold text-blue-600">
                  {reportsData.orders.pendingOrders}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-1">Cancelled Orders</p>
                <p className="text-3xl font-bold text-red-600">
                  {reportsData.orders.cancelledOrders}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow col-span-full">
                <p className="text-sm text-gray-500 mb-1">Fulfillment Rate</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold text-gray-900">
                    {reportsData.orders.fulfillmentRate}%
                  </p>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 max-w-md">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${reportsData.orders.fulfillmentRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Overview */}
          <div>
            <h2 className="text-xl font-bold mb-4">Sales Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-1">Total Units Sold</p>
                <p className="text-3xl font-bold text-gray-900">
                  {reportsData.sales.totalSold.toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">
                  ${reportsData.sales.totalRevenue.toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-500 mb-1">Average Order Value</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${reportsData.sales.averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Period Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Report Period:</span>{' '}
              {new Date(reportsData.period.start).toLocaleDateString()} -{' '}
              {new Date(reportsData.period.end).toLocaleDateString()}
              {warehouseFilter && (
                <>
                  {' | '}
                  <span className="font-medium">Warehouse:</span>{' '}
                  {warehouses.find((w) => w.id === warehouseFilter)?.name || 'Unknown'}
                </>
              )}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
