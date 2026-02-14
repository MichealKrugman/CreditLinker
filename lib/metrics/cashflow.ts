import { prisma } from '@/lib/database/prisma';
import { format } from 'date-fns';
import { calculateRevenueMetrics } from './revenue';
import { calculateExpenseMetrics } from './expenses';

export interface MonthlyCashflow {
  month: string; // YYYY-MM format
  revenue: number;
  expenses: number;
  netCashflow: number;
  isPositive: boolean;
}

export interface CashflowMetrics {
  monthlyCashflow: MonthlyCashflow[];
  totalRevenue: number;
  totalExpenses: number;
  netCashflow: number;
  averageMonthlyCashflow: number;
  positiveMonths: number; // Count of months with positive cashflow
  positiveMonthsPercentage: number;
  cashflowBuffer: number; // Days of expenses covered by average cashflow
  burnRate: number; // Average monthly cash burn (negative cashflow months)
  runwayMonths: number; // Months until cash runs out (if applicable)
}

/**
 * Calculate comprehensive cashflow metrics for a business
 */
export async function calculateCashflowMetrics(
  businessId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CashflowMetrics> {
  // Get revenue and expense metrics
  const [revenueMetrics, expenseMetrics] = await Promise.all([
    calculateRevenueMetrics(businessId, startDate, endDate),
    calculateExpenseMetrics(businessId, startDate, endDate),
  ]);

  // Combine into monthly cashflow
  const monthlyCashflow = calculateMonthlyCashflow(
    revenueMetrics.monthlyRevenue,
    expenseMetrics.monthlyExpenses
  );

  // Calculate aggregates
  const totalRevenue = revenueMetrics.totalRevenue;
  const totalExpenses = expenseMetrics.totalExpenses;
  const netCashflow = totalRevenue - totalExpenses;
  const averageMonthlyCashflow =
    monthlyCashflow.length > 0
      ? monthlyCashflow.reduce((sum, m) => sum + m.netCashflow, 0) /
        monthlyCashflow.length
      : 0;

  // Calculate positive months
  const positiveMonths = monthlyCashflow.filter((m) => m.isPositive).length;
  const positiveMonthsPercentage =
    monthlyCashflow.length > 0
      ? (positiveMonths / monthlyCashflow.length) * 100
      : 0;

  // Calculate cashflow buffer (days of expenses covered)
  const cashflowBuffer = calculateCashflowBuffer(
    averageMonthlyCashflow,
    expenseMetrics.averageMonthlyExpenses
  );

  // Calculate burn rate and runway
  const burnRate = calculateBurnRate(monthlyCashflow);
  const runwayMonths = calculateRunway(
    netCashflow,
    burnRate,
    expenseMetrics.averageMonthlyExpenses
  );

  return {
    monthlyCashflow,
    totalRevenue,
    totalExpenses,
    netCashflow,
    averageMonthlyCashflow,
    positiveMonths,
    positiveMonthsPercentage,
    cashflowBuffer,
    burnRate,
    runwayMonths,
  };
}

/**
 * Combine revenue and expense data into monthly cashflow
 */
function calculateMonthlyCashflow(
  monthlyRevenue: Array<{ month: string; revenue: number }>,
  monthlyExpenses: Array<{ month: string; expenses: number }>
): MonthlyCashflow[] {
  // Create a map of all unique months
  const monthSet = new Set<string>();
  monthlyRevenue.forEach((m) => monthSet.add(m.month));
  monthlyExpenses.forEach((m) => monthSet.add(m.month));

  // Create lookup maps
  const revenueMap = new Map(monthlyRevenue.map((m) => [m.month, m.revenue]));
  const expenseMap = new Map(monthlyExpenses.map((m) => [m.month, m.expenses]));

  // Build cashflow array
  const cashflow: MonthlyCashflow[] = [];

  for (const month of Array.from(monthSet).sort()) {
    const revenue = revenueMap.get(month) || 0;
    const expenses = expenseMap.get(month) || 0;
    const netCashflow = revenue - expenses;

    cashflow.push({
      month,
      revenue,
      expenses,
      netCashflow,
      isPositive: netCashflow >= 0,
    });
  }

  return cashflow;
}

/**
 * Calculate cashflow buffer in days
 * How many days of expenses can be covered by average positive cashflow
 */
export function calculateCashflowBuffer(
  averageMonthlyCashflow: number,
  averageMonthlyExpenses: number
): number {
  if (averageMonthlyExpenses <= 0 || averageMonthlyCashflow <= 0) {
    return 0;
  }

  // Daily expense rate
  const dailyExpenses = averageMonthlyExpenses / 30;

  // Days covered by average monthly cashflow
  const daysCovered = averageMonthlyCashflow / dailyExpenses;

  return Math.round(daysCovered);
}

/**
 * Calculate burn rate (average negative cashflow per month)
 * Only considers months with negative cashflow
 */
function calculateBurnRate(monthlyCashflow: MonthlyCashflow[]): number {
  const negativeMonths = monthlyCashflow.filter((m) => !m.isPositive);

  if (negativeMonths.length === 0) {
    return 0;
  }

  const totalBurn = negativeMonths.reduce(
    (sum, m) => sum + Math.abs(m.netCashflow),
    0
  );

  return totalBurn / negativeMonths.length;
}

/**
 * Calculate runway in months
 * Estimates how long the business can operate if cashflow becomes negative
 */
function calculateRunway(
  currentCashBalance: number,
  burnRate: number,
  averageMonthlyExpenses: number
): number {
  // If no burn rate (all positive cashflow), return infinity indicator
  if (burnRate === 0) {
    return 999;
  }

  // If current balance is negative, runway is 0
  if (currentCashBalance <= 0) {
    return 0;
  }

  // Calculate months of runway
  const runway = currentCashBalance / burnRate;

  return Math.round(runway);
}

/**
 * Identify cashflow trends and patterns
 */
export function identifyCashflowTrends(
  monthlyCashflow: MonthlyCashflow[]
): {
  trend: 'improving' | 'declining' | 'stable';
  volatility: 'high' | 'medium' | 'low';
  consistency: number; // 0-100 score
} {
  if (monthlyCashflow.length < 3) {
    return {
      trend: 'stable',
      volatility: 'low',
      consistency: 100,
    };
  }

  // Calculate trend
  const firstHalf = monthlyCashflow.slice(0, Math.floor(monthlyCashflow.length / 2));
  const secondHalf = monthlyCashflow.slice(Math.floor(monthlyCashflow.length / 2));

  const firstHalfAvg =
    firstHalf.reduce((sum, m) => sum + m.netCashflow, 0) / firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, m) => sum + m.netCashflow, 0) / secondHalf.length;

  const changePercent =
    firstHalfAvg !== 0 ? ((secondHalfAvg - firstHalfAvg) / Math.abs(firstHalfAvg)) * 100 : 0;

  let trend: 'improving' | 'declining' | 'stable';
  if (changePercent > 10) trend = 'improving';
  else if (changePercent < -10) trend = 'declining';
  else trend = 'stable';

  // Calculate volatility
  const cashflows = monthlyCashflow.map((m) => m.netCashflow);
  const mean = cashflows.reduce((sum, val) => sum + val, 0) / cashflows.length;
  const variance =
    cashflows.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    cashflows.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

  let volatility: 'high' | 'medium' | 'low';
  if (cv > 50) volatility = 'high';
  else if (cv > 25) volatility = 'medium';
  else volatility = 'low';

  // Consistency score (inverse of CV)
  const consistency = Math.max(0, Math.min(100, 100 - cv));

  return {
    trend,
    volatility,
    consistency: Math.round(consistency),
  };
}

/**
 * Get cashflow projection for next N months
 * Based on historical average and trend
 */
export function projectCashflow(
  monthlyCashflow: MonthlyCashflow[],
  monthsAhead: number
): Array<{ month: number; projectedCashflow: number }> {
  if (monthlyCashflow.length === 0) {
    return [];
  }

  // Calculate average and trend
  const avgCashflow =
    monthlyCashflow.reduce((sum, m) => sum + m.netCashflow, 0) /
    monthlyCashflow.length;

  // Simple linear trend
  const trend = identifyCashflowTrends(monthlyCashflow);
  let trendMultiplier = 1;
  if (trend.trend === 'improving') trendMultiplier = 1.02; // 2% growth
  else if (trend.trend === 'declining') trendMultiplier = 0.98; // 2% decline

  const projections: Array<{ month: number; projectedCashflow: number }> = [];

  for (let i = 1; i <= monthsAhead; i++) {
    const projected = avgCashflow * Math.pow(trendMultiplier, i);
    projections.push({
      month: i,
      projectedCashflow: projected,
    });
  }

  return projections;
}
