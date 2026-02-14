import { prisma } from '@/lib/database/prisma';
import { TransactionCategory } from '@prisma/client';
import { format } from 'date-fns';

export interface MonthlyExpenses {
  month: string; // YYYY-MM format
  expenses: number;
  transactionCount: number;
  breakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface ExpenseMetrics {
  monthlyExpenses: MonthlyExpenses[];
  totalExpenses: number;
  averageMonthlyExpenses: number;
  volatility: number; // 0-100 score (higher = more volatile)
  categoryBreakdown: CategoryBreakdown[];
  topCategories: CategoryBreakdown[]; // Top 5 expense categories
}

/**
 * Calculate comprehensive expense metrics for a business
 */
export async function calculateExpenseMetrics(
  businessId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ExpenseMetrics> {
  // Get all DEBIT transactions (expenses)
  const transactions = await prisma.transaction.findMany({
    where: {
      import: {
        businessId,
      },
      type: 'DEBIT',
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
      amount: true,
      category: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  if (transactions.length === 0) {
    return {
      monthlyExpenses: [],
      totalExpenses: 0,
      averageMonthlyExpenses: 0,
      volatility: 0,
      categoryBreakdown: [],
      topCategories: [],
    };
  }

  // Group by month
  const monthlyExpenses = calculateMonthlyExpenses(transactions);

  // Calculate aggregates
  const totalExpenses = monthlyExpenses.reduce((sum, m) => sum + m.expenses, 0);
  const averageMonthlyExpenses = totalExpenses / monthlyExpenses.length;

  // Calculate volatility
  const volatility = calculateExpenseVolatility(monthlyExpenses);

  // Calculate category breakdown
  const categoryBreakdown = calculateExpenseBreakdown(transactions, totalExpenses);

  // Get top 5 categories
  const topCategories = categoryBreakdown
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    monthlyExpenses,
    totalExpenses,
    averageMonthlyExpenses,
    volatility,
    categoryBreakdown,
    topCategories,
  };
}

/**
 * Group transactions by month and calculate totals
 */
function calculateMonthlyExpenses(
  transactions: Array<{ date: Date; amount: number; category: TransactionCategory | null }>
): MonthlyExpenses[] {
  const monthMap = new Map<
    string,
    {
      expenses: number;
      count: number;
      categoryMap: Map<TransactionCategory, { amount: number; count: number }>;
    }
  >();

  for (const transaction of transactions) {
    const monthKey = format(transaction.date, 'yyyy-MM');

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        expenses: 0,
        count: 0,
        categoryMap: new Map(),
      });
    }

    const monthData = monthMap.get(monthKey)!;
    monthData.expenses += transaction.amount;
    monthData.count += 1;

    // Track by category
    if (transaction.category) {
      if (!monthData.categoryMap.has(transaction.category)) {
        monthData.categoryMap.set(transaction.category, { amount: 0, count: 0 });
      }
      const categoryData = monthData.categoryMap.get(transaction.category)!;
      categoryData.amount += transaction.amount;
      categoryData.count += 1;
    }
  }

  // Convert to array
  return Array.from(monthMap.entries())
    .map(([month, data]) => {
      const breakdown: CategoryBreakdown[] = Array.from(
        data.categoryMap.entries()
      ).map(([category, catData]) => ({
        category,
        amount: catData.amount,
        percentage: (catData.amount / data.expenses) * 100,
        transactionCount: catData.count,
      }));

      return {
        month,
        expenses: data.expenses,
        transactionCount: data.count,
        breakdown,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculate expense volatility score (0-100)
 * Based on standard deviation - higher std dev = higher volatility
 */
export function calculateExpenseVolatility(
  monthlyExpenses: MonthlyExpenses[]
): number {
  if (monthlyExpenses.length < 2) {
    return 0; // No volatility with only one month
  }

  const expenses = monthlyExpenses.map((m) => m.expenses);
  const mean = expenses.reduce((sum, val) => sum + val, 0) / expenses.length;

  // Calculate standard deviation
  const variance =
    expenses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    expenses.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  // Convert to volatility score (0-100)
  // CV of 0% = score 0 (no volatility)
  // CV of 50% = score 50
  // CV of 100%+ = score 100 (very volatile)
  const score = Math.min(100, cv);

  return Math.round(score);
}

/**
 * Calculate expense breakdown by category
 */
export function calculateExpenseBreakdown(
  transactions: Array<{ amount: number; category: TransactionCategory | null }>,
  totalExpenses: number
): CategoryBreakdown[] {
  const categoryMap = new Map<
    TransactionCategory,
    { amount: number; count: number }
  >();

  for (const transaction of transactions) {
    if (!transaction.category) continue;

    if (!categoryMap.has(transaction.category)) {
      categoryMap.set(transaction.category, { amount: 0, count: 0 });
    }

    const categoryData = categoryMap.get(transaction.category)!;
    categoryData.amount += transaction.amount;
    categoryData.count += 1;
  }

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    amount: data.amount,
    percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
    transactionCount: data.count,
  }));
}

/**
 * Get expenses for a specific category
 */
export async function getExpensesByCategory(
  businessId: string,
  category: TransactionCategory,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const result = await prisma.transaction.aggregate({
    where: {
      businessId,
      type: 'DEBIT',
      category,
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

/**
 * Identify expense anomalies (unusually high/low months)
 */
export function identifyExpenseAnomalies(
  monthlyExpenses: MonthlyExpenses[]
): Array<{ month: string; expenses: number; deviation: number; type: 'high' | 'low' }> {
  if (monthlyExpenses.length < 3) {
    return [];
  }

  const expenses = monthlyExpenses.map((m) => m.expenses);
  const mean = expenses.reduce((sum, val) => sum + val, 0) / expenses.length;

  // Calculate standard deviation
  const variance =
    expenses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    expenses.length;
  const stdDev = Math.sqrt(variance);

  const anomalies: Array<{
    month: string;
    expenses: number;
    deviation: number;
    type: 'high' | 'low';
  }> = [];

  for (const month of monthlyExpenses) {
    const deviation = (month.expenses - mean) / stdDev;

    // Flag if more than 2 standard deviations from mean
    if (Math.abs(deviation) > 2) {
      anomalies.push({
        month: month.month,
        expenses: month.expenses,
        deviation: Math.abs(deviation),
        type: month.expenses > mean ? 'high' : 'low',
      });
    }
  }

  return anomalies;
}
