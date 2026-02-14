import { calculateRevenueMetrics } from '../metrics/revenue';
import { calculateExpenseMetrics } from '../metrics/expenses';
import { calculateCashflowMetrics } from '../metrics/cashflow';
import {
  calculatePositivityScore,
  calculateStabilityScore,
  calculateGrowthScore,
  calculateExpenseControlScore,
  calculateBufferScore,
  getScoreInterpretation,
  generateRecommendations,
} from './components';

export interface ScoreComponents {
  positivity: number; // 0-100
  stability: number; // 0-100
  growth: number; // 0-100
  expenseControl: number; // 0-100
  buffer: number; // 0-100
}

export interface FinancialIdentityScore {
  score: number; // 0-100 (weighted average)
  components: ScoreComponents;
  weights: {
    positivity: number; // 30%
    stability: number; // 20%
    growth: number; // 20%
    expenseControl: number; // 15%
    buffer: number; // 15%
  };
  interpretation: {
    grade: string;
    label: string;
    color: string;
    description: string;
  };
  recommendations: string[];
  dataPoints: number; // Number of months analyzed
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * Calculate Financial Identity Score (0-100)
 * Main scoring algorithm with weighted components
 */
export async function calculateIdentityScore(
  businessId: string,
  startDate?: Date,
  endDate?: Date
): Promise<FinancialIdentityScore> {
  // Calculate all metrics
  const [revenueMetrics, expenseMetrics, cashflowMetrics] = await Promise.all([
    calculateRevenueMetrics(businessId, startDate, endDate),
    calculateExpenseMetrics(businessId, startDate, endDate),
    calculateCashflowMetrics(businessId, startDate, endDate),
  ]);

  // Calculate component scores
  const components: ScoreComponents = {
    positivity: calculatePositivityScore(cashflowMetrics.monthlyCashflow),
    stability: calculateStabilityScore(revenueMetrics.monthlyRevenue),
    growth: calculateGrowthScore(
      revenueMetrics.monthlyRevenue,
      revenueMetrics.growthRate
    ),
    expenseControl: calculateExpenseControlScore(expenseMetrics.monthlyExpenses),
    buffer: calculateBufferScore(
      cashflowMetrics.cashflowBuffer,
      cashflowMetrics.averageMonthlyCashflow
    ),
  };

  // Define weights (must sum to 100%)
  const weights = {
    positivity: 0.30, // 30%
    stability: 0.20, // 20%
    growth: 0.20, // 20%
    expenseControl: 0.15, // 15%
    buffer: 0.15, // 15%
  };

  // Calculate weighted score
  const score = Math.round(
    components.positivity * weights.positivity +
      components.stability * weights.stability +
      components.growth * weights.growth +
      components.expenseControl * weights.expenseControl +
      components.buffer * weights.buffer
  );

  // Get interpretation
  const interpretation = getScoreInterpretation(score);

  // Generate recommendations
  const recommendations = generateRecommendations(components);

  // Determine date range
  const allMonths = [
    ...revenueMetrics.monthlyRevenue.map((m) => m.month),
    ...expenseMetrics.monthlyExpenses.map((m) => m.month),
  ].sort();

  const dateRange = {
    start: allMonths[0] || '',
    end: allMonths[allMonths.length - 1] || '',
  };

  return {
    score,
    components,
    weights: {
      positivity: weights.positivity * 100,
      stability: weights.stability * 100,
      growth: weights.growth * 100,
      expenseControl: weights.expenseControl * 100,
      buffer: weights.buffer * 100,
    },
    interpretation,
    recommendations,
    dataPoints: Math.max(
      revenueMetrics.monthlyRevenue.length,
      expenseMetrics.monthlyExpenses.length
    ),
    dateRange,
  };
}

/**
 * Get historical scores for trend analysis
 * Calculates score for each month using rolling window
 */
export async function getHistoricalScores(
  businessId: string,
  windowMonths: number = 6
): Promise<
  Array<{
    month: string;
    score: number;
    components: ScoreComponents;
  }>
> {
  // Get all transactions to determine date range
  const transactions = await prisma.transaction.findMany({
    where: { businessId },
    select: { date: true },
    orderBy: { date: 'asc' },
  });

  if (transactions.length === 0) {
    return [];
  }

  const firstDate = transactions[0].date;
  const lastDate = transactions[transactions.length - 1].date;

  // Generate monthly windows
  const scores: Array<{
    month: string;
    score: number;
    components: ScoreComponents;
  }> = [];

  // Calculate score for each month using rolling window
  const currentDate = new Date(firstDate);
  const endDate = new Date(lastDate);

  while (currentDate <= endDate) {
    const windowEnd = new Date(currentDate);
    const windowStart = new Date(currentDate);
    windowStart.setMonth(windowStart.getMonth() - windowMonths);

    try {
      const identityScore = await calculateIdentityScore(
        businessId,
        windowStart,
        windowEnd
      );

      scores.push({
        month: format(currentDate, 'yyyy-MM'),
        score: identityScore.score,
        components: identityScore.components,
      });
    } catch (error) {
      // Skip months with insufficient data
    }

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return scores;
}

/**
 * Compare scores across different time periods
 */
export async function compareScores(
  businessId: string,
  periods: Array<{ label: string; startDate: Date; endDate: Date }>
): Promise<
  Array<{
    label: string;
    score: number;
    components: ScoreComponents;
    change?: number; // Change from previous period
  }>
> {
  const results: Array<{
    label: string;
    score: number;
    components: ScoreComponents;
    change?: number;
  }> = [];

  let previousScore: number | null = null;

  for (const period of periods) {
    const identityScore = await calculateIdentityScore(
      businessId,
      period.startDate,
      period.endDate
    );

    const change = previousScore !== null ? identityScore.score - previousScore : undefined;

    results.push({
      label: period.label,
      score: identityScore.score,
      components: identityScore.components,
      change,
    });

    previousScore = identityScore.score;
  }

  return results;
}

// Import prisma for historical queries
import { prisma } from '../database/prisma';
import { format } from 'date-fns';
