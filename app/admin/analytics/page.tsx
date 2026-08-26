'use client';

import { useState } from 'react';
import { TrendingUp, Package, Sparkles, AlertTriangle } from 'lucide-react';
import type { AITrendAnalysis, AIReorderPrediction } from '@/lib/validations';

export default function AdminAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<AITrendAnalysis | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const handleAnalyzeTrends = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/ai/trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period, limit: 10 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setTrendAnalysis(data);
      setMessage({ type: 'success', text: 'Analysis completed successfully!' });
    } catch (error) {
      console.error('Trends analysis error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Analysis failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Analytics</h1>
        <p className="text-gray-600">AI-powered insights and predictions for your inventory</p>
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

      {/* Sales Trends Analysis */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Sales Trends Analysis
              </h2>
              <p className="text-sm text-gray-600">
                AI-powered analysis of top and slow-moving products
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as '7d' | '30d' | '90d')}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button
              onClick={handleAnalyzeTrends}
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Sparkles className="w-5 h-5" />
              <span>{isLoading ? 'Analyzing...' : 'Analyze Trends'}</span>
            </button>
          </div>
        </div>

        {trendAnalysis ? (
          <div className="space-y-6">
            {/* Top Movers */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Top Moving Products
              </h3>
              <div className="space-y-2">
                {trendAnalysis.topMovers.map((product, index) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-green-800">#{index + 1}</span>
                        <span className="font-medium text-gray-900">{product.productName}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{product.trend}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-700">{product.unitsSold}</p>
                      <p className="text-xs text-gray-600">units sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Slow Movers */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Slow Moving Products
              </h3>
              <div className="space-y-2">
                {trendAnalysis.slowMovers.map((product, index) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{product.productName}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {product.daysInStock} days in stock
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-orange-700">{product.unitsSold}</p>
                      <p className="text-xs text-gray-600">units sold</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                AI Insights
              </h3>
              <div className="space-y-2">
                {trendAnalysis.insights.map((insight, index) => (
                  <div
                    key={index}
                    className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
                  >
                    <p className="text-gray-800">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No analysis data yet</p>
            <p className="text-sm text-gray-500">
              Click "Analyze Trends" to generate AI-powered insights
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-purple-900 mb-1">
              Powered by Gemini AI
            </p>
            <p className="text-sm text-purple-800">
              AI analysis provides actionable insights based on your sales data, inventory levels, and market trends. Use these recommendations to optimize stock levels and improve sales performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
