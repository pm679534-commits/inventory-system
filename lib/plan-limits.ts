// Plan-based access control helper functions

export type PlanType = 'starter' | 'professional' | 'enterprise';

export interface PlanLimits {
  maxWarehouses: number | null; // null = unlimited
  maxProducts: number | null;
  maxOrdersPerMonth: number | null;
  hasAIAnalytics: boolean;
  hasAdvancedReports: boolean;
  hasAPIAccess: boolean;
  hasExport: boolean;
  maxUsers: number | null;
}

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  starter: {
    maxWarehouses: 2,
    maxProducts: 500,
    maxOrdersPerMonth: 1000,
    hasAIAnalytics: false,
    hasAdvancedReports: false,
    hasAPIAccess: false,
    hasExport: true, // Excel/CSV only
    maxUsers: 1,
  },
  professional: {
    maxWarehouses: 10,
    maxProducts: 5000,
    maxOrdersPerMonth: null, // unlimited
    hasAIAnalytics: true,
    hasAdvancedReports: true,
    hasAPIAccess: false,
    hasExport: true, // All formats
    maxUsers: 10,
  },
  enterprise: {
    maxWarehouses: null, // unlimited
    maxProducts: null,
    maxOrdersPerMonth: null,
    hasAIAnalytics: true,
    hasAdvancedReports: true,
    hasAPIAccess: true,
    hasExport: true, // All formats
    maxUsers: null,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  const normalizedPlan = plan.toLowerCase() as PlanType;
  return PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS.starter;
}

export function canAccessFeature(
  feature: keyof PlanLimits,
  currentPlan: string
): boolean {
  const limits = getPlanLimits(currentPlan);
  const value = limits[feature];

  if (typeof value === 'boolean') {
    return value;
  }

  return value === null; // null means unlimited
}

export function canAccessExport(currentPlan: string): boolean {
  return getPlanLimits(currentPlan).hasExport;
}

export function canAccessAIAnalytics(currentPlan: string): boolean {
  return getPlanLimits(currentPlan).hasAIAnalytics;
}

export function canAccessAPIAccess(currentPlan: string): boolean {
  return getPlanLimits(currentPlan).hasAPIAccess;
}

export function getWarehouseLimit(currentPlan: string): number | null {
  return getPlanLimits(currentPlan).maxWarehouses;
}

export function getProductLimit(currentPlan: string): number | null {
  return getPlanLimits(currentPlan).maxProducts;
}

export function getOrderLimit(currentPlan: string): number | null {
  return getPlanLimits(currentPlan).maxOrdersPerMonth;
}

export function getUserLimit(currentPlan: string): number | null {
  return getPlanLimits(currentPlan).maxUsers;
}

export function hasReachedLimit(
  limitType: 'maxWarehouses' | 'maxProducts' | 'maxOrdersPerMonth' | 'maxUsers',
  currentCount: number,
  currentPlan: string
): boolean {
  const limits = getPlanLimits(currentPlan);
  const limit = limits[limitType];

  if (limit === null) {
    return false; // unlimited
  }

  return currentCount >= limit;
}

export function getUpgradeMessage(
  limitType: 'maxWarehouses' | 'maxProducts' | 'maxOrdersPerMonth' | 'maxUsers',
  currentPlan: string
): string {
  const limits = getPlanLimits(currentPlan);
  const limit = limits[limitType];

  const messages = {
    maxWarehouses: `Plan limitinə çatdınız (${limit} anbar). Daha çox anbar əlavə etmək üçün planınızı yüksəldin.`,
    maxProducts: `Plan limitinə çatdınız (${limit} məhsul). Daha çox məhsul əlavə etmək üçün planınızı yüksəldin.`,
    maxOrdersPerMonth: `Bu ay sifariş limitinə çatdınız (${limit}). Limitsiz sifarişlər üçün planınızı yüksəldin.`,
    maxUsers: `İstifadəçi limitinə çatdınız (${limit}). Daha çox istifadəçi əlavə etmək üçün planınızı yüksəldin.`,
  };

  return messages[limitType];
}

// Helper to check if user should see upgrade prompts
export function shouldShowUpgradePrompt(
  limitType: 'maxWarehouses' | 'maxProducts' | 'maxOrdersPerMonth' | 'maxUsers',
  currentCount: number,
  currentPlan: string
): boolean {
  const limits = getPlanLimits(currentPlan);
  const limit = limits[limitType];

  if (limit === null) {
    return false; // unlimited plan
  }

  // Show prompt when at 80% of limit
  return currentCount >= limit * 0.8;
}
