'use client';

import { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Download, Filter, FileType } from 'lucide-react';
import { t } from '@/lib/i18n';

export default function AdminExportsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [filters, setFilters] = useState({
    exportType: 'products' as 'products' | 'warehouses' | 'orders' | 'all',
    format: 'excel' as 'excel' | 'csv' | '1c_xml',
    stockFilter: 'all',
    warehouseId: '',
    categoryId: '',
    status: '',
    orderStatus: '',
    startDate: '',
    endDate: '',
  });

  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    // Fetch warehouses and categories for filters
    const fetchFilterData = async () => {
      try {
        const [warehousesRes, categoriesRes] = await Promise.all([
          fetch('/api/warehouses'),
          fetch('/api/categories'),
        ]);

        if (warehousesRes.ok) {
          const data = await warehousesRes.json();
          setWarehouses(Array.isArray(data) ? data : []);
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch filter data:', error);
      }
    };

    fetchFilterData();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const endpoint = filters.format === 'excel'
        ? '/api/exports/excel'
        : filters.format === 'csv'
        ? '/api/exports/csv'
        : '/api/exports/1c-xml';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exportType: filters.exportType,
          format: filters.format,
          stockFilter: filters.stockFilter !== 'all' ? filters.stockFilter : undefined,
          warehouseId: filters.warehouseId || undefined,
          categoryId: filters.categoryId || undefined,
          status: filters.status || undefined,
          orderStatus: filters.orderStatus || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.exports.exportFailed);
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `export_${Date.now()}.${filters.format === 'excel' ? 'xlsx' : filters.format === 'csv' ? 'csv' : 'zip'}`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: t.exports.exportSuccess });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : t.exports.exportFailed,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t.exports.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t.exports.subtitle}</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t.exports.exportFilters}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Export Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t.exports.exportType}
            </label>
            <select
              value={filters.exportType}
              onChange={(e) => setFilters({ ...filters, exportType: e.target.value as any })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="products">{t.exports.exportProducts}</option>
              <option value="warehouses">{t.exports.exportWarehouses}</option>
              <option value="orders">{t.exports.exportOrders}</option>
              <option value="all">{t.exports.exportAll}</option>
            </select>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t.exports.exportFormat}
            </label>
            <select
              value={filters.format}
              onChange={(e) => setFilters({ ...filters, format: e.target.value as any })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="excel">{t.exports.formatExcel}</option>
              <option value="csv">{t.exports.formatCSV}</option>
              <option value="1c_xml">{t.exports.format1C}</option>
            </select>
          </div>

          {/* Stock Filter (for products) */}
          {(filters.exportType === 'products' || filters.exportType === 'all') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.exports.stockFilter}
              </label>
              <select
                value={filters.stockFilter}
                onChange={(e) => setFilters({ ...filters, stockFilter: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="all">{t.exports.allProducts}</option>
                <option value="in_stock">{t.exports.inStockOnly}</option>
                <option value="out_of_stock">{t.exports.outOfStockOnly}</option>
              </select>
            </div>
          )}

          {/* Product Status (for products) */}
          {(filters.exportType === 'products' || filters.exportType === 'all') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.exports.productStatus}
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">{t.exports.allStatuses}</option>
                <option value="active">{t.products.active}</option>
                <option value="inactive">{t.products.inactive}</option>
                <option value="discontinued">{t.products.discontinued}</option>
              </select>
            </div>
          )}

          {/* Warehouse Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t.exports.warehouseFilter}
            </label>
            <select
              value={filters.warehouseId}
              onChange={(e) => setFilters({ ...filters, warehouseId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">{t.exports.allWarehouses}</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter (for products) */}
          {(filters.exportType === 'products' || filters.exportType === 'all') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.exports.categoryFilter}
              </label>
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">{t.exports.allCategories}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Order Status (for orders) */}
          {(filters.exportType === 'orders' || filters.exportType === 'all') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.exports.orderStatus}
              </label>
              <select
                value={filters.orderStatus}
                onChange={(e) => setFilters({ ...filters, orderStatus: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">{t.exports.allStatuses}</option>
                <option value="pending">{t.orders.pending}</option>
                <option value="processing">{t.orders.processing}</option>
                <option value="shipped">{t.orders.shipped}</option>
                <option value="delivered">{t.orders.delivered}</option>
                <option value="cancelled">{t.orders.cancelled}</option>
              </select>
            </div>
          )}

          {/* Date Range (for orders) */}
          {(filters.exportType === 'orders' || filters.exportType === 'all') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.exports.startDate}
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.exports.endDate}
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Export Options */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Excel Export */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-14 h-14 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t.exports.excelExport}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.exports.excelDescription}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
              {t.exports.excelFeature1}
            </div>
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
              {t.exports.excelFeature2}
            </div>
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
              {t.exports.excelFeature3}
            </div>
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
              {t.exports.excelFeature4}
            </div>
          </div>

          <button
            onClick={() => {
              setFilters({ ...filters, format: 'excel' });
              setTimeout(handleExport, 100);
            }}
            disabled={isExporting}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 dark:bg-green-700 text-white font-semibold rounded-lg hover:bg-green-700 dark:hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-5 h-5" />
            <span>{isExporting && filters.format === 'excel' ? t.exports.exporting : t.exports.exportToExcel}</span>
          </button>
        </div>

        {/* CSV Export */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileType className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t.exports.csvExport}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.exports.csvDescription}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
              {t.exports.csvFeature1}
            </div>
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
              {t.exports.csvFeature2}
            </div>
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
              {t.exports.csvFeature3}
            </div>
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mr-2"></span>
              {t.exports.csvFeature4}
            </div>
          </div>

          <button
            onClick={() => {
              setFilters({ ...filters, format: 'csv' });
              setTimeout(handleExport, 100);
            }}
            disabled={isExporting}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-5 h-5" />
            <span>{isExporting && filters.format === 'csv' ? t.exports.exporting : t.exports.exportToCSV}</span>
          </button>
        </div>

        {/* 1C XML Export */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {t.exports.xml1CExport}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.exports.xml1CDescription}
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full mr-2"></span>
              {t.exports.xml1CFeature1}
            </div>
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full mr-2"></span>
              {t.exports.xml1CFeature2}
            </div>
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full mr-2"></span>
              {t.exports.xml1CFeature3}
            </div>
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full mr-2"></span>
              {t.exports.xml1CFeature4}
            </div>
          </div>

          <button
            onClick={() => {
              setFilters({ ...filters, format: '1c_xml' });
              setTimeout(handleExport, 100);
            }}
            disabled={isExporting}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 dark:bg-purple-700 text-white font-semibold rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-5 h-5" />
            <span>{isExporting && filters.format === '1c_xml' ? t.exports.exporting : t.exports.exportTo1C}</span>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>{t.reports.fromDeliveredOrders}:</strong> {t.exports.auditNote}
        </p>
      </div>
    </div>
  );
}
