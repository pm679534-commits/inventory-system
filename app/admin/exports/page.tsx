'use client';

import { useState } from 'react';
import { FileText, FileSpreadsheet, Download, Filter } from 'lucide-react';

export default function AdminExportsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [filters, setFilters] = useState({
    stockFilter: 'all',
    warehouseId: '',
    categoryId: '',
    status: '',
  });

  const handleExport = async (type: 'excel' | '1c_xml') => {
    setIsExporting(true);
    setMessage(null);

    try {
      const endpoint = type === 'excel' ? '/api/exports/excel' : '/api/exports/1c-xml';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stockFilter: filters.stockFilter !== 'all' ? filters.stockFilter : undefined,
          warehouseId: filters.warehouseId || undefined,
          categoryId: filters.categoryId || undefined,
          status: filters.status || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `export_${Date.now()}.${type === 'excel' ? 'xlsx' : 'zip'}`;

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

      setMessage({ type: 'success', text: 'Export completed successfully!' });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Export failed. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Exports</h1>
        <p className="text-gray-600">Export inventory data in multiple formats</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Export Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Stock Filter
            </label>
            <select
              value={filters.stockFilter}
              onChange={(e) => setFilters({ ...filters, stockFilter: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Products</option>
              <option value="in_stock">In Stock Only</option>
              <option value="out_of_stock">Out of Stock Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Warehouse
            </label>
            <input
              type="text"
              value={filters.warehouseId}
              onChange={(e) => setFilters({ ...filters, warehouseId: e.target.value })}
              placeholder="Warehouse ID (optional)"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category
            </label>
            <input
              type="text"
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              placeholder="Category ID (optional)"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Excel Export */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Excel Export
              </h3>
              <p className="text-sm text-gray-600">
                Multi-sheet Excel workbook with summary and warehouse breakdowns
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
              Formatted headers and columns
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
              One sheet per warehouse + summary
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
              Proper number and currency formatting
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
              Color-coded status and stock levels
            </div>
          </div>

          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-5 h-5" />
            <span>{isExporting ? 'Exporting...' : 'Export to Excel'}</span>
          </button>
        </div>

        {/* 1C XML Export */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-start space-x-4 mb-6">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                1C XML Export
              </h3>
              <p className="text-sm text-gray-600">
                CommerceML 2.x format for 1C integration (catalog + offers)
              </p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
              Valid CommerceML 2.x format
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
              Catalog (Классификатор/Каталог)
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
              Offers (ПакетПредложений)
            </div>
            <div className="flex items-center text-sm text-gray-700">
              <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
              Stable UUIDs for incremental updates
            </div>
          </div>

          <button
            onClick={() => handleExport('1c_xml')}
            disabled={isExporting}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-5 h-5" />
            <span>{isExporting ? 'Exporting...' : 'Export to 1C XML'}</span>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> All exports are logged for audit purposes. Large exports may take a few moments to process.
        </p>
      </div>
    </div>
  );
}
