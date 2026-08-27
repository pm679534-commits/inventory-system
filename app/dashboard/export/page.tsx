'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, FileType, Download, Loader2, Lock } from 'lucide-react';
import { t } from '@/lib/i18n';

type EntityType = 'products' | 'warehouses' | 'orders';
type ExportFormat = 'excel' | 'csv';

export default function ExportPage() {
  const [entityType, setEntityType] = useState<EntityType>('products');
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user profile to check role
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const profile = await response.json();
          setUserRole(profile.role);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          format,
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
        : `${entityType}_export_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;

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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t.exports.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t.exports.subtitle}</p>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Yüklənir...</p>
        </div>
      ) : userRole && userRole !== 'Admin' && userRole !== 'Manager' ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Giriş məhduddur
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Bu funksiya yalnız administratorlar və menecerlər üçün əlçatandır.
          </p>
        </div>
      ) : (
        <>
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

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="space-y-6">
          {/* Entity Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t.exports.exportType}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setEntityType('products')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  entityType === 'products'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {t.exports.exportProducts}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  SKU, qiymət, stok
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEntityType('warehouses')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  entityType === 'warehouses'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {t.exports.exportWarehouses}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Anbar məlumatları
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEntityType('orders')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  entityType === 'orders'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {t.exports.exportOrders}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Sifariş tarixçəsi
                </div>
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t.exports.exportFormat}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormat('excel')}
                className={`p-4 rounded-lg border-2 transition-all flex items-start space-x-3 ${
                  format === 'excel'
                    ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700'
                }`}
              >
                <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-left flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {t.exports.formatExcel}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Formatlanmış Excel faylı
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-4 rounded-lg border-2 transition-all flex items-start space-x-3 ${
                  format === 'csv'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
              >
                <FileType className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-left flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {t.exports.formatCSV}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Universal CSV formatı
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Export Button */}
          <div className="pt-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 dark:bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.exports.exporting}</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>{t.common.export}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Qeyd:</strong> {t.exports.auditNote}
        </p>
      </div>
        </>
      )}
    </div>
  );
}
