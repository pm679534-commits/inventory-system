import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  aiTrendAnalysisSchema,
  aiReorderPredictionSchema,
  aiProductDescriptionSchema,
  type AITrendAnalysis,
  type AIReorderPrediction,
  type AIProductDescription,
} from '@/lib/validations';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < config.maxRetries) {
        const delayMs = Math.min(
          config.baseDelay * Math.pow(2, attempt),
          config.maxDelay
        );
        await delay(delayMs);
      }
    }
  }

  throw lastError;
}

function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Never expose API keys or sensitive data
    const message = error.message.replace(/[a-zA-Z0-9_-]{39}/g, '[REDACTED]');
    return message;
  }
  return 'An unexpected error occurred';
}

export async function analyzeSalesTrends(data: {
  topProducts: Array<{ id: string; name: string; sales: number; sku: string }>;
  slowProducts: Array<{ id: string; name: string; sales: number; daysInStock: number }>;
  period: string;
}): Promise<AITrendAnalysis> {
  try {
    const prompt = `Analyze these sales trends for the ${data.period} period.

Top selling products:
${data.topProducts.map((p) => `- ${p.name} (SKU: ${p.sku}): ${p.sales} units sold`).join('\n')}

Slow moving products:
${data.slowProducts.map((p) => `- ${p.name}: ${p.sales} units sold (${p.daysInStock} days in stock)`).join('\n')}

Provide analysis in this exact JSON format:
{
  "topMovers": [
    {
      "productId": "uuid",
      "productName": "name",
      "unitsSold": number,
      "trend": "brief trend description"
    }
  ],
  "slowMovers": [
    {
      "productId": "uuid",
      "productName": "name",
      "unitsSold": number,
      "daysInStock": number
    }
  ],
  "insights": ["insight 1", "insight 2", "insight 3"]
}

Include 3-5 actionable insights about inventory management, seasonal patterns, or recommendations.`;

    const result = await retryWithBackoff(async () => {
      const response = await model.generateContent(prompt);
      const text = response.response.text();

      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const jsonData = JSON.parse(jsonMatch[1]);
      return aiTrendAnalysisSchema.parse(jsonData);
    });

    return result;
  } catch (error) {
    console.error('Error analyzing sales trends:', error);

    // Fallback response
    return {
      topMovers: data.topProducts.slice(0, 5).map((p) => ({
        productId: p.id,
        productName: p.name,
        unitsSold: p.sales,
        trend: 'High demand product',
      })),
      slowMovers: data.slowProducts.slice(0, 5).map((p) => ({
        productId: p.id,
        productName: p.name,
        unitsSold: p.sales,
        daysInStock: p.daysInStock,
      })),
      insights: [
        'Unable to generate detailed insights at this time',
        'Please review top and slow movers manually',
        'Consider adjusting stock levels based on sales velocity',
      ],
    };
  }
}

export async function predictReorder(data: {
  productName: string;
  productId: string;
  currentStock: number;
  reservedStock: number;
  recentSales: number[];
  warehouseName?: string;
}): Promise<AIReorderPrediction> {
  try {
    const averageDailySales =
      data.recentSales.length > 0
        ? data.recentSales.reduce((a, b) => a + b, 0) / data.recentSales.length
        : 0;

    const prompt = `Analyze this product inventory and predict reorder needs.

Product: ${data.productName}
Current stock: ${data.currentStock} units
Reserved: ${data.reservedStock} units
Available: ${data.currentStock - data.reservedStock} units
Recent daily sales (last ${data.recentSales.length} days): ${data.recentSales.join(', ')}
Average daily sales: ${averageDailySales.toFixed(2)}
${data.warehouseName ? `Warehouse: ${data.warehouseName}` : ''}

Provide reorder prediction in this exact JSON format:
{
  "productId": "${data.productId}",
  "currentStock": ${data.currentStock},
  "averageDailySales": number,
  "daysToStockout": number (0 if already out of stock, or days remaining),
  "suggestedReorderQuantity": number (recommended order quantity),
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation of the recommendation"
}

Consider safety stock, lead times, and sales trends.`;

    const result = await retryWithBackoff(async () => {
      const response = await model.generateContent(prompt);
      const text = response.response.text();

      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const jsonData = JSON.parse(jsonMatch[1]);
      return aiReorderPredictionSchema.parse(jsonData);
    });

    return result;
  } catch (error) {
    console.error('Error predicting reorder:', error);

    // Fallback calculation
    const averageDailySales =
      data.recentSales.length > 0
        ? data.recentSales.reduce((a, b) => a + b, 0) / data.recentSales.length
        : 0;

    const availableStock = data.currentStock - data.reservedStock;
    const daysToStockout =
      averageDailySales > 0 ? Math.floor(availableStock / averageDailySales) : 999;

    const suggestedReorderQuantity =
      averageDailySales > 0 ? Math.ceil(averageDailySales * 30) : 100;

    return {
      productId: data.productId,
      currentStock: data.currentStock,
      averageDailySales: parseFloat(averageDailySales.toFixed(2)),
      daysToStockout: Math.max(0, daysToStockout),
      suggestedReorderQuantity,
      confidence: data.recentSales.length >= 7 ? 'medium' : 'low',
      reasoning:
        'Automatic calculation based on sales velocity. AI analysis unavailable.',
    };
  }
}

export async function generateProductDescription(data: {
  productName: string;
  shortDescription?: string;
  category?: string;
}): Promise<AIProductDescription> {
  try {
    const prompt = `Generate a professional product description for an e-commerce inventory system.

Product name: ${data.productName}
${data.shortDescription ? `Brief description: ${data.shortDescription}` : ''}
${data.category ? `Category: ${data.category}` : ''}

Provide the output in this exact JSON format:
{
  "description": "detailed product description (2-3 paragraphs, 150-200 words)",
  "shortDescription": "concise one-line description (under 100 characters)",
  "features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"]
}

Make it professional, informative, and sales-oriented.`;

    const result = await retryWithBackoff(async () => {
      const response = await model.generateContent(prompt);
      const text = response.response.text();

      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const jsonData = JSON.parse(jsonMatch[1]);
      return aiProductDescriptionSchema.parse(jsonData);
    });

    return result;
  } catch (error) {
    console.error('Error generating product description:', error);

    // Fallback response
    return {
      description: `${data.productName} is a quality product ${
        data.category ? `in the ${data.category} category` : ''
      }. ${
        data.shortDescription || 'This item is designed to meet your needs.'
      } Perfect for various applications, this product offers reliability and value. Available for immediate shipment from our warehouses.`,
      shortDescription:
        data.shortDescription ||
        `${data.productName} - Quality and reliability`,
      features: [
        'High quality construction',
        'Reliable performance',
        'Competitive pricing',
        'Fast shipping available',
        'Excellent customer support',
      ],
    };
  }
}

export function validateAPIKey(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 0;
}
