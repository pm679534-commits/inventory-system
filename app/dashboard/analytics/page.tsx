'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Sparkles, AlertCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

interface TopMover {
  productId: string;
  productName: string;
  unitsSold: number;
  trend: string;
}

interface SlowMover {
  productId: string;
  productName: string;
  unitsSold: number;
  daysInStock: number;
}

interface TrendsAnalysis {
  topMovers: TopMover[];
  slowMovers: SlowMover[];
  insights: string[];
}

export default function AnalyticsPage() {
  const [trendsAnalysis, setTrendsAnalysis] = useState<TrendsAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trendsPeriod, setTrendsPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [trendsLimit, setTrendsLimit] = useState(10);

  const analyzeTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      setTrendsAnalysis(null);

      const response = await fetch('/api/ai/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: trendsPeriod,
          limit: trendsLimit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Tendensiya təhlili uğursuz oldu');
      }

      const data = await response.json();
      setTrendsAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tendensiya təhlili uğursuz oldu');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7d':
        return 'Last 7 Days';
      case '30d':
        return 'Last 30 Days';
      case '90d':
        return 'Last 90 Days';
      default:
        return period;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t.analytics.title}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t.analytics.subtitle}</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{t.analytics.error}</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Sales Trends Analysis */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.analytics.salesTrends}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.analytics.aiPoweredAnalysis}</p>
            </div>
          </div>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.analytics.analysisPeriod}
              </label>
              <select
                value={trendsPeriod}
                onChange={(e) => setTrendsPeriod(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="7d">{t.reports.last7Days}</option>
                <option value="30d">{t.reports.last30Days}</option>
                <option value="90d">{t.reports.last90Days}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.analytics.numberOfProducts}
              </label>
              <select
                value={trendsLimit}
                onChange={(e) => setTrendsLimit(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value={5}>{t.analytics.top5}</option>
                <option value={10}>{t.analytics.top10}</option>
                <option value={20}>{t.analytics.top20}</option>
              </select>
            </div>
          </div>

          <button
            onClick={analyzeTrends}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? t.analytics.analyzing : t.analytics.analyzeTrends}
          </button>

          {trendsAnalysis && (
            <div className="mt-6 space-y-6">
              {/* Top Movers */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  {t.analytics.topSellingProducts}
                </h3>
                <div className="space-y-2">
                  {trendsAnalysis.topMovers.slice(0, 5).map((product, idx) => (
                    <div key={product.productId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{product.productName}</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{product.trend}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{product.unitsSold}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.analytics.unitsSold}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slow Movers */}
              {trendsAnalysis.slowMovers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    {t.analytics.slowMovingProducts}
                  </h3>
                  <div className="space-y-2">
                    {trendsAnalysis.slowMovers.slice(0, 5).map((product) => (
                      <div key={product.productId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{product.productName}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {product.daysInStock} {t.analytics.daysInStock}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-600">{product.unitsSold}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t.analytics.unitsSold}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Insights */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  {t.analytics.aiInsights}
                </h3>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                  <ul className="space-y-2">
                    {trendsAnalysis.insights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-purple-900 dark:text-purple-100 flex items-start gap-2">
                        <span className="text-purple-600 mt-1">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                {t.analytics.analysisPeriod}: {getPeriodLabel(trendsPeriod)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
