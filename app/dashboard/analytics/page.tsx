'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Package, Sparkles, AlertCircle } from 'lucide-react';
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

interface ReorderPrediction {
  productId: string;
  currentStock: number;
  averageDailySales: number;
  daysToStockout: number;
  suggestedReorderQuantity: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Warehouse {
  id: string;
  name: string;
}

export default function AnalyticsPage() {
  const [trendsAnalysis, setTrendsAnalysis] = useState<TrendsAnalysis | null>(null);
  const [reorderPrediction, setReorderPrediction] = useState<ReorderPrediction | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trendsPeriod, setTrendsPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [trendsLimit, setTrendsLimit] = useState(10);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

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

  const predictReorder = async () => {
    if (!selectedProductId) {
      setError('Zəhmət olmasa məhsul seçin');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setReorderPrediction(null);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch('/api/ai/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          warehouseId: selectedWarehouseId || undefined,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Proqnozlaşdırma uğursuz oldu');
      }

      const data = await response.json();
      setReorderPrediction(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Sorğu vaxt bitdi. Zəhmət olmasa yenidən cəhd edin.');
      } else {
        setError(err instanceof Error ? err.message : 'Proqnozlaşdırma uğursuz oldu');
      }
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800';
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trends Analysis */}
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

        {/* Reorder Prediction */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t.analytics.reorderPrediction}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.analytics.aiPoweredForecasting}</p>
            </div>
          </div>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.analytics.selectProduct} <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">{t.analytics.chooseProduct}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.analytics.warehouse}
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                <option value="">{t.analytics.allWarehouses}</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={predictReorder}
            disabled={loading || !selectedProductId}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? t.analytics.predicting : t.analytics.predictReorder}
          </button>

          {reorderPrediction && (
            <div className="mt-6 space-y-4">
              {/* Current Status */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t.analytics.currentStatus}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t.analytics.currentStock}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {reorderPrediction.currentStock}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t.analytics.avgDailySales}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {reorderPrediction.averageDailySales.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prediction */}
              <div
                className={`rounded-lg p-4 ${
                  reorderPrediction.daysToStockout <= 7
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
                    : reorderPrediction.daysToStockout <= 14
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700'
                    : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
                }`}
              >
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t.analytics.prediction}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t.analytics.daysToStockout}</p>
                    <p
                      className={`text-2xl font-bold ${
                        reorderPrediction.daysToStockout <= 7
                          ? 'text-red-600'
                          : reorderPrediction.daysToStockout <= 14
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    >
                      {reorderPrediction.daysToStockout === 0
                        ? t.analytics.outOfStock
                        : `${reorderPrediction.daysToStockout} ${t.analytics.days}`}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t.analytics.suggestedReorderQuantity}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {reorderPrediction.suggestedReorderQuantity} {t.analytics.units}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t.analytics.confidenceLevel}</p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getConfidenceColor(
                        reorderPrediction.confidence
                      )}`}
                    >
                      {reorderPrediction.confidence === 'high' ? t.analytics.high : reorderPrediction.confidence === 'medium' ? t.analytics.medium : t.analytics.low}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {t.analytics.aiReasoning}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{reorderPrediction.reasoning}</p>
              </div>

              {/* Recommendation */}
              {reorderPrediction.daysToStockout <= 14 && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        {t.analytics.actionRecommended}
                      </p>
                      <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                        {reorderPrediction.daysToStockout <= 7
                          ? t.analytics.criticalReorder
                          : t.analytics.warningReorder}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                {t.analytics.predictionBasedOn}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              {t.analytics.aiPoweredAnalytics}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {t.analytics.aiDescription}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
              {t.analytics.aiNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
