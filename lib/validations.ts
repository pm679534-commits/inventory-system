import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address'),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['Admin', 'Manager', 'Staff']),
});

// Export filter schemas
export const exportFilterSchema = z.object({
  exportType: z.enum(['products', 'warehouses', 'orders', 'all']).default('products'),
  format: z.enum(['excel', 'csv', '1c_xml']).default('excel'),
  stockFilter: z.enum(['all', 'in_stock', 'out_of_stock']).optional(),
  warehouseId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
  orderStatus: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// AI request schemas
export const aiAnalyzeTrendsSchema = z.object({
  period: z.enum(['7d', '30d', '90d']).default('30d'),
  limit: z.number().min(1).max(50).default(10),
});

export const aiPredictReorderSchema = z.object({
  productId: z.string().uuid('Məhsul seçilməlidir'),
  warehouseId: z.string().uuid('Yanlış anbar ID').optional(),
});

export const aiGenerateDescriptionSchema = z.object({
  productName: z.string().min(1).max(200),
  shortDescription: z.string().min(1).max(500).optional(),
  category: z.string().optional(),
});

// AI response schemas for validation
export const aiTrendAnalysisSchema = z.object({
  topMovers: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    unitsSold: z.number(),
    trend: z.string(),
  })),
  slowMovers: z.array(z.object({
    productId: z.string(),
    productName: z.string(),
    unitsSold: z.number(),
    daysInStock: z.number(),
  })),
  insights: z.array(z.string()),
});

export const aiReorderPredictionSchema = z.object({
  productId: z.string(),
  currentStock: z.number(),
  averageDailySales: z.number(),
  daysToStockout: z.number(),
  suggestedReorderQuantity: z.number(),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string(),
});

export const aiProductDescriptionSchema = z.object({
  description: z.string(),
  shortDescription: z.string(),
  features: z.array(z.string()).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type ExportFilterInput = z.infer<typeof exportFilterSchema>;
export type AIAnalyzeTrendsInput = z.infer<typeof aiAnalyzeTrendsSchema>;
export type AIPredictReorderInput = z.infer<typeof aiPredictReorderSchema>;
export type AIGenerateDescriptionInput = z.infer<typeof aiGenerateDescriptionSchema>;
export type AITrendAnalysis = z.infer<typeof aiTrendAnalysisSchema>;
export type AIReorderPrediction = z.infer<typeof aiReorderPredictionSchema>;
export type AIProductDescription = z.infer<typeof aiProductDescriptionSchema>;
