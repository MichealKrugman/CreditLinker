import { prisma } from '@/lib/database/prisma';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface MonthlyRevenue {
  month: string; // YYYY-MM format
  revenue: number;
  transactionCount: number;
}

export interface RevenueMetrics {
  monthlyRevenue: MonthlyRevenue[];
  totalRevenue: number;
  averageMonthlyRevenue: number;
  growthRate: number; // Month-over-month average growth percentage
  consistency: number; // 0-100 score (higher = more consistent)
  trend: 'increasing' | 'decreasing' | 'stable';
}

/**
 * Calculate comprehensive revenue metrics for a business
 */
export async function calculateRevenueMetrics(
  businessId: string,
  startDate?: Date,
  endDate?: Date
): Promise<RevenueMetrics> {
  // Get all CREDIT transactions (revenue)
  const transactions = await prisma.transaction.findMany({
    where: {
      import: {
        businessId,
      },
      type: 'CREDIT',
      category: 'INCOME',
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
      amount: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  if (transactions.length === 0) {
    return {
      monthlyRevenue: [],
      totalRevenue: 0,
      averageMonthlyRevenue: 0,
      growthRate: 0,
      consistency: 0,
      trend: 'stable',
    };
  }

  // Group by month
  const monthlyRevenue = calculateMonthlyRevenue(transactions);

  // Calculate aggregates
  const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0);
  const averageMonthlyRevenue = totalRevenue / monthlyRevenue.length;

  // Calculate growth rate
  const growthRate = calculateRevenueGrowth(monthlyRevenue);

  // Calculate consistency score
  const consistency = calculateRevenueConsistency(monthlyRevenue);

  // Determine trend
  const trend = determineRevenueTrend(monthlyRevenue);

  return {
    monthlyRevenue,
    totalRevenue,
    averageMonthlyRevenue,
    growthRate,
    consistency,
    trend,
  };
}

/**
 * Group transactions by month and calculate totals
 */
function calculateMonthlyRevenue(
  transactions: Array<{ date: Date; amount: number }>
): MonthlyRevenue[] {
  const monthMap = new Map<string, { revenue: number; count: number }>();

  for (const transaction of transactions) {
    const monthKey = format(transaction.date, 'yyyy-MM');

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { revenue: 0, count: 0 });
    }

    const monthData = monthMap.get(monthKey)!;
    monthData.revenue += transaction.amount;
    monthData.count += 1;
  }

  // Convert to array and sort by month
  return Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      transactionCount: data.count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculate average month-over-month growth rate
 * Returns percentage (e.g., 5.2 means 5.2% average growth)
 */
export function calculateRevenueGrowth(monthlyRevenue: MonthlyRevenue[]): number {
  if (monthlyRevenue.length < 2) {
    return 0;
  }

  const growthRates: number[] = [];

  for (let i = 1; i < monthlyRevenue.length; i++) {
    const previousMonth = monthlyRevenue[i - 1].revenue;
    const currentMonth = monthlyRevenue[i].revenue;

    if (previousMonth > 0) {
      const growthRate = ((currentMonth - previousMonth) / previousMonth) * 100;
      growthRates.push(growthRate);
    }
  }

  if (growthRates.length === 0) {
    return 0;
  }

  // Return average growth rate
  return growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
}

/**
 * Calculate revenue consistency score (0-100)
 * Based on coefficient of variation - lower variation = higher score
 */
export function calculateRevenueConsistency(
  monthlyRevenue: MonthlyRevenue[]
): number {
  if (monthlyRevenue.length < 2) {
    return 100; // Perfect consistency with only one month
  }

  const revenues = monthlyRevenue.map((m) => m.revenue);
  const mean = revenues.reduce((sum, val) => sum + val, 0) / revenues.length;

  // Calculate standard deviation
  const variance =
    revenues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    revenues.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (CV)
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  // Convert CV to score (0-100)
  // CV of 0% = score 100 (perfect consistency)
  // CV of 50% = score 50
  // CV of 100%+ = score 0 (very inconsistent)
  const score = Math.max(0, Math.min(100, 100 - cv));

  return Math.round(score);
}

/**
 * Determine revenue trend (increasing, decreasing, stable)
 */
function determineRevenueTrend(
  monthlyRevenue: MonthlyRevenue[]
): 'increasing' | 'decreasing' | 'stable' {
  if (monthlyRevenue.length < 3) {
    return 'stable';
  }

  // Compare last 3 months average to first 3 months average
  const firstThreeAvg =
    monthlyRevenue.slice(0, 3).reduce((sum, m) => sum + m.revenue, 0) / 3;
  const lastThreeAvg =
    monthlyRevenue
      .slice(-3)
      .reduce((sum, m) => sum + m.revenue, 0) / 3;

  const changePercent = ((lastThreeAvg - firstThreeAvg) / firstThreeAvg) * 100;

  if (changePercent > 5) return 'increasing';
  if (changePercent < -5) return 'decreasing';
  return 'stable';
}

/**
 * Get revenue for a specific month
 */
export async function getRevenueForMonth(
  businessId: string,
  year: number,
  month: number // 1-12
): Promise<number> {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  const result = await prisma.transaction.aggregate({
    where: {
      import: {
        businessId,
      },
      type: 'CREDIT',
      category: 'INCOME',
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  return result._sum.amount || 0;
}
